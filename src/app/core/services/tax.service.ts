import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaxCategory {
    id: number;
    name: string;
}

export interface TaxCustCategory {
    id: number;
    name: string;
}

export interface Tax {
    id: number;
    name: string;
    category: number;
    custcategory: number | null;
    parentid: number | null;
    rate: number;
    ratecascade: boolean;
    rateorder: number | null;
    validfrom: string | Date;
    // Campos visuales (join)
    category_name?: string;
    custcategory_name?: string;
    parent_name?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TaxService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/taxes`;

    getAll(): Observable<Tax[]> {
        return this.http.get<Tax[]>(this.apiUrl);
    }

    getTaxes(): Observable<Tax[]> {
        return this.getAll();
    }

    getById(id: number): Observable<Tax> {
        return this.http.get<Tax>(`${this.apiUrl}/${id}`);
    }

    create(tax: Partial<Tax>): Observable<Tax> {
        return this.http.post<Tax>(this.apiUrl, tax);
    }

    update(id: number, tax: Partial<Tax>): Observable<Tax> {
        return this.http.put<Tax>(`${this.apiUrl}/${id}`, tax);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    getTaxCategories(): Observable<TaxCategory[]> {
        return this.http.get<TaxCategory[]>(`${this.apiUrl}/categories`); // This endpoint in taxController returns tax categories
    }

    // CRUD for Tax Categories (using new endpoint)
    private catApiUrl = `${environment.apiUrl}/tax-categories`;

    getAllCategories(): Observable<TaxCategory[]> {
        return this.http.get<TaxCategory[]>(this.catApiUrl);
    }

    createCategory(name: string): Observable<TaxCategory> {
        return this.http.post<TaxCategory>(this.catApiUrl, { name });
    }

    updateCategory(id: number, name: string): Observable<TaxCategory> {
        return this.http.put<TaxCategory>(`${this.catApiUrl}/${id}`, { name });
    }

    deleteCategory(id: number): Observable<any> {
        return this.http.delete(`${this.catApiUrl}/${id}`);
    }

    getTaxCustCategories(): Observable<TaxCustCategory[]> {
        return this.http.get<TaxCustCategory[]>(`${this.apiUrl}/cust-categories`);
    }
}
