import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { SettingsService } from './settings.service';

export interface PurchaseLine {
    product_id: number;
    product_name: string;
    units: number;
    price: number; // Purchase price
    taxid: number;
    tax_rate: number;
    discount?: number; // percentage (0-1)
    regulated?: boolean;
    subtotal?: number;
}

export interface PurchaseRequest {
    supplier_id: number;
    person_id: number;
    lines: PurchaseLine[];
    payments: any[];
    total: number;
    cash_register_id: number;
    currency_id?: number;
    exchange_rate?: number;
    money_id?: string;
    number_invoice?: string;
    number_control?: string;
    date_invoice?: Date;
    notes?: string;
    ticket_type?: number;
    global_discount?: number; // percentage (0-1)
}

export interface PurchaseState {
    id: string;
    lines: PurchaseLine[];
    selectedSupplier: any | null;
    selectedLineIndex: number;
    notes?: string;
    numberInvoice?: string;
    numberControl?: string;
    dateInvoice?: Date;
    globalDiscount: number; // percentage (0-1)
    globalTaxId?: number;
    globalTaxRate?: number;
}

@Injectable({
    providedIn: 'root'
})
export class PurchaseService {
    private apiUrl = `${environment.apiUrl}/purchases`;
    private readonly STORAGE_KEY = 'mangopos_purchase_state';

    private state: PurchaseState = this.createEmptyState();

    private currentLinesSubject = new BehaviorSubject<PurchaseLine[]>([]);
    currentLines$ = this.currentLinesSubject.asObservable();

    private selectedSupplierSubject = new BehaviorSubject<any | null>(null);
    selectedSupplier$ = this.selectedSupplierSubject.asObservable();

    private selectedLineIndexSubject = new BehaviorSubject<number>(-1);
    selectedLineIndex$ = this.selectedLineIndexSubject.asObservable();

    private globalDiscountSubject = new BehaviorSubject<number>(0);
    globalDiscount$ = this.globalDiscountSubject.asObservable();

    private exchangeRateSubject = new BehaviorSubject<number>(1);
    exchangeRate$ = this.exchangeRateSubject.asObservable();

    private purchaseStateSubject = new BehaviorSubject<PurchaseState>(this.state);
    purchaseState$ = this.purchaseStateSubject.asObservable();

    constructor(
        private http: HttpClient,
        private settingsService: SettingsService
    ) {
        this.loadFromStorage();
        this.updateState();
    }

    private createEmptyState(): PurchaseState {
        return {
            id: Math.random().toString(36).substring(2, 9),
            lines: [],
            selectedSupplier: null,
            selectedLineIndex: -1,
            notes: '',
            dateInvoice: new Date(),
            globalDiscount: 0,
            globalTaxId: 0,
            globalTaxRate: 0
        };
    }

    createPurchase(purchase: PurchaseRequest): Observable<any> {
        return this.http.post<any>(this.apiUrl, purchase).pipe(
            tap(() => this.clearPurchase())
        );
    }

    createDebtPayment(payment: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/debt-payment`, payment);
    }

    getHistory(filters: any): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/history`, { params: filters });
    }

    getById(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    // State Management
    addLine(line: PurchaseLine) {
        const existingIndex = this.state.lines.findIndex(l => l.product_id === line.product_id);

        if (existingIndex > -1) {
            this.state.lines[existingIndex].units += line.units;
        } else {
            this.state.lines.push({ ...line, discount: line.discount || 0 });
        }

        this.state.selectedLineIndex = this.state.lines.length - 1;
        this.updateState();
    }

    removeLine(index: number) {
        this.state.lines.splice(index, 1);
        if (this.state.selectedLineIndex >= this.state.lines.length) {
            this.state.selectedLineIndex = this.state.lines.length - 1;
        }
        this.updateState();
    }

    updateLineQuantity(index: number, quantity: number) {
        if (this.state.lines[index]) {
            this.state.lines[index].units = quantity;
            if (this.state.lines[index].units <= 0) {
                this.removeLine(index);
            } else {
                this.updateState();
            }
        }
    }

    updateLinePrice(index: number, price: number) {
        if (this.state.lines[index]) {
            this.state.lines[index].price = price;
            this.updateState();
        }
    }

    updateLineDiscount(index: number, discount: number) {
        if (this.state.lines[index]) {
            this.state.lines[index].discount = discount;
            this.updateState();
        }
    }

    updateLineTax(index: number, taxId: number, taxRate: number) {
        if (this.state.lines[index]) {
            this.state.lines[index].taxid = taxId;
            this.state.lines[index].tax_rate = taxRate;
            this.updateState();
        }
    }

    setGlobalDiscount(discount: number) {
        this.state.globalDiscount = discount;
        this.updateState();
    }

    setGlobalTax(taxId: number, taxRate: number) {
        this.state.globalTaxId = taxId;
        this.state.globalTaxRate = taxRate;
        this.updateState();
    }

    setSelectedSupplier(supplier: any | null) {
        this.state.selectedSupplier = supplier;
        this.selectedSupplierSubject.next(supplier);
        this.saveToStorage();
    }

    setSelectedLineIndex(index: number) {
        this.state.selectedLineIndex = index;
        this.selectedLineIndexSubject.next(index);
        this.saveToStorage();
    }

    setInvoiceData(data: { numberInvoice?: string, numberControl?: string, dateInvoice?: Date, notes?: string }) {
        this.state = { ...this.state, ...data };
        this.updateState();
    }

    clearPurchase() {
        this.state = this.createEmptyState();
        this.updateState();
    }

    private updateState() {
        this.currentLinesSubject.next([...this.state.lines]);
        this.selectedSupplierSubject.next(this.state.selectedSupplier);
        this.selectedLineIndexSubject.next(this.state.selectedLineIndex);
        this.globalDiscountSubject.next(this.state.globalDiscount);
        this.purchaseStateSubject.next({ ...this.state });
        this.saveToStorage();
    }

    private saveToStorage() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    }

    private loadFromStorage() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.state = JSON.parse(stored);
            } catch (e) {
                this.state = this.createEmptyState();
            }
        }
    }

    setExchangeRate(rate: number) {
        this.exchangeRateSubject.next(rate);
    }
}
