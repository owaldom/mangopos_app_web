import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

import { tap, map } from 'rxjs/operators';

export interface Unit {
    code: string;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class UnitService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/units`;

    getAll(): Observable<Unit[]> {
        return this.http.get<any[]>(this.apiUrl).pipe(
            tap(units => console.log('Units received in service:', units)),
            map(units => units.map(u => ({
                code: u.CODE || u.code,
                name: u.NAME || u.name
            })))
        );
    }
}
