import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PriceChangeFilter {
    barcode?: string;
    name?: string;
    categoryId?: string;
    priceBuyMin?: number;
    priceBuyMax?: number;
    priceSellMin?: number;
    priceSellMax?: number;
}

export interface PriceChangeConfig {
    productIds: string[];
    changeType: 'percentage' | 'amount';
    changeAction: 'increase' | 'decrease';
    changeValue: number;
}

export interface ProductForPriceChange {
    id: string;
    reference: string;
    code: string;
    name: string;
    pricebuy: number;
    pricesell: number;
    category_name: string;
    category: string;
}

export interface ProductPricePreview extends ProductForPriceChange {
    newPrice: number;
    difference: number;
    percentageChange: number;
}

export interface BulkPriceChangeResponse {
    message: string;
    updatedCount: number;
    products: Array<{
        id: string;
        name: string;
        reference: string;
        pricesell: number;
    }>;
}

export interface UpdatePriceResponse {
    message: string;
    product: {
        id: string;
        name: string;
        reference: string;
        pricesell: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class PriceChangeService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/products`;

    /**
     * Filtrar productos para cambio de precios
     */
    filterProducts(filters: PriceChangeFilter): Observable<ProductForPriceChange[]> {
        let params = new HttpParams();

        if (filters.barcode) {
            params = params.set('barcode', filters.barcode);
        }
        if (filters.name) {
            params = params.set('name', filters.name);
        }
        if (filters.categoryId) {
            params = params.set('categoryId', filters.categoryId);
        }
        if (filters.priceBuyMin !== undefined) {
            params = params.set('priceBuyMin', filters.priceBuyMin.toString());
        }
        if (filters.priceBuyMax !== undefined) {
            params = params.set('priceBuyMax', filters.priceBuyMax.toString());
        }
        if (filters.priceSellMin !== undefined) {
            params = params.set('priceSellMin', filters.priceSellMin.toString());
        }
        if (filters.priceSellMax !== undefined) {
            params = params.set('priceSellMax', filters.priceSellMax.toString());
        }

        return this.http.get<ProductForPriceChange[]>(`${this.apiUrl}/filter-price-change`, { params });
    }

    /**
     * Calcular vista previa de cambios de precios
     */
    calculatePreview(
        products: ProductForPriceChange[],
        config: Omit<PriceChangeConfig, 'productIds'>
    ): ProductPricePreview[] {
        const value = Number(config.changeValue);

        return products.map(product => {
            const currentPrice = Number(product.pricesell) || 0;
            let newPrice = currentPrice;

            if (config.changeAction === 'increase') {
                if (config.changeType === 'percentage') {
                    newPrice = currentPrice + ((currentPrice * value) / 100);
                } else {
                    newPrice = currentPrice + value;
                }
            } else {
                if (config.changeType === 'percentage') {
                    newPrice = currentPrice - ((currentPrice * value) / 100);
                    console.log('newPrice', newPrice);
                    console.log('currentPrice', currentPrice);
                    console.log('value', value);
                } else {
                    newPrice = currentPrice - value;
                }
            }

            // Asegurar que el precio no sea negativo
            newPrice = parseFloat(Math.max(0, newPrice).toFixed(2));

            const difference = parseFloat((newPrice - currentPrice).toFixed(2));
            const percentageChange = currentPrice > 0
                ? (difference / currentPrice) * 100
                : 0;

            return {
                ...product,
                newPrice,
                difference,
                percentageChange
            };
        });
    }

    /**
     * Aplicar cambio masivo de precios
     */
    applyBulkPriceChange(config: PriceChangeConfig): Observable<BulkPriceChangeResponse> {
        return this.http.post<BulkPriceChangeResponse>(`${this.apiUrl}/bulk-price-change`, config);
    }

    /**
     * Actualizar precio individual
     */
    updateProductPrice(productId: string, newPrice: number): Observable<UpdatePriceResponse> {
        return this.http.put<UpdatePriceResponse>(`${this.apiUrl}/${productId}/price`, { newPrice });
    }
}
