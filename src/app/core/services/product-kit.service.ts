import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KitComponent, KitHeader } from './product-kit.model';

@Injectable({
    providedIn: 'root'
})
export class ProductKitService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/product-kits`;

    getKitHeaders(page: number = 1, limit: number = 10): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/headers`, {
            params: { page: page.toString(), limit: limit.toString() }
        });
    }

    getEligibleComponents(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/eligible-components`);
    }

    getKitComponents(kitId: number): Observable<KitComponent[]> {
        return this.http.get<KitComponent[]>(`${this.apiUrl}/${kitId}`);
    }

    saveKit(kitId: number, components: KitComponent[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/${kitId}`, { components });
    }

    validateStock(kitId: number, quantity: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/validate/stock`, {
            params: { kitId: kitId.toString(), quantity: quantity.toString() }
        });
    }
}
