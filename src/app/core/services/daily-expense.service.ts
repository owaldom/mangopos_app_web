import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DailyExpense {
    id: number;
    idgastos: number;
    date: Date | string;
    taxbase: number;
    tax: number;
    total: number;
    notes?: string;
    payment: string;
    numberinvoice?: string;
    expense_name?: string;
    frequency?: string;
}

export interface DailyExpenseFilters {
    search?: string;
    startDate?: string;
    endDate?: string;
    idgastos?: number;
    payment?: string;
    page?: number;
    limit?: number;
}

@Injectable({
    providedIn: 'root'
})
export class DailyExpenseService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/daily-expenses`;

    getAll(filters: DailyExpenseFilters = {}): Observable<{ data: DailyExpense[], total: number, page: number, totalPages: number }> {
        const params: any = {
            page: (filters.page || 1).toString(),
            limit: (filters.limit || 20).toString()
        };

        if (filters.search) params.search = filters.search;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.idgastos) params.idgastos = filters.idgastos.toString();
        if (filters.payment) params.payment = filters.payment;

        return this.http.get<any>(this.apiUrl, { params });
    }

    getById(id: number): Observable<DailyExpense> {
        return this.http.get<DailyExpense>(`${this.apiUrl}/${id}`);
    }

    create(dailyExpense: Partial<DailyExpense>): Observable<DailyExpense> {
        return this.http.post<DailyExpense>(this.apiUrl, dailyExpense);
    }

    update(id: number, dailyExpense: Partial<DailyExpense>): Observable<DailyExpense> {
        return this.http.put<DailyExpense>(`${this.apiUrl}/${id}`, dailyExpense);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    getTotalsByPeriod(startDate: string, endDate: string, groupBy: 'day' | 'month' | 'year' = 'day'): Observable<any[]> {
        const params = {
            startDate,
            endDate,
            groupBy
        };
        return this.http.get<any[]>(`${this.apiUrl}/reports/totals`, { params });
    }
}
