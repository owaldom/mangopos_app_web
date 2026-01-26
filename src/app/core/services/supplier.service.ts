import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Supplier {
    id: string;
    cif: string; // Tax ID
    name: string;
    address?: string;
    contactcomm?: string;
    contactfact?: string;
    payrule?: string; // Contacto, Credito
    faxnumber?: string;
    phonecomm?: string;
    phonefact?: string;
    email?: string;
    webpage?: string;
    notes?: string;
    creditdays?: number;
    creditlimit?: number;
    persontype?: string;
    typesupplier?: string; // Nacional, Extranjero
    balance?: number;
    total_paid?: number;
    visible?: boolean;
    curdate?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/suppliers`;

    getAll(page: number = 1, limit: number = 20, search?: string, withBalanceOnly?: boolean): Observable<{ data: Supplier[], total: number, page: number, totalPages: number }> {
        const params: any = {
            page: page.toString(),
            limit: limit.toString()
        };
        if (search) params.search = search;
        if (withBalanceOnly) params.withBalanceOnly = 'true';
        return this.http.get<any>(this.apiUrl, { params });
    }

    getById(id: string): Observable<Supplier> {
        return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
    }

    create(supplier: Partial<Supplier>): Observable<Supplier> {
        return this.http.post<Supplier>(this.apiUrl, supplier);
    }

    update(id: string, supplier: Partial<Supplier>): Observable<Supplier> {
        return this.http.put<Supplier>(`${this.apiUrl}/${id}`, supplier);
    }

    delete(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    getInvoices(supplierId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${supplierId}/invoices`);
    }

    getPaymentHistory(supplierId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${supplierId}/payments`);
    }
}
