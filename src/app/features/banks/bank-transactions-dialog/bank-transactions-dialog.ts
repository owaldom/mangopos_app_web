import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BanksService } from '../../../core/services/banks.service';
import { Bank, BankTransaction } from '../../../core/models/bank.model';

@Component({
    selector: 'app-bank-transactions-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './bank-transactions-dialog.html',
    styleUrls: ['./bank-transactions-dialog.scss']
})
export class BankTransactionsDialogComponent implements OnInit {
    bank: Bank;
    transactions: BankTransaction[] = [];
    displayedColumns: string[] = ['transaction_date', 'type', 'amount', 'balance_after', 'reference', 'payment_method', 'description'];
    loading = false;
    filterForm: FormGroup;

    totalIncome = 0;
    totalExpense = 0;

    constructor(
        private fb: FormBuilder,
        private banksService: BanksService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.bank = data.bank;

        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        this.filterForm = this.fb.group({
            startDate: [firstDayOfMonth],
            endDate: [today]
        });
    }

    ngOnInit(): void {
        this.loadTransactions();
    }

    loadTransactions(): void {
        this.loading = true;
        const startDate = this.filterForm.get('startDate')?.value?.toISOString().split('T')[0];
        const endDate = this.filterForm.get('endDate')?.value?.toISOString().split('T')[0];

        this.banksService.getBankTransactions(this.bank.id, startDate, endDate).subscribe({
            next: (transactions) => {
                this.transactions = transactions;
                this.calculateTotals();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading transactions:', error);
                this.loading = false;
            }
        });
    }

    calculateTotals(): void {
        this.totalIncome = this.transactions
            .filter(t => t.transaction_type === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        this.totalExpense = this.transactions
            .filter(t => t.transaction_type === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0);
    }

    getTransactionTypeLabel(type: string): string {
        const types: any = {
            'INCOME': 'Ingreso',
            'EXPENSE': 'Egreso',
            'TRANSFER': 'Transferencia',
            'ADJUSTMENT': 'Ajuste'
        };
        return types[type] || type;
    }

    getPaymentMethodLabel(method: string): string {
        const methods: any = {
            'card': 'Tarjeta',
            'transfer': 'Transferencia',
            'cash': 'Efectivo',
            'debt': 'Crédito',
            'PagoMovil': 'Pago Móvil',
            'Debito': 'Tarjeta Débito',
            'Credito': 'Tarjeta Crédito'
        };
        return methods[method] || method;
    }

    getReferenceTypeLabel(type: string): string {
        const types: any = {
            'PURCHASE': 'Compra',
            'SALE': 'Venta',
            'TRANSFER': 'Transferencia',
            'INITIAL': 'Saldo Inicial',
            'DEBT_PAYMENT': 'Pago de Deuda',
            'MANUAL': 'Manual'
        };
        return types[type] || type;
    }

    formatCurrency(amount: any): string {
        const symbol = this.bank.currency === 'USD' ? '$' : 'Bs.';
        const value = Number(amount) || 0;
        return `${symbol} ${value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleString('es-VE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
