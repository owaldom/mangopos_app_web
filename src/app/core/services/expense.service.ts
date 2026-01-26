import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Expense {
    id: number;
    name: string;
    frequency: string;
    idsupplier?: number;
    taxcat?: number;
    visible: boolean;
    supplier_name?: string;
    taxcat_name?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/expenses`;

    getAll(page: number = 1, limit: number = 20, search?: string): Observable<{ data: Expense[], total: number, page: number, totalPages: number }> {
        const params: any = {
            page: page.toString(),
            limit: limit.toString()
        };
        if (search) params.search = search;
        return this.http.get<any>(this.apiUrl, { params });
    }

    getById(id: number): Observable<Expense> {
        return this.http.get<Expense>(`${this.apiUrl}/${id}`);
    }

    create(expense: Partial<Expense>): Observable<Expense> {
        return this.http.post<Expense>(this.apiUrl, expense);
    }

    update(id: number, expense: Partial<Expense>): Observable<Expense> {
        return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
