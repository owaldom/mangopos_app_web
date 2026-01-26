import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
    id: string;
    name: string;
    role: string;
    role_name?: string;
    card?: string;
    image?: string;
    visible?: boolean;
    permissions?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/users`;

    getUsers(page: number = 1, limit: number = 10, search?: string): Observable<{ data: User[], total: number }> {
        let params: any = { page: page.toString(), limit: limit.toString() };
        if (search) params.search = search;
        return this.http.get<{ data: User[], total: number }>(this.apiUrl, { params });
    }

    getUserById(id: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${id}`);
    }

    createUser(user: any): Observable<User> {
        return this.http.post<User>(this.apiUrl, user);
    }

    updateUser(id: string, user: any): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${id}`, user);
    }

    changePassword(id: string, password: string): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/password`, { password });
    }

    deleteUser(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
