import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { SettingsService } from './settings.service';
import { DiscountService } from './discount.service';
import { AppConfigService } from './app-config.service';
import { WarehouseService } from './warehouse.service';

export interface SalesCatalog {
    categories: any[];
    products: any[];
}

export interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate: number;
    is_base: boolean;
}

export interface TicketLine {
    product_id: number;
    product_name: string;
    units: number;
    price: number;
    taxid: number;
    tax_rate: number;
    discount?: number; // Percent (0-1) or absolute value
    discount_type?: 'PERCENT' | 'FIXED' | 'FIXED_VES';
    discountid?: string;
    subtotal?: number;
    selectedComponents?: any[]; // For Kits
}

export interface SaleRequest {
    customer_id?: number | null;
    person_id: number;
    lines: TicketLine[];
    payments: any[];
    total: number;
    cash_register_id: number;
    currency_id?: number;
    exchange_rate?: number;
    notes?: string;
    location_id: number;
    money_id?: string;
    igtf_amount?: number;
    igtf_amount_alt?: number;
    change?: number;
}

export interface TicketState {
    id: string;
    lines: TicketLine[];
    selectedCustomer: any | null;
    selectedLineIndex: number;
    notes?: string;
    globalDiscount?: number;
    globalDiscountType?: 'PERCENT' | 'FIXED' | 'FIXED_VES';
    location_id?: number;
}

@Injectable({
    providedIn: 'root'
})
export class SalesService {
    private apiUrl = `${environment.apiUrl}/sales`;

    // Multi-ticket state
    private tickets: TicketState[] = [];
    private activeTicketIndex = 0;
    private readonly STORAGE_KEY = 'mangopos_sales_state';

    private currentLinesSubject = new BehaviorSubject<TicketLine[]>([]);
    currentLines$ = this.currentLinesSubject.asObservable();

    private ticketsSubject = new BehaviorSubject<TicketState[]>(this.tickets);
    tickets$ = this.ticketsSubject.asObservable();

    private activeTicketIndexSubject = new BehaviorSubject<number>(0);
    activeTicketIndex$ = this.activeTicketIndexSubject.asObservable();

    private exchangeRateSubject = new BehaviorSubject<number>(1);
    exchangeRate$ = this.exchangeRateSubject.asObservable();

    private selectedLineIndexSubject = new BehaviorSubject<number>(-1);
    selectedLineIndex$ = this.selectedLineIndexSubject.asObservable();

    private selectedCustomerSubject = new BehaviorSubject<any | null>(null);
    selectedCustomer$ = this.selectedCustomerSubject.asObservable();

    private notesSubject = new BehaviorSubject<string>('');
    notes$ = this.notesSubject.asObservable();

    private currentLocationIdSubject = new BehaviorSubject<number | null>(null);
    currentLocationId$ = this.currentLocationIdSubject.asObservable();

    private currentLocationNameSubject = new BehaviorSubject<string>('');
    currentLocationName$ = this.currentLocationNameSubject.asObservable();

    constructor(
        private http: HttpClient,
        private settingsService: SettingsService,
        private discountService: DiscountService,
        private configService: AppConfigService,
        private warehouseService: WarehouseService
    ) {
        this.loadFromStorage();
        this.resolveCurrentLocation();
        this.updateState();
    }

    private createEmptyTicket(): TicketState {
        return {
            id: Math.random().toString(36).substring(2, 9),
            lines: [],
            selectedCustomer: null,
            selectedLineIndex: -1,
            notes: '',
            globalDiscount: 0,
            globalDiscountType: 'PERCENT'
        };
    }

