import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TicketLine {
    line: number;
    product: string;
    product_name: string;
    product_reference: string;
    units: number;
    price: number;
    taxid: string;
    tax_rate: number;
    discount?: number;
    discount_type?: 'PERCENT' | 'FIXED' | 'FIXED_VES';
    subtotal: number;
    tax_amount: number;
    total: number;
}

export interface Payment {
    payment: string;
    total: number;
    currency_id: number;
    exchange_rate: number;
    amount_base_currency: number;
    bank?: string;
    reference?: string;
    cedula?: string;
}

export interface TaxSummary {
    taxid: string;
    percentage: number;
    base: number;
    amount: number;
}

export interface Ticket {
    id: string;
    ticket_number: number;
    tickettype: number;
    date: string;
    customer_id?: string;
    customer_name?: string;
    customer_taxid?: string;
    customer_phone?: string;
    customer_address?: string;
    cashier_id: string;
    cashier_name: string;
    status: number;
    money?: string;
    currency_id: number;
    exchange_rate: number;
    subtotal?: number;
    tax_total?: number;
    total: number;
    lines?: TicketLine[];
    payments?: Payment[];
    taxes?: TaxSummary[];
    notes?: string;
    globalDiscount?: number;
    globalDiscountType?: 'PERCENT' | 'FIXED' | 'FIXED_VES';
}

export interface SalesHistoryFilters {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    userId?: string;
    ticketNumber?: number;
    minTotal?: number;
    maxTotal?: number;
    page?: number;
    limit?: number;
}

export interface SalesHistoryResponse {
    tickets: Ticket[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface RefundLine {
    product_id: string;
    units: number;
    price: number;
    taxid: string;
    tax_rate: number;
}

export interface RefundRequest {
    person_id: string;
    refund_lines: RefundLine[];
    refund_payment_method: string;
    cash_register_id?: string;
    currency_id?: number;
    exchange_rate?: number;
}

export interface RefundResponse {
    success: boolean;
    refundTicketId: string;
    refundTicketNumber: number;
    totalRefund: number;
}

@Injectable({
    providedIn: 'root'
})
export class SalesHistoryService {
    private apiUrl = `${environment.apiUrl}/sales`;

    constructor(private http: HttpClient) { }

    getSalesHistory(filters: SalesHistoryFilters): Observable<SalesHistoryResponse> {
        let params = new HttpParams();

        if (filters.startDate) params = params.set('startDate', filters.startDate);
        if (filters.endDate) params = params.set('endDate', filters.endDate);
        if (filters.customerId) params = params.set('customerId', filters.customerId);
        if (filters.userId) params = params.set('userId', filters.userId);
        if (filters.ticketNumber) params = params.set('ticketNumber', filters.ticketNumber.toString());
        if (filters.minTotal) params = params.set('minTotal', filters.minTotal.toString());
        if (filters.maxTotal) params = params.set('maxTotal', filters.maxTotal.toString());
        if (filters.page) params = params.set('page', filters.page.toString());
        if (filters.limit) params = params.set('limit', filters.limit.toString());

        return this.http.get<SalesHistoryResponse>(`${this.apiUrl}/history`, { params });
    }

    getTicketById(id: string): Observable<Ticket> {
        return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
    }

    processRefund(ticketId: string, refundData: RefundRequest): Observable<RefundResponse> {
        return this.http.post<RefundResponse>(`${this.apiUrl}/${ticketId}/refund`, refundData);
    }
}
