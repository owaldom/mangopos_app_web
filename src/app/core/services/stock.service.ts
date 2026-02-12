import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StockMovement {
    id?: string;
    datenew: Date;
    reason: number;
    location: number;
    product: string;
    units: number;
    price: number;
    concept?: string;
    // Joins
    product_name?: string;
    product_reference?: string;
    location_name?: string;
}

export interface LocationInfo {
    id: number;
    name: string;
    address: string;
    type: 'factory' | 'pos';
}

export class MovementReason {
    public static readonly IN_PURCHASE = { key: 1, name: 'Compra', sign: 1 };
    public static readonly IN_REFUND = { key: 2, name: 'Devolución de Cliente', sign: 1 };
    public static readonly IN_MOVEMENT = { key: 4, name: 'Entrada por Traspaso', sign: 1 };
    public static readonly OUT_SALE = { key: -1, name: 'Venta', sign: -1 };
    public static readonly OUT_REFUND = { key: -2, name: 'Devolución a Proveedor', sign: -1 };
    public static readonly OUT_BREAK = { key: -3, name: 'Merma / Rotura', sign: -1 };
    public static readonly OUT_MOVEMENT = { key: -4, name: 'Salida por Traspaso', sign: -1 };
    public static readonly OUT_CONSUMPTION = { key: -5, name: 'Consumo Interno', sign: -1 };
    public static readonly OUT_DESPIECE = { key: 5, name: 'Salida por Despiece', sign: -1 };
    public static readonly IN_DESPIECE = { key: 6, name: 'Entrada por Despiece', sign: 1 };

    public static getAll() {
        return [
            this.IN_PURCHASE,
            this.IN_REFUND,
            this.IN_MOVEMENT,
            this.OUT_SALE,
            this.OUT_REFUND,
            this.OUT_BREAK,
            this.OUT_MOVEMENT,
            this.OUT_CONSUMPTION,
            this.OUT_DESPIECE,
            this.IN_DESPIECE
        ];
    }
}

@Injectable({
    providedIn: 'root'
})
export class StockService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/stock`;

    getMovements(page: number = 1, limit: number = 50): Observable<any> {
        const params = new HttpParams().set('page', page).set('limit', limit);
        return this.http.get(`${this.apiUrl}/movements`, { params });
    }

    getLocations(): Observable<LocationInfo[]> {
        return this.http.get<LocationInfo[]>(`${this.apiUrl}/locations`);
    }

    getProductStock(productId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/product/${productId}`);
    }

    createMovement(movement: any): Observable<any> {
        if (movement.date instanceof Date) {
            movement.date = this.formatLocalDate(movement.date);
        }
        return this.http.post(`${this.apiUrl}/movements`, movement);
    }

    getLowStockReport(params: any = {}): Observable<any[]> {
        let httpParams = new HttpParams();
        if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
        if (params.search) httpParams = httpParams.set('search', params.search);

        return this.http.get<any[]>(`${this.apiUrl}/low-stock`, { params: httpParams });
    }

    createBulkMovement(payload: { date: Date | string, reason: number, location: number, lines: any[] }): Observable<any> {
        if (payload.date instanceof Date) {
            payload.date = this.formatLocalDate(payload.date);
        }
        return this.http.post(`${this.apiUrl}/bulk-movements`, payload);
    }

    private formatLocalDate(date: Date): string {
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
}
