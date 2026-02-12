import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    DistributionOrder,
    DistributionExportData,
    DistributionImportRequest
} from '../models/distribution-orders.model';

@Injectable({
    providedIn: 'root'
})
export class DistributionOrdersService {
    private apiUrl = `${environment.apiUrl}/distribution-orders`;

    constructor(private http: HttpClient) { }

    // Get all distribution orders with pagination
    getAllOrders(page: number = 1, limit: number = 50, status?: string, search?: string): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (status) {
            params = params.set('status', status);
        }

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<any>(this.apiUrl, { params });
    }

    // Get single distribution order by ID
    getOrderById(id: number): Observable<DistributionOrder> {
        return this.http.get<DistributionOrder>(`${this.apiUrl}/${id}`);
    }

    // Create new distribution order
    createOrder(order: Partial<DistributionOrder>): Observable<DistributionOrder> {
        return this.http.post<DistributionOrder>(this.apiUrl, order);
    }

    // Export distribution order to JSON
    exportOrder(id: number): Observable<DistributionExportData> {
        return this.http.post<DistributionExportData>(`${this.apiUrl}/${id}/export`, {});
    }

    // Import and receive distribution order
    importOrder(importData: DistributionImportRequest): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/import`, importData);
    }

    // Download JSON file
    downloadJSON(data: DistributionExportData, filename: string): void {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    // Read JSON file
    readJSONFile(file: File): Promise<DistributionExportData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Error al leer el archivo JSON'));
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    }
}
