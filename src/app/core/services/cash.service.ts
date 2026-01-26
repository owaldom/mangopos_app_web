import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface CashSession {
    id: number;
    money: string;
    host: string;
    hostsequence: number;
    cash_register_id: number;
    currency_id: number;
    datestart: string;
    dateend?: string;
    initial_balance?: number;
    initial_balance_alt?: number;
}

export interface CashSummary {
    payments: {
        payment: string;
        total: number;
        currency_id: number;
        symbol: string;
    }[];
    cxcPayments: {
        payment: string;
        total: number;
        currency_id: number;
        symbol: string;
    }[];
    cxpPayments: {
        payment: string;
        total: number;
        currency_id: number;
        symbol: string;
    }[];
    purchasePayments: {
        payment: string;
        total: number;
        currency_id: number;
        symbol: string;
    }[];
    sales: {
        ticket_count?: number;
        subtotal: number;
        taxes: number;
        total: number;
    };
    salesByCurrency: {
        currency_id: number;
        ticket_count: number;
        subtotal: number;
        taxes: number;
        total: number;
    }[];
    movements: {
        movement_type: 'IN' | 'OUT';
        currency_id: number;
        total: number;
        symbol: string;
    }[];
}

export interface CashMovement {
    id?: number;
    datenew: Date | string;
    money?: string;
    movement_type: 'IN' | 'OUT';
    amount: number;
    currency_id?: number;
    concept?: string;
    person?: string;
    // Joined fields
    currency_symbol?: string;
    person_name?: string;
    host?: string;
    hostsequence?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class CashService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cash`;

    private currentSessionSubject = new BehaviorSubject<CashSession | null>(null);
    public currentSession$ = this.currentSessionSubject.asObservable();

    constructor() {
        this.checkStatus();
    }

    get hostName(): string {
        // Podríamos usar un ID único por navegador o el nombre del equipo si se configura
        return window.location.hostname || 'LOCAL-HOST';
    }

    async checkStatus(): Promise<boolean> {
        try {
            const res = await firstValueFrom(
                this.http.get<{ opened: boolean, session?: CashSession }>(`${this.apiUrl}/status?host=${this.hostName}`)
            );

            if (res.opened && res.session) {
                this.currentSessionSubject.next(res.session);
                return true;
            } else {
                this.currentSessionSubject.next(null);
                return false;
            }
        } catch (error) {
            console.error('Error checking cash status', error);
            return false;
        }
    }

    async openCash(data: { cash_register_id?: number, currency_id?: number, initial_balance?: number, initial_balance_alt?: number } = {}): Promise<CashSession> {
        const payload = {
            host: this.hostName,
            ...data
        };

        const session = await firstValueFrom(this.http.post<CashSession>(`${this.apiUrl}/open`, payload));
        this.currentSessionSubject.next(session);
        return session;
    }

    async closeCash(): Promise<void> {
        const session = this.currentSessionSubject.value;
        if (!session) return;

        await firstValueFrom(this.http.post(`${this.apiUrl}/close`, { moneyId: session.money }));
        this.currentSessionSubject.next(null);
    }

    getSummary(moneyId: string): Observable<CashSummary> {
        return this.http.get<CashSummary>(`${this.apiUrl}/summary/${moneyId}`);
    }

    isOpened(): boolean {
        return this.currentSessionSubject.value !== null;
    }

    getMoneyId(): string | null {
        return this.currentSessionSubject.value?.money || null;
    }

    getCashRegisterId(): number | null {
        return this.currentSessionSubject.value?.cash_register_id || null;
    }

    // Cash Movements
    getCashMovements(
        page: number = 1,
        limit: number = 50,
        filters?: {
            startDate?: string;
            endDate?: string;
            moneyId?: string;
            movementType?: 'IN' | 'OUT';
            currencyId?: number;
        }
    ): Observable<PaginatedResponse<CashMovement>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (filters?.startDate) {
            params = params.set('startDate', filters.startDate);
        }
        if (filters?.endDate) {
            params = params.set('endDate', filters.endDate);
        }
        if (filters?.moneyId) {
            params = params.set('moneyId', filters.moneyId);
        }
        if (filters?.movementType) {
            params = params.set('movementType', filters.movementType);
        }
        if (filters?.currencyId) {
            params = params.set('currencyId', filters.currencyId.toString());
        }

        return this.http.get<PaginatedResponse<CashMovement>>(`${this.apiUrl}/movements`, { params });
    }

    createCashMovement(movement: CashMovement): Observable<CashMovement> {
        if (movement.datenew instanceof Date) {
            movement.datenew = this.formatLocalDate(movement.datenew);
        }
        return this.http.post<CashMovement>(`${this.apiUrl}/movements`, movement);
    }

    private formatLocalDate(date: Date): string {
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
}
