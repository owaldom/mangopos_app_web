import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReportsService {
    private apiUrl = `${environment.apiUrl}/reports`;

    constructor(private http: HttpClient) { }

    // Ventas
    getSalesByUser(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/sales/by-user`, { params: { startDate, endDate } });
    }

    getSalesByProduct(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/sales/by-product`, { params: { startDate, endDate } });
    }

    getSalesByTax(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/sales/by-tax`, { params: { startDate, endDate } });
    }

    getSalesBook(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/sales/book`, { params: { startDate, endDate } });
    }

    getSalesUtility(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/sales/utility`, { params: { startDate, endDate } });
    }

    getSalesDiscounts(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/sales/discounts`, { params: { startDate, endDate } });
    }

    getSalesChart(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/sales/chart`, { params: { startDate, endDate } });
    }

    getInvoicesWithForeignCurrency(startDate: string, endDate: string, customerId?: string): Observable<any> {
        const params: any = { startDate, endDate };
        if (customerId) params.customerId = customerId;
        return this.http.get<any>(`${this.apiUrl}/sales/invoices-with-foreign-currency`, { params });
    }

    // Inventario
    getInventoryCurrent(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/inventory/current`);
    }

    getInventoryGeneral(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/inventory/general`);
    }

    getInventoryLowStock(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/inventory/low-stock`);
    }

    getInventoryMovements(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/inventory/movements`, { params: { startDate, endDate } });
    }

    getInventoryPriceList(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/inventory/price-list`);
    }

    getInventoryIntake(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/inventory/intake`, { params: { startDate, endDate } });
    }

    // Compras
    getPurchasesBySupplier(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/purchases/by-supplier`, { params: { startDate, endDate } });
    }

    getPurchasesBook(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/purchases/book`, { params: { startDate, endDate } });
    }

    getPurchasesCXP(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/purchases/cxp`);
    }

    // Caja
    getClosedPOS(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/cash/closed-pos`, { params: { startDate, endDate } });
    }

    getClosedPOSDetail(startDate: string, endDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/cash/closed-pos-detail`, { params: { startDate, endDate } });
    }

    // Clientes
    getCustomersList(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/customers/list`);
    }

    getCustomerStatement(startDate: string, endDate: string, customerId?: string): Observable<any[]> {
        const params: any = { startDate, endDate };
        if (customerId) params.customerId = customerId;
        return this.http.get<any[]>(`${this.apiUrl}/customers/statement`, { params });
    }

    getCustomersBalance(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/customers/balance`);
    }

    getCustomersPayments(startDate: string, endDate: string, customerId?: string): Observable<any[]> {
        const params: any = { startDate, endDate };
        if (customerId) params.customerId = customerId;
        return this.http.get<any[]>(`${this.apiUrl}/customers/payments`, { params });
    }

    getCustomersDiary(startDate: string, endDate: string, customerId?: string): Observable<any[]> {
        const params: any = { startDate, endDate };
        if (customerId) params.customerId = customerId;
        return this.http.get<any[]>(`${this.apiUrl}/customers/diary`, { params });
    }

    // Productos
    getProductsList(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/products/list`);
    }

    getProductsCatalog(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/products/catalog`);
    }

    // Otros
    getPeopleList(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/people/list`);
    }
}
