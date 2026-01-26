import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppSettings {
    price_decimals: number;
    total_decimals: number;
    quantity_decimals: number;
    currency_symbol: string;
    currency_code: string;
    company_name: string;
    company_address: string;
    enable_pdf_ticket: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private apiUrl = `${environment.apiUrl}/settings`;
    private settingsSubject = new BehaviorSubject<AppSettings | null>(null);
    public settings$ = this.settingsSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadSettings();
    }

    async loadSettings(): Promise<AppSettings> {
        try {
            const data = await firstValueFrom(this.http.get<any>(this.apiUrl));
            const settings: AppSettings = {
                price_decimals: parseInt(data.price_decimals) || 2,
                total_decimals: parseInt(data.total_decimals) || 2,
                quantity_decimals: parseInt(data.quantity_decimals) || 3,
                currency_symbol: data.currency_symbol || 'Bs.',
                currency_code: data.currency_code || 'VES',
                company_name: data.company_name || 'MANGOPOS',
                company_address: data.company_address || '',
                enable_pdf_ticket: data.enable_pdf_ticket === 'true'
            };
            this.settingsSubject.next(settings);
            return settings;
        } catch (error) {
            console.error('Error loading settings', error);
            throw error;
        }
    }

    getSettings(): AppSettings | null {
        return this.settingsSubject.value;
    }

    async updateSettings(settings: AppSettings): Promise<void> {
        await firstValueFrom(this.http.put(this.apiUrl, settings));
        this.settingsSubject.next(settings);
    }

    getCurrencies(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/sales/currencies`);
    }

    async updateCurrency(id: number, currency: any): Promise<void> {
        await firstValueFrom(this.http.put(`${this.apiUrl}/currency/${id}`, currency));
    }

    getDecimalFormat(type: 'price' | 'total' | 'quantity'): string {
        const s = this.getSettings();
        if (!s) return '1.2-2';

        let decimals = 2;
        if (type === 'price') decimals = s.price_decimals;
        if (type === 'total') decimals = s.total_decimals;
        if (type === 'quantity') decimals = s.quantity_decimals;

        return `1.${decimals}-${decimals}`;
    }

    // Cache for exchange rate
    private exchangeRate: number = 1;

    async loadExchangeRate(): Promise<number> {
        try {
            const currencies = await firstValueFrom(this.getCurrencies());
            const usd = currencies.find(c => c.symbol === '$' || c.code === 'USD');
            if (usd) {
                this.exchangeRate = parseFloat(usd.exchange_rate);
            }
            return this.exchangeRate;
        } catch (error) {
            console.error('Error loading exchange rate', error);
            return 1;
        }
    }

    getExchangeRate(): number {
        return this.exchangeRate;
    }
}
