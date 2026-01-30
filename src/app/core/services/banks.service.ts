import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bank, BankTransaction, BankMovementReport } from '../models/bank.model';

@Injectable({
    providedIn: 'root'
})
export class BanksService {
    private apiUrl = `${environment.apiUrl}/banks`;

    constructor(private http: HttpClient) { }

    // ============ BANK CRUD OPERATIONS ============

    /**
     * Get all banks
     * @param activeOnly - Filter by active status
     */
    getBanks(activeOnly?: boolean): Observable<Bank[]> {
        let params = new HttpParams();
        if (activeOnly !== undefined) {
            params = params.set('active', activeOnly.toString());
        }
        return this.http.get<Bank[]>(this.apiUrl, { params });
    }

    /**
     * Get bank by ID
     */
    getBankById(id: string): Observable<Bank> {
        return this.http.get<Bank>(`${this.apiUrl}/${id}`);
    }

    /**
     * Create a new bank
     */
    createBank(bank: Partial<Bank>): Observable<Bank> {
        return this.http.post<Bank>(this.apiUrl, bank);
    }

    /**
     * Update existing bank
     */
    updateBank(id: string, bank: Partial<Bank>): Observable<Bank> {
        return this.http.put<Bank>(`${this.apiUrl}/${id}`, bank);
    }

    /**
     * Delete bank (soft delete if has transactions)
     */
    deleteBank(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    // ============ TRANSACTION OPERATIONS ============

    /**
     * Get bank transactions
     */
    getBankTransactions(
        bankId: string,
        startDate?: string,
        endDate?: string,
        transactionType?: string
    ): Observable<BankTransaction[]> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        if (transactionType) params = params.set('transaction_type', transactionType);

        return this.http.get<BankTransaction[]>(`${this.apiUrl}/${bankId}/transactions`, { params });
    }

    /**
     * Create manual transaction
     */
    createTransaction(bankId: string, transaction: Partial<BankTransaction>): Observable<BankTransaction> {
        return this.http.post<BankTransaction>(`${this.apiUrl}/${bankId}/transactions`, transaction);
    }

    /**
     * Get current bank balance
     */
    getBankBalance(bankId: string): Observable<{ current_balance: number; currency: string }> {
        return this.http.get<{ current_balance: number; currency: string }>(`${this.apiUrl}/${bankId}/balance`);
    }

    /**
     * Get bank movement report
     */
    getBankMovementReport(
        bankId: string,
        startDate?: string,
        endDate?: string
    ): Observable<BankMovementReport> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        return this.http.get<BankMovementReport>(`${this.apiUrl}/${bankId}/movements`, { params });
    }

    /**
     * Reconcile bank balance
     */
    reconcileBalance(bankId: string, newBalance: number, notes?: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${bankId}/reconcile`, {
            new_balance: newBalance,
            notes
        });
    }
}
