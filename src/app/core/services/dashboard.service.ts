import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
    salesToday: {
        usd: number;
        bs: number;
    };
    transactionsToday: number;
    openRegisters: number;
    lowStock: number;
}

export interface RecentSale {
    id: string;
    ticket_number: number;
    customer_name: string;
    date: string;
    status: number;
    exchange_rate: number;
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/dashboard`;

    getStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
    }

    getRecentSales(): Observable<RecentSale[]> {
        return this.http.get<RecentSale[]>(`${this.apiUrl}/recent-sales`);
    }
}
