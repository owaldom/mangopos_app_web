import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, timeout, map } from 'rxjs/operators';
import { Ticket } from './sales-history.service';
import { SettingsService } from './settings.service';

export interface PrinterConfig {
    type: string;
    interface: string;
    model: string;
    enableCashDrawer: boolean;
    autoOpenDrawer: boolean;
}

export interface PrintResponse {
    success: boolean;
    message?: string;
    error?: string;
    ticketNumber?: string;
    config?: PrinterConfig;
}

@Injectable({
    providedIn: 'root'
})
export class ThermalPrinterService {
    // URL del backend de impresión - puede configurarse desde settings
    // URL del backend de impresión - obtenido de settings o default
    private _baseUrlOverride: string | null = null;
    private get baseUrl(): string {
        if (this._baseUrlOverride) return this._baseUrlOverride;
        const settings = this.settingsService.getSettings();
        return settings?.print_server_url || 'http://localhost:3001/api';
    }
    private requestTimeout = 10000; // 10 segundos
    private settingsService = inject(SettingsService);

    constructor(private http: HttpClient) { }

    /**
     * Configura la URL del backend de impresión
     */
    setBackendUrl(url: string): void {
        this._baseUrlOverride = url;
    }

    /**
     * Obtiene la URL actual del backend
     */
    getBackendUrl(): string {
        return this.baseUrl;
    }

    /**
     * Prueba la conexión con la impresora térmica
     */
    testConnection(): Observable<PrintResponse> {
        return this.http.get<PrintResponse>(`${this.baseUrl}/print/test`).pipe(
            timeout(this.requestTimeout),
            catchError(this.handleError)
        );
    }

    /**
     * Envía una prueba de impresión a una impresora específica
     */
    testPrinter(printerName: string, width: number = 80): Observable<PrintResponse> {
        const payload = {
            printerName: printerName,
            width: width
        };
        return this.http.post<PrintResponse>(`${this.baseUrl}/print/test`, payload).pipe(
            timeout(this.requestTimeout),
            catchError(this.handleError)
        );
    }

    /**
     * Imprime un ticket en la impresora térmica
     */
    /**
     * Obtiene la configuración de roles de impresoras
     */
    getPrinterSettings(): Observable<any> {
        return this.http.get(`${this.baseUrl}/settings`).pipe(
            timeout(this.requestTimeout),
            catchError(this.handleError)
        );
    }

    /**
     * Guarda la configuración de roles de impresoras
     */
    savePrinterSettings(settings: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/settings`, settings).pipe(
            timeout(this.requestTimeout),
            catchError(this.handleError)
        );
    }

    /**
     * Imprime un ticket en la impresora térmica
     */
    printTicket(ticket: Ticket, docType: 'TICKET' | 'FISCAL' | 'REPORT' = 'TICKET'): Observable<PrintResponse> {
        const payload = {
            ticket: this.formatTicketForPrinter(ticket),
            docType: docType
        };

        return this.http.post<PrintResponse>(`${this.baseUrl}/print/ticket`, payload).pipe(
            timeout(this.requestTimeout),
            catchError(this.handleError)
        );
    }

    /**
     * Abre el cajón de dinero
     */
    openCashDrawer(): Observable<PrintResponse> {
        return this.http.post<PrintResponse>(`${this.baseUrl}/print/open-drawer`, {}).pipe(
            timeout(this.requestTimeout),
            catchError(this.handleError)
        );
    }

    /**
     * Verifica si el backend de impresión está disponible
     */
    isBackendAvailable(): Observable<boolean> {
        // Usar la raíz para un health check simple que no dispare una impresión
        const rootUrl = this.baseUrl.replace('/api', '');
        return this.http.get(rootUrl, { responseType: 'text' }).pipe(
            timeout(3000),
            map(() => true),
            catchError(() => of(false))
        );
    }

    /**
     * Obtiene la lista de impresoras configuradas en el servidor
     */
    getPrinters(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/print`).pipe(
            timeout(this.requestTimeout),
            catchError(this.handleError)
        );
    }

    /**
     * Formatea el ticket para el formato esperado por el backend
     */
    private formatTicketForPrinter(ticket: Ticket): any {
        const settings = this.settingsService.getSettings();

        return {
            // Información de la empresa desde settings
            company_name: settings?.company_name || 'MANGOPOS',
            company_address: settings?.company_address || '',
            company_phone: '',
            company_tax_id: '',

            // Información del ticket
            ticket_number: ticket.ticket_number,
            date: ticket.date,
            cashier_name: ticket.cashier_name,
            customer_name: ticket.customer_name || 'Público General',
            notes: ticket.notes || '',

            // Líneas de productos
            lines: (ticket.lines || []).map(line => ({
                product_name: line.product_name,
                units: line.units,
                price: line.price,
                discount: line.discount || 0,
                discount_type: line.discount_type || 'PERCENT',
                total: line.total
            })),

            // Totales
            subtotal: this.calculateSubtotal(ticket),
            taxes: ticket.taxes || [],
            globalDiscount: ticket.globalDiscount || 0,
            globalDiscountType: ticket.globalDiscountType || 'PERCENT',
            total: ticket.total,
            exchange_rate: ticket.exchange_rate,

            // Pagos
            payments: ticket.payments || []
        };
    }

    /**
     * Calcula el subtotal del ticket
     */
    private calculateSubtotal(ticket: Ticket): number {
        return (ticket.lines || []).reduce((sum, line) => {
            let unitPrice = line.price;
            if (line.discount) {
                if (line.discount_type === 'FIXED') {
                    unitPrice = Math.max(0, line.price - line.discount);
                } else if (line.discount_type === 'FIXED_VES') {
                    unitPrice = Math.max(0, line.price - (line.discount / ticket.exchange_rate));
                } else {
                    unitPrice = line.price * (1 - line.discount);
                }
            }
            return sum + (line.units * unitPrice);
        }, 0);
    }

    /**
     * Maneja errores de HTTP
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Error desconocido';

        if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente
            errorMessage = `Error: ${error.error.message}`;
        } else if (error.status === 0) {
            // Error de red o backend no disponible
            errorMessage = 'No se pudo conectar con el servidor de impresión. Verifique que esté corriendo.';
        } else if (error.status === 503) {
            // Impresora no disponible
            errorMessage = 'Impresora no disponible. Verifique la conexión USB.';
        } else {
            // Error del servidor
            errorMessage = error.error?.error || `Error del servidor: ${error.status}`;
        }

        return throwError(() => ({
            success: false,
            error: errorMessage
        }));
    }
}
