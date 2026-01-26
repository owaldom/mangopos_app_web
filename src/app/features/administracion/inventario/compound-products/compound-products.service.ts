import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    CompoundProduct,
    CompoundProductDetail,
    ProductForCompound,
    Unidad,
    StockValidation
} from './compound-products.model';

@Injectable({
    providedIn: 'root'
})
export class CompoundProductsService {
    private apiUrl = `${environment.apiUrl}/compound-products`;

    constructor(private http: HttpClient) { }

    // Obtener insumos de un producto compuesto
    getCompoundProducts(productId: number): Observable<CompoundProductDetail[]> {
        return this.http.get<CompoundProductDetail[]>(`${this.apiUrl}/${productId}`);
    }

    // Crear relación producto-insumo
    createCompoundProduct(data: CompoundProduct): Observable<CompoundProduct> {
        return this.http.post<CompoundProduct>(this.apiUrl, data);
    }

    // Actualizar relación producto-insumo
    updateCompoundProduct(id: number, data: Partial<CompoundProduct>): Observable<CompoundProduct> {
        return this.http.put<CompoundProduct>(`${this.apiUrl}/${id}`, data);
    }

    // Eliminar relación producto-insumo
    deleteCompoundProduct(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    // Obtener productos disponibles para ser compuestos
    getProductsForCompounds(page: number = 1, limit: number = 10): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/products/list`, {
            params: { page: page.toString(), limit: limit.toString() }
        });
    }

    // Obtener insumos disponibles
    getInsumos(): Observable<ProductForCompound[]> {
        return this.http.get<ProductForCompound[]>(`${this.apiUrl}/insumos/list`);
    }

    // Obtener unidades disponibles
    getUnidades(): Observable<Unidad[]> {
        return this.http.get<Unidad[]>(`${this.apiUrl}/unidades/list`);
    }

    // Validar stock de producto compuesto
    validateStock(productId: number, quantity: number): Observable<StockValidation> {
        return this.http.get<StockValidation>(`${this.apiUrl}/validate/stock`, {
            params: { productId: productId.toString(), quantity: quantity.toString() }
        });
    }
}