    resolveCurrentLocation(): void {
        const config = this.configService.getConfig();
        if (!config) return;

        this.warehouseService.getAll().subscribe(warehouses => {
            let match = null;

            // 1. Prioritize explicit warehouse_id
            if (config.warehouse_id) {
                match = warehouses.find(w => w.id === config.warehouse_id);
            }

            // 2. Try match by name (case-insensitive)
            if (!match) {
                const searchName = config.location_name?.toLowerCase();
                match = warehouses.find(w => w.name.toLowerCase() === searchName);
            }

            // 3. Fallback based on installation type
            if (!match) {
                if (config.installation_type === 'factory') {
                    // Try factory_warehouse_id
                    if (config.factory_warehouse_id) {
                        match = warehouses.find(w => w.id === config.factory_warehouse_id);
                    }
                    // Try first factory type warehouse
                    if (!match) {
                        match = warehouses.find(w => w.type === 'factory');
                    }
                } else {
                    // POS Mode: Try first pos type warehouse
                    match = warehouses.find(w => w.type === 'pos');
                }
            }

            // 4. Global fallback if still no match: use first available warehouse
            if (!match && warehouses.length > 0) {
                match = warehouses[0];
            }

            if (match) {
                console.log(`Sales resolved to location: ${match.name} (ID: ${match.id})`);
                this.setCurrentLocation(match.id, match.name);
                // Also update existing tickets if they don't have location_id
                this.tickets.forEach(t => {
                    if (!t.location_id) t.location_id = match.id;
                });
                this.saveToStorage();
            } else {
                console.warn(`Could not resolve location for sales. Using default.`);
            }
        });
    }

    setCurrentLocation(id: number, name: string): void {
        this.currentLocationIdSubject.next(id);
        this.currentLocationNameSubject.next(name);
    }

    getCatalog(): Observable<SalesCatalog> {
        const locationId = this.currentLocationIdSubject.value || 1;
        return this.http.get<SalesCatalog>(`${this.apiUrl}/catalog`, {
            params: { locationId: locationId.toString() }
        });
    }

    getCurrencies(): Observable<Currency[]> {
        return this.http.get<Currency[]>(`${this.apiUrl}/currencies`);
    }

    createSale(sale: SaleRequest): Observable<any> {
        return this.http.post<any>(this.apiUrl, sale).pipe(
            tap(() => this.clearTicket())
        );
    }

