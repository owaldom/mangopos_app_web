import { Injectable, inject } from '@angular/core';
import { Ticket } from './sales-history.service';
import { SettingsService } from './settings.service';
import { ThermalPrinterService } from './thermal-printer.service';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PrintService {
    private settingsService = inject(SettingsService);
    private thermalPrinterService = inject(ThermalPrinterService);
    private currencyPipe = inject(CurrencyPipe);
    private datePipe = inject(DatePipe);
    private decimalPipe = inject(DecimalPipe);

    /**
     * Imprime un ticket usando SOLO impresora térmica (sin fallback a navegador)
     */
    async printTicket(ticket: Ticket): Promise<{ success: boolean; usedThermal: boolean; error?: string }> {
        try {
            console.log('Intentando imprimir en impresora térmica...');
            const result = await firstValueFrom(this.thermalPrinterService.printTicket(ticket));

            if (result.success) {
                console.log('✅ Ticket impreso exitosamente en impresora térmica');
                return { success: true, usedThermal: true };
            } else {
                console.error('❌ Error en impresión térmica:', result.error);

                // Fallback a navegador si está habilitado
                const settings = this.settingsService.getSettings();
                if (settings?.enable_pdf_ticket) {
                    console.log('⚠️ Fallback a impresión PDF activado');
                    this.printTicketBrowser(ticket);
                    return { success: true, usedThermal: false, error: result.error };
                }

                return { success: false, usedThermal: false, error: result.error };
            }
        } catch (error: any) {
            console.error('❌ Error al conectar con backend de impresión:', error);

            // Fallback a navegador si está habilitado en caso de error de conexión
            const settings = this.settingsService.getSettings();
            if (settings?.enable_pdf_ticket) {
                console.log('⚠️ Fallback a impresión PDF activado por error de conexión');
                this.printTicketBrowser(ticket);
                return { success: true, usedThermal: false };
            }

            const errorMessage = error.error?.error || error.message || 'No se pudo conectar con el servidor de impresión';
            return {
                success: false,
                usedThermal: false,
                error: errorMessage
            };
        }
    }

    /**
     * Imprime usando el diálogo de impresión del navegador (fallback)
     */
    private printTicketBrowser(ticket: Ticket): void {
        const settings = this.settingsService.getSettings();
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (!printWindow) return;

        const html = this.generateTicketHtml(ticket, settings);
        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for styles and images to load
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    }

    private generateTicketHtml(ticket: Ticket, settings: any): string {
        const decimalFormat = this.settingsService.getDecimalFormat('total');
        const priceFormat = this.settingsService.getDecimalFormat('price');
        const quantityFormat = this.settingsService.getDecimalFormat('quantity');
        const exchangeRate = ticket.exchange_rate || 1;

        // Generar líneas de productos en Bs.
        const linesHtml = (ticket.lines || []).map(line => {
            const priceUSD = line.price;
            const priceBs = priceUSD * exchangeRate;
            const totalBs = line.total * exchangeRate;

            return `
            <tr>
                <td colspan="3" class="product-name">${line.product_name}</td>
            </tr>
            <tr>
                <td>${this.currencyPipe.transform(line.units, '', '', quantityFormat)} x Bs. ${this.currencyPipe.transform(priceBs, '', '', priceFormat)}</td>
                <td class="text-right">Bs. ${this.currencyPipe.transform(totalBs, '', '', decimalFormat)}</td>
            </tr>
        `}).join('');

        // Generar pagos en Bs.
        const paymentsHtml = (ticket.payments || []).map(p => {
            // Use amount_base_currency if available (correct value in Bs), otherwise fallback to manual calc
            const paymentBs = p.amount_base_currency || (p.total * (p.currency_id === 1 ? 1 : exchangeRate));
            const bankInfo = p.bank ? `<div style="font-size: 10px; margin-left: 10px;">Banco: ${p.bank}</div>` : '';
            const refInfo = p.reference ? `<div style="font-size: 10px; margin-left: 10px;">Ref: ${p.reference}</div>` : '';
            const cedulaInfo = p.cedula ? `<div style="font-size: 10px; margin-left: 10px;">CI/Telf: ${p.cedula}</div>` : '';

            return `
            <div class="row">
                <span>${this.getPaymentMethodName(p.payment)}:</span>
                <span class="text-right">Bs. ${this.currencyPipe.transform(paymentBs, '', '', decimalFormat)}</span>
            </div>
            ${bankInfo}
            ${refInfo}
            ${cedulaInfo}
        `}).join('');

        // Calcular totales en Bs. (Fallback seguro para evitar null)
        const subtotalCalc = this.calculateSubtotal(ticket) || 0;
        const taxesCalc = (ticket.taxes || []).reduce((sum, t) => sum + (t.amount || 0), 0);
        const discountCalc = this.calculateGlobalDiscountAmount(ticket) || 0;

        // Determinar total USD base
        let totalUSD = ticket.total;
        if (totalUSD === null || totalUSD === undefined || isNaN(totalUSD)) {
            totalUSD = subtotalCalc + taxesCalc - discountCalc;
        }

        // Asegurar que exchangeRate sea válido numéricamente
        const safeExchangeRate = (!exchangeRate || isNaN(exchangeRate)) ? 1 : exchangeRate;

        // Calcular finales
        const subtotalBs = subtotalCalc * safeExchangeRate;
        const totalBs = (totalUSD || 0) * safeExchangeRate;

        return `
            <html>
            <head>
                <style>
                    body { 
                        font-family: 'Courier New', Courier, monospace; 
                        width: 80mm; 
                        margin: 0; 
                        padding: 5mm; 
                        font-size: 12px;
                    }
                    .header { text-align: center; margin-bottom: 10px; }
                    .company-name { font-size: 16px; font-weight: bold; }
                    .info { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; }
                    .product-name { font-weight: bold; padding-top: 5px; }
                    .text-right { text-align: right; }
                    .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                    .total-row { font-size: 18px; font-weight: bold; margin-top: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                    @media print {
                        body { width: 80mm; }
                        @page { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">${settings?.company_name || 'MANGOPOS'}</div>
                    <div>${settings?.company_address || ''}</div>
                </div>

                <div class="info">
                    <div class="row">
                        <span>Ticket #:</span>
                        <span>${ticket.ticket_number}</span>
                    </div>
                    <div class="row">
                        <span>Fecha:</span>
                        <span>${this.datePipe.transform(ticket.date, 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    <div class="row">
                        <span>Cajero:</span>
                        <span>${ticket.cashier_name}</span>
                    </div>
                    <div class="row">
                        <span>Cliente:</span>
                        <span>${ticket.customer_name || 'Público General'}</span>
                    </div>
                    ${ticket.notes ? `
                    <div style="margin-top: 5px; padding-top: 5px; border-top: 1px dotted #ccc;">
                        <strong>Nota:</strong> ${ticket.notes}
                    </div>` : ''}
                </div>

                <table>
                    ${linesHtml}
                </table>

                <div class="totals">
                    <!--
                    <div class="row">
                        <span>Subtotal:</span>
                        <span>Bs. ${this.currencyPipe.transform(subtotalBs, '', '', decimalFormat)}</span>
                    </div>
                    ${(ticket.taxes || []).map(t => {
            const taxBs = t.amount * exchangeRate;
            return `
                        <div class="row">
                            <span>IVA (${(t.percentage * 100).toFixed(0)}%):</span>
                            <span>Bs. ${this.currencyPipe.transform(taxBs, '', '', decimalFormat)}</span>
                        </div>
                    `}).join('')}
                    -->
                    ${ticket.globalDiscount ? `
                    <div class="row" style="color: #e91e63;">
                        <span>Descuento Global:</span>
                        <span>-Bs. ${this.currencyPipe.transform(this.calculateGlobalDiscountAmount(ticket) * exchangeRate, '', '', decimalFormat)}</span>
                    </div>` : ''}
                    <div class="row total-row">
                        <span>TOTAL:</span>
                        <span>Bs. ${this.currencyPipe.transform(totalBs, '', '', decimalFormat)}</span>
                    </div>
                </div>

                <div class="totals">
                    <strong>PAGOS:</strong>
                    ${paymentsHtml}
                </div>

                <div class="footer">
                    ¡Gracias por su compra!<br>
                    MangoPOS System
                </div>
            </body>
            </html>
        `;
    }

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

    private calculateGlobalDiscountAmount(ticket: Ticket): number {
        if (!ticket.globalDiscount) return 0;
        if (ticket.globalDiscountType === 'FIXED') {
            return ticket.globalDiscount;
        }
        if (ticket.globalDiscountType === 'FIXED_VES') {
            return ticket.globalDiscount / ticket.exchange_rate;
        }
        // For percent, it's applied over (subtotal + taxes)
        const subtotalWithLines = this.calculateSubtotal(ticket);
        const taxes = (ticket.taxes || []).reduce((sum, t) => sum + t.amount, 0);
        return (subtotalWithLines + taxes) * ticket.globalDiscount;
    }

    /**
     * Imprime un ticket de apertura de caja
     */
    async printCashOpening(session: any): Promise<void> {
        const settings = this.settingsService.getSettings();
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (!printWindow) return;

        const html = this.generateOpeningTicketHtml(session, settings);
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    }

    /**
     * Imprime un ticket de cierre de caja
     */
    async printCashClosing(session: any, summary: any, expectedCash: any[]): Promise<void> {
        const settings = this.settingsService.getSettings();
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (!printWindow) return;

        const html = this.generateClosingTicketHtml(session, summary, expectedCash, settings);
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    }

    private generateOpeningTicketHtml(session: any, settings: any): string {
        return `
            <html>
            <head>
                <style>
                    body { font-family: 'Courier New', monospace; width: 80mm; padding: 5mm; font-size: 12px; }
                    .header { text-align: center; margin-bottom: 10px; }
                    .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; text-decoration: underline; }
                    .info { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 10px; border-top: 1px dotted #000; padding-top: 5px; }
                    .signature { margin-top: 40px; border-top: 1px solid #000; text-align: center; width: 60%; margin-left: 20%; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div style="font-size: 16px; font-weight: bold;">${settings?.company_name || 'MANGOPOS'}</div>
                    <div class="title">APERTURA DE CAJA</div>
                </div>
                <div class="info">
                    <div class="row"><span>Equipo:</span> <span>${session.host}</span></div>
                    <div class="row"><span>Secuencia:</span> <span>#${session.hostsequence}</span></div>
                    <div class="row"><span>Fecha:</span> <span>${this.datePipe.transform(session.datestart, 'dd/MM/yyyy HH:mm')}</span></div>
                </div>
                <div>
                    <strong>FONDOS INICIALES:</strong>
                    <div class="row"><span>Bs. (Base):</span> <span>${this.currencyPipe.transform(session.initial_balance || 0, 'Bs. ', 'symbol', '1.2-2')}</span></div>
                    <div class="row"><span>USD (Alt):</span> <span>${this.currencyPipe.transform(session.initial_balance_alt || 0, '$ ', 'symbol', '1.2-2')}</span></div>
                </div>
                <div class="signature">Firma Cajero</div>
                <div class="footer">MangoPOS System</div>
            </body>
            </html>
        `;
    }

    private generateClosingTicketHtml(session: any, summary: any, expectedCash: any[], settings: any): string {
        const decimalFormat = this.settingsService.getDecimalFormat('total');

        const paymentsSection = (summary.payments || []).map((p: any) => `
            <div class="row">
                <span>${this.getPaymentMethodName(p.payment)}</span>
                <span>
                    ${this.currencyPipe.transform(p.total, p.currency_id === 1 ? 'Bs. ' : '$ ', 'symbol', decimalFormat)}
                    ${p.currency_id === 2 ? `<br><small style="color: #666;">(Bs. ${this.decimalPipe.transform(p.total_base, decimalFormat)})</small>` : ''}
                </span>
            </div>
        `).join('');

        const cxcSection = (summary.cxcPayments || []).map((p: any) => `
            <div class="row">
                <span>${this.getPaymentMethodName(p.payment)}</span>
                <span>
                    ${this.currencyPipe.transform(p.total, p.currency_id === 1 ? 'Bs. ' : '$ ', 'symbol', decimalFormat)}
                    ${p.currency_id === 2 ? `<br><small style="color: #666;">(Bs. ${this.decimalPipe.transform(p.total_base, decimalFormat)})</small>` : ''}
                </span>
            </div>
        `).join('');


        const movementsSection = (summary.movements || []).map((m: any) => `
            <div class="row">
                <span>${m.movement_type === 'IN' ? 'Entrada' : 'Salida'} (${m.symbol})</span>
                <span>${this.decimalPipe.transform(m.total, decimalFormat)}</span>
            </div>
        `).join('');

        const expectedCashSection = expectedCash.map((c: any) => `
            <div class="row" style="font-weight: bold;">
                <span>${c.label}</span>
                <span>${this.decimalPipe.transform(c.amount, decimalFormat)}</span>
            </div>
        `).join('');

        return `
            <html>
            <head>
                <style>
                    body { font-family: 'Courier New', monospace; width: 80mm; padding: 5mm; font-size: 11px; }
                    .header { text-align: center; margin-bottom: 10px; }
                    .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; text-decoration: underline; }
                    .section-title { font-weight: bold; margin-top: 10px; border-bottom: 1px solid #eee; }
                    .info { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 1px; }
                    .highlight { background-color: #f0f0f0; padding: 2px 0; }
                    .footer { text-align: center; margin-top: 30px; font-size: 10px; border-top: 1px dotted #000; padding-top: 5px; }
                    .signature { margin-top: 40px; border-top: 1px solid #000; text-align: center; width: 60%; margin-left: 20%; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div style="font-size: 16px; font-weight: bold;">${settings?.company_name || 'MANGOPOS'}</div>
                    <div class="title">CIERRE DE CAJA</div>
                </div>
                <div class="info">
                    <div class="row"><span>Equipo:</span> <span>${session.host}</span></div>
                    <div class="row"><span>Secuencia:</span> <span>#${session.hostsequence}</span></div>
                    <div class="row"><span>Apertura:</span> <span>${this.datePipe.transform(session.datestart, 'dd/MM/yyyy HH:mm')}</span></div>
                    <div class="row"><span>Cierre:</span> <span>${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}</span></div>
                </div>

                <div class="section-title">MÉTRICAS DE VENTAS</div>
                ${(summary.salesByCurrency || []).map((m: any) => `
                    <div style="margin-top: 5px; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">
                        <strong>Ventas en ${m.currency_id === 1 ? 'Bs.' : 'USD'}:</strong>
                        <div class="row"><span>Tickets:</span> <span>${m.ticket_count}</span></div>
                        <div class="row"><span>Subtotal:</span> <span>${this.currencyPipe.transform(m.subtotal, m.currency_id === 1 ? 'Bs. ' : '$ ', 'symbol', decimalFormat)}</span></div>
                        <div class="row"><span>Impuestos:</span> <span>${this.currencyPipe.transform(m.taxes, m.currency_id === 1 ? 'Bs. ' : '$ ', 'symbol', decimalFormat)}</span></div>
                        <div class="row"><span>Total:</span> <span>${this.currencyPipe.transform(m.total, m.currency_id === 1 ? 'Bs. ' : '$ ', 'symbol', decimalFormat)}</span></div>
                    </div>
                `).join('')}
                <div class="row highlight" style="margin-top: 5px;"><strong style="font-size: 11px;">RESUMEN TOTAL (BS.):</strong> <strong style="font-size: 11px;">${this.currencyPipe.transform(summary.sales.total, 'Bs. ', 'symbol', decimalFormat)}</strong></div>

                <div class="section-title">PAGOS RECIBIDOS (Ventas)</div>
                ${paymentsSection || '<div class="row"><span>Sin ventas</span></div>'}

                <div class="section-title">COBROS DE DEUDAS (CxC)</div>
                ${cxcSection || '<div class="row"><span>Sin cobros</span></div>'}


                <div class="section-title">MOVIMIENTOS DE CAJA</div>
                ${movementsSection || '<div class="row"><span>Sin movimientos</span></div>'}

                <div class="section-title">EFECTIVO ESPERADO EN CAJA</div>
                ${expectedCashSection}

                <div class="signature">Firma Responsable</div>
                <div class="footer">MangoPOS System</div>
            </body>
            </html>
        `;
    }

    private getPaymentMethodName(method: string): string {
        const methods: { [key: string]: string } = {
            'CASH_MONEY': 'Efectivo',
            'cash_money': 'Efectivo',
            'cash': 'Efectivo',
            'CARD': 'Tarjeta',
            'card': 'Tarjeta',
            'TRANSFER': 'Transferencia',
            'transfer': 'Transferencia',
            'CASH_REFUND': 'Devolución',
            'paper': 'Pago Móvil',
            'PagoMovil': 'Pago Móvil',
            'PAPER': 'Pago Móvil',
            'Vale': 'Pago Móvil',
            'vale': 'Pago Móvil',
            'debt': 'Crédito',
            'Credito': 'Crédito'
        };
        return methods[method] || methods[method?.toUpperCase()] || method;
    }
}
