import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Customer {
    id: string;
    searchkey: string;
    taxid?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    firstname?: string;
    lastname?: string;
    notes?: string;
    visible: boolean;
    curdate?: string;
    curdebt?: number;
    maxdebt?: number;
    total_paid?: number;
    discountcategory?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/customers`;

    getAll(page: number = 1, limit: number = 20, search?: string, withDebtOnly?: boolean): Observable<{ data: Customer[], total: number, page: number, totalPages: number }> {
        const params: any = {
            page: page.toString(),
            limit: limit.toString()
        };
        if (search) params.search = search;
        if (withDebtOnly) params.withDebtOnly = 'true';
        return this.http.get<any>(this.apiUrl, { params });
    }

    getById(id: string): Observable<Customer> {
        return this.http.get<Customer>(`${this.apiUrl}/${id}`);
    }

    create(customer: Partial<Customer>): Observable<Customer> {
        return this.http.post<Customer>(this.apiUrl, customer);
    }

    update(id: string, customer: Partial<Customer>): Observable<Customer> {
        return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer);
    }

    getInvoices(customerId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${customerId}/invoices`);
    }

    getPaymentHistory(customerId: string, filters: any = {}): Observable<any[]> {
        const params: any = {};
        if (filters.invoice) params.invoice = filters.invoice;
        if (filters.method) params.method = filters.method;
        if (filters.date) params.date = filters.date;

        return this.http.get<any[]>(`${this.apiUrl}/${customerId}/payments`, { params });
    }
}
