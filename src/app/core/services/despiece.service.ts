import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from './product.service';

export interface RelacionDespiece {
    id: number;
    idproductmayor: number;
    idproductmenor: number;
    relacion: number;
    producto_mayor_name?: string;
    producto_mayor_ref?: string;
    producto_mayor_code?: string;
    producto_menor_name?: string;
    producto_menor_ref?: string;
    producto_menor_code?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface DespieceResult {
    message: string;
    cantidadDespiezada: number;
    unidadesGeneradas: number;
    factorConversion: number;
}

@Injectable({
    providedIn: 'root'
})
export class DespieceService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/despiece`;

    // Obtener todas las relaciones de despiece
    getRelaciones(page: number = 1, limit: number = 50): Observable<PaginatedResponse<RelacionDespiece>> {
        return this.http.get<PaginatedResponse<RelacionDespiece>>(
            `${this.apiUrl}/relaciones?page=${page}&limit=${limit}`
        );
    }

    // Obtener relación específica
    getRelacion(id: number): Observable<RelacionDespiece> {
        return this.http.get<RelacionDespiece>(`${this.apiUrl}/relaciones/${id}`);
    }

    // Obtener relaciones disponibles para un producto
    getRelacionesByProduct(productId: number): Observable<RelacionDespiece[]> {
        return this.http.get<RelacionDespiece[]>(`${this.apiUrl}/productos/${productId}`);
    }

    // Crear nueva relación
    createRelacion(data: { idproductmayor: number; idproductmenor: number; relacion: number }): Observable<RelacionDespiece> {
        return this.http.post<RelacionDespiece>(`${this.apiUrl}/relaciones`, data);
    }

    // Actualizar relación
    updateRelacion(id: number, relacion: number): Observable<RelacionDespiece> {
        return this.http.put<RelacionDespiece>(`${this.apiUrl}/relaciones/${id}`, { relacion });
    }

    // Eliminar relación
    deleteRelacion(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/relaciones/${id}`);
    }

    // Ejecutar despiece
    ejecutarDespiece(data: {
        idproductmayor: number;
        idproductmenor: number;
        cantidad: number;
        location: number;
    }): Observable<DespieceResult> {
        return this.http.post<DespieceResult>(`${this.apiUrl}/ejecutar`, data);
    }
}
