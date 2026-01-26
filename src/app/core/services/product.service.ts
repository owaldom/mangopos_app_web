import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
    id: number;
    reference: string;
    code: string;
    name: string;
    pricebuy: number;
    pricesell: number;
    category: number;
    taxcat: number;
    stockcost: number;
    stockvolume: number;
    image?: string; // Base64
    iscom: boolean;
    isscale: boolean;
    incatalog?: boolean;
    servicio?: string | boolean;
    attributes?: any;
    // New fields
    codetype?: string;
    attributeset_id?: number | null;
    discount?: string;
    regulated?: boolean;
    averagecost?: number;
    marketable?: boolean;
    codeunit?: string;
    typeproduct?: string;

    // UI optional fields
    category_name?: string;
    tax_name?: string;
    stock_current?: number;
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
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/products`;

    getAll(page: number = 1, limit: number = 50, filters: any = {}): Observable<PaginatedResponse<Product>> {
        let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                url += `&${key}=${encodeURIComponent(filters[key])}`;
            }
        });
        return this.http.get<PaginatedResponse<Product>>(url);
    }

    getById(id: number): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`);
    }

    create(product: Partial<Product>): Observable<Product> {
        return this.http.post<Product>(this.apiUrl, product);
    }

    update(id: number, product: Partial<Product>): Observable<Product> {
        return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
