import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Discount {
    id: string;
    name: string;
    quantity: number;
    percentage: boolean; // true = %, false = fixed amount
    idcategory?: string;
    validfrom?: string;
    custcategory?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DiscountService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/discounts`;

    getApplicableDiscount(productId: number, customerId?: number): Observable<Discount | null> {
        return this.http.post<Discount | null>(`${this.apiUrl}/calculate`, { productId, customerId });
    }

    getAll(): Observable<Discount[]> {
        return this.http.get<Discount[]>(this.apiUrl);
    }

    create(discount: Partial<Discount>): Observable<Discount> {
        return this.http.post<Discount>(this.apiUrl, discount);
    }

    update(id: string, discount: Partial<Discount>): Observable<Discount> {
        return this.http.put<Discount>(`${this.apiUrl}/${id}`, discount);
    }

    deleteDiscount(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    getDiscountCategories(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl.replace('/discounts', '')}/discount-categories`);
    }

    createDiscountCategory(category: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl.replace('/discounts', '')}/discount-categories`, category);
    }

    updateDiscountCategory(id: string, category: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl.replace('/discounts', '')}/discount-categories/${id}`, category);
    }

    deleteDiscountCategory(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl.replace('/discounts', '')}/discount-categories/${id}`);
    }

    getDiscountCustCategories(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl.replace('/discounts', '')}/discount-cust-categories`);
    }

    createDiscountCustCategory(category: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl.replace('/discounts', '')}/discount-cust-categories`, category);
    }

    updateDiscountCustCategory(id: string, category: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl.replace('/discounts', '')}/discount-cust-categories/${id}`, category);
    }

    deleteDiscountCustCategory(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl.replace('/discounts', '')}/discount-cust-categories/${id}`);
    }
}
