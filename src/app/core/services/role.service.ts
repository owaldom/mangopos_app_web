import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Role {
    id: string;
    name: string;
    permissions: string; // XML permissions
}

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/roles`;

    getRoles(page?: number, limit?: number): Observable<any> {
        let params: any = {};
        if (page) params.page = page.toString();
        if (limit) params.limit = limit.toString();
        return this.http.get<any>(this.apiUrl, { params });
    }

    getRoleById(id: string): Observable<Role> {
        return this.http.get<Role>(`${this.apiUrl}/${id}`);
    }

    createRole(role: Partial<Role>): Observable<Role> {
        return this.http.post<Role>(this.apiUrl, role);
    }

    updateRole(id: string, role: Partial<Role>): Observable<Role> {
        return this.http.put<Role>(`${this.apiUrl}/${id}`, role);
    }

    deleteRole(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
