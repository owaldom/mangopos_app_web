import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Warehouse } from '../models/warehouse.model';

@Injectable({
    providedIn: 'root'
})
export class WarehouseService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/locations`;

    getAll(): Observable<Warehouse[]> {
        return this.http.get<Warehouse[]>(this.apiUrl);
    }

    getById(id: number): Observable<Warehouse> {
        return this.http.get<Warehouse>(`${this.apiUrl}/${id}`);
    }

    create(warehouse: Partial<Warehouse>): Observable<Warehouse> {
        return this.http.post<Warehouse>(this.apiUrl, warehouse);
    }

    update(id: number, warehouse: Partial<Warehouse>): Observable<Warehouse> {
        return this.http.put<Warehouse>(`${this.apiUrl}/${id}`, warehouse);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
