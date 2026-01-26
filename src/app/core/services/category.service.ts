import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
    id: number;
    name: string;
    parentid?: number;
    image?: string; // Base64 o URL
    visible_in_pos?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/categories`;

    getAll(page: number = 1, limit: number = 50): Observable<PaginatedResponse<Category>> {
        return this.http.get<PaginatedResponse<Category>>(`${this.apiUrl}?page=${page}&limit=${limit}`);
    }

    getById(id: number): Observable<Category> {
        return this.http.get<Category>(`${this.apiUrl}/${id}`);
    }

    create(category: Partial<Category>): Observable<Category> {
        return this.http.post<Category>(this.apiUrl, category);
    }

    update(id: number, category: Partial<Category>): Observable<Category> {
        return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