    createDebtPayment(payment: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/debt-payment`, payment);
    }

    // Ticket Management
    addTicket() {
        if (this.tickets.length >= 10) return; // Limit to 10 tickets
        const newTicket = this.createEmptyTicket();
        this.tickets.push(newTicket);
        this.activeTicketIndex = this.tickets.length - 1;
        this.updateState();
    }

    removeTicket(index: number) {
        if (this.tickets.length <= 1) {
            this.clearTicket();
            return;
        }
        this.tickets.splice(index, 1);
        if (this.activeTicketIndex >= this.tickets.length) {
            this.activeTicketIndex = this.tickets.length - 1;
        }
        this.updateState();
    }

    setActiveTicket(index: number) {
        if (index >= 0 && index < this.tickets.length) {
            this.activeTicketIndex = index;
            this.updateState();
        }
    }

    private updateState() {
        this.ticketsSubject.next([...this.tickets]);
        this.activeTicketIndexSubject.next(this.activeTicketIndex);
        this.updateActiveTicketObservables();
    }

    private updateActiveTicketObservables() {
        const activeTicket = this.tickets[this.activeTicketIndex];
        this.currentLinesSubject.next([...activeTicket.lines]);
        this.selectedLineIndexSubject.next(activeTicket.selectedLineIndex);
        this.selectedCustomerSubject.next(activeTicket.selectedCustomer);
        this.notesSubject.next(activeTicket.notes || '');
        this.saveToStorage();
    }

    private saveToStorage() {
        const state = {
            tickets: this.tickets,
            activeTicketIndex: this.activeTicketIndex
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }

    get currentLocationId(): number | null {
        return this.currentLocationIdSubject.value;
    }

    getActiveTicketIndex(): number {
        return this.activeTicketIndex;
    }

    private loadFromStorage() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                const state = JSON.parse(stored);
                if (state.tickets && state.tickets.length > 0) {
                    this.tickets = state.tickets;
                    this.activeTicketIndex = state.activeTicketIndex || 0;
                    return;
                }
            } catch (e) {
                console.error('Error loading sales state from storage', e);
            }
        }
        // If nothing stored or error, start with default ticket
        this.tickets = [this.createEmptyTicket()];
        this.activeTicketIndex = 0;
    }

    // Lógica de gestión del ticket local (afecta al ticket activo)
    addLine(line: TicketLine) {
        const activeTicket = this.tickets[this.activeTicketIndex];
        const lines = activeTicket.lines;
        const existingIndex = lines.findIndex(l => l.product_id === line.product_id);

        if (existingIndex > -1) {
            lines[existingIndex].units += line.units;
        } else {
            lines.push({ ...line });
        }

        activeTicket.selectedLineIndex = lines.length - 1;
        this.updateState();
    }

    addLineWithDiscount(product: any, units: number, customerId?: number, selectedComponents?: any[]) {
        this.discountService.getApplicableDiscount(product.id, customerId).subscribe(discount => {
            let discountValue = 0;
            let discountType: 'PERCENT' | 'FIXED' | 'FIXED_VES' = 'PERCENT';

            if (discount) {
                discountValue = discount.quantity;
                discountType = discount.percentage ? 'PERCENT' : 'FIXED';
            }

            this.addLine({
                product_id: product.id,
                product_name: product.name,
                units: units,
                price: product.pricesell,
                taxid: product.tax_id || product.taxcat, // Use tax_id (taxes.id) if available, fallback to taxcat
                tax_rate: product.tax_rate || 0.16,
                discount: discountType === 'PERCENT' ? (discountValue / 100) : discountValue,
                discount_type: discountType,
                selectedComponents: selectedComponents
            });
        });
    }

    refreshAllLineDiscounts(customerId: number): void {
        const activeTicket = this.tickets[this.activeTicketIndex];
        const lines = activeTicket.lines;
        lines.forEach((line, index) => {
            this.discountService.getApplicableDiscount(line.product_id, customerId).subscribe(discount => {
                if (discount) {
                    const type = discount.percentage ? 'PERCENT' : 'FIXED';
                    this.updateLineDiscount(index, discount.quantity, type);
                } else {
                    this.updateLineDiscount(index, 0, 'PERCENT');
                }
            });
        });
    }

    removeLine(index: number) {
        const activeTicket = this.tickets[this.activeTicketIndex];
        const lines = activeTicket.lines;
        lines.splice(index, 1);

        if (activeTicket.selectedLineIndex >= lines.length) {
            activeTicket.selectedLineIndex = lines.length - 1;
        }
        this.updateState();
    }

    updateLineQuantity(index: number, quantity: number) {
        const activeTicket = this.tickets[this.activeTicketIndex];
        const lines = activeTicket.lines;
        if (lines[index]) {
            lines[index].units = quantity;
            // Use a small epsilon to handle floating point issues
            if (lines[index].units <= 0.0001) {
                this.removeLine(index);
            } else {
                this.updateState();
            }
        }
    }

    updateLinePrice(index: number, price: number) {
        const activeTicket = this.tickets[this.activeTicketIndex];
        const lines = activeTicket.lines;
        if (lines[index]) {
            lines[index].price = price;
            this.updateState();
        }
    }

    updateLineDiscount(index: number, discount: number, type: 'PERCENT' | 'FIXED' | 'FIXED_VES' = 'PERCENT') {
        const activeTicket = this.tickets[this.activeTicketIndex];
        const lines = activeTicket.lines;
        if (lines[index]) {
            lines[index].discount = type === 'PERCENT' ? (discount / 100) : discount;
            lines[index].discount_type = type;
            this.updateState();
        }
    }

    clearTicket() {
        const activeTicket = this.tickets[this.activeTicketIndex];
        activeTicket.lines = [];
        activeTicket.selectedCustomer = null;
        activeTicket.selectedLineIndex = -1;
        this.updateState();
    }

    setSelectedCustomer(customer: any | null) {
        this.tickets[this.activeTicketIndex].selectedCustomer = customer;
        this.selectedCustomerSubject.next(customer);
    }

    getSelectedCustomer(): any | null {
        return this.tickets[this.activeTicketIndex].selectedCustomer;
    }

    setNotes(notes: string) {
        this.tickets[this.activeTicketIndex].notes = notes;
        this.notesSubject.next(notes);
    }

    getNotes(): string {
        return this.tickets[this.activeTicketIndex].notes || '';
    }

    setGlobalDiscount(discount: number, type: 'PERCENT' | 'FIXED' | 'FIXED_VES' = 'PERCENT') {
        const activeTicket = this.tickets[this.activeTicketIndex];
        activeTicket.globalDiscount = type === 'PERCENT' ? (discount / 100) : discount;
        activeTicket.globalDiscountType = type;
        this.updateState();
    }

    getGlobalDiscount(): number {
        return this.tickets[this.activeTicketIndex].globalDiscount || 0;
    }

    getGlobalDiscountType(): 'PERCENT' | 'FIXED' | 'FIXED_VES' {
        return this.tickets[this.activeTicketIndex].globalDiscountType || 'PERCENT';
    }

    getTotal(): number {
        const activeTicket = this.tickets[this.activeTicketIndex];
        const rate = this.exchangeRateSubject.value;
        const s = this.settingsService.getSettings();
        const totalDecimals = s?.total_decimals || 2;

        const subtotalWithLineDiscounts = activeTicket.lines.reduce((acc, line) => {
            let unitPrice = line.price;
            if (line.discount) {
                if (line.discount_type === 'FIXED') {
                    unitPrice = Math.max(0, line.price - line.discount);
                } else if (line.discount_type === 'FIXED_VES') {
                    const discountUSD = line.discount / rate;
                    unitPrice = Math.max(0, line.price - discountUSD);
                } else {
                    unitPrice = line.price * (1 - line.discount);
                }
            }
            const base = line.units * unitPrice;
            const tax = base * (line.tax_rate || 0);
            return acc + base + tax;
        }, 0);

        let finalTotalUSD = subtotalWithLineDiscounts;

        if (activeTicket.globalDiscount) {
            if (activeTicket.globalDiscountType === 'FIXED') {
                finalTotalUSD = Math.max(0, subtotalWithLineDiscounts - activeTicket.globalDiscount);
            } else if (activeTicket.globalDiscountType === 'FIXED_VES') {
                const discountUSD = activeTicket.globalDiscount / rate;
                finalTotalUSD = Math.max(0, subtotalWithLineDiscounts - discountUSD);
            } else {
                finalTotalUSD = subtotalWithLineDiscounts * (1 - activeTicket.globalDiscount);
            }
        }

        return parseFloat(finalTotalUSD.toFixed(totalDecimals));
    }

    setExchangeRate(rate: number) {
        this.exchangeRateSubject.next(rate);
    }

    getExchangeRate(): number {
        return this.exchangeRateSubject.value;
    }

    setSelectedLineIndex(index: number) {
        this.tickets[this.activeTicketIndex].selectedLineIndex = index;
        this.selectedLineIndexSubject.next(index);
    }

    getSelectedLineIndex(): number {
        return this.tickets[this.activeTicketIndex].selectedLineIndex;
    }

    refreshCartPrices(products: any[]) {
        let updated = false;
        this.tickets.forEach(ticket => {
            ticket.lines.forEach(line => {
                const catalogProd = products.find(p => p.id === line.product_id);
                if (catalogProd && catalogProd.pricesell !== line.price) {
                    line.price = catalogProd.pricesell;
                    updated = true;
                }
            });
        });

        if (updated) {
            this.updateState();
        }
        return updated;
    }
}
