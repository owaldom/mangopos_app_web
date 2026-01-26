import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SettingsService } from '../../../../../../core/services/settings.service';
import { MoneyInputDirective } from '../../../../../../shared/directives/money-input.directive';

@Component({
    selector: 'app-purchase-payment-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MoneyInputDirective
    ],
    templateUrl: './purchase-payment-dialog.html',
    styleUrl: './purchase-payment-dialog.css'
})
export class PurchasePaymentDialogComponent implements OnInit {
    receivedAmount: number = 0;
    receivedAmountAlt: number = 0;
    change: number = 0;
    changeAlt: number = 0;
    selectedMethod: string = 'cash';
    selectedCurrency: 'base' | 'alt' = 'base';

    isMultiPayment: boolean = false;
    payments: { [key: string]: number } = { cash: 0, card: 0, paper: 0, Credito: 0 };
    paymentsAlt: { [key: string]: number } = { cash: 0, card: 0, paper: 0, Credito: 0 };

    paymentDetails: { [key: string]: { reference: string, bank: string, cedula?: string } } = {
        card: { reference: '', bank: '' },
        paper: { reference: '', bank: '', cedula: '' },
        cash: { reference: '', bank: '' },
        Credito: { reference: '', bank: '' }
    };

    remaining: number = 0;
    remainingAlt: number = 0;

    constructor(
        public dialogRef: MatDialogRef<PurchasePaymentDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            total: number,
            subtotal: number,
            taxes: number,
            exchangeRate: number,
            totalUSD: number,
            supplier?: any
        },
        public settingsService: SettingsService
    ) { }

    ngOnInit(): void {
        // Initialize with the total in foreign currency (Alt) and calculate the local currency (Base)
        this.receivedAmountAlt = this.data.totalUSD;
        this.calculateChange(this.receivedAmountAlt, 'alt');
    }

    toggleMultiPayment(): void {
        this.isMultiPayment = !this.isMultiPayment;
        if (this.isMultiPayment) {
            if (this.receivedAmount > 0) {
                if (this.selectedCurrency === 'base') {
                    this.payments['cash'] = this.receivedAmount;
                    this.paymentsAlt['cash'] = 0;
                } else {
                    this.paymentsAlt['cash'] = this.receivedAmountAlt;
                    this.payments['cash'] = 0;
                }
            }
            this.selectedMethod = 'mixed';
        } else {
            this.selectedMethod = 'cash';
            this.payments = { cash: 0, card: 0, paper: 0, Credito: 0 };
            this.paymentsAlt = { cash: 0, card: 0, paper: 0, Credito: 0 };
            this.calculateChange(this.selectedCurrency === 'base' ? this.receivedAmount : this.receivedAmountAlt, this.selectedCurrency);
        }
    }

    updateMultiPayment(method: string, value: number, fromSource: 'base' | 'alt'): void {
        let val = Number(value);
        if (isNaN(val)) val = 0;

        if (fromSource === 'base') {
            this.payments[method] = val;
        } else {
            this.paymentsAlt[method] = val;
        }

        this.calculateTotals();
    }

    calculateTotals(): void {
        const s = this.settingsService.getSettings();
        const totalDecimals = s?.total_decimals || 2;
        const rate = this.data.exchangeRate || 1;

        const totalBsPaid = Object.values(this.payments).reduce((a, b) => a + b, 0);
        const totalUsdPaid = Object.values(this.paymentsAlt).reduce((a, b) => a + b, 0);

        const totalValueInBs = totalBsPaid + (totalUsdPaid * rate);
        const totalValueInUsd = totalUsdPaid + (totalBsPaid / rate);

        this.receivedAmount = parseFloat(totalValueInBs.toFixed(totalDecimals));
        this.receivedAmountAlt = parseFloat(totalValueInUsd.toFixed(totalDecimals));

        const totalDueBs = this.data.total;
        const totalDueUsd = this.data.totalUSD;

        this.change = Math.max(0, this.receivedAmount - totalDueBs);
        this.changeAlt = Math.max(0, this.receivedAmountAlt - totalDueUsd);

        this.remaining = Math.max(0, totalDueBs - this.receivedAmount);
        this.remainingAlt = Math.max(0, totalDueUsd - this.receivedAmountAlt);

        this.change = parseFloat(this.change.toFixed(totalDecimals));
        this.changeAlt = parseFloat(this.changeAlt.toFixed(totalDecimals));
        this.remaining = parseFloat(this.remaining.toFixed(totalDecimals));
        this.remainingAlt = parseFloat(this.remainingAlt.toFixed(totalDecimals));
    }

    calculateChange(value: number, fromSource: 'base' | 'alt'): void {
        const s = this.settingsService.getSettings();
        const priceDecimals = s?.price_decimals || 2;
        const totalDecimals = s?.total_decimals || 2;

        const rate = this.data.exchangeRate || 1;
        let val = Number(value);

        if (isNaN(val)) val = 0;

        if (fromSource === 'base') {
            this.receivedAmount = val;
            this.receivedAmountAlt = parseFloat((val / rate).toFixed(priceDecimals));
        } else {
            this.receivedAmountAlt = val;
            this.receivedAmount = parseFloat((val * rate).toFixed(priceDecimals));
        }

        const totalBs = this.data.total;
        const totalUsd = this.data.totalUSD;

        this.change = Math.max(0, this.receivedAmount - totalBs);
        this.changeAlt = Math.max(0, this.receivedAmountAlt - totalUsd);

        this.remaining = Math.max(0, totalBs - this.receivedAmount);
        this.remainingAlt = Math.max(0, totalUsd - this.receivedAmountAlt);

        this.change = parseFloat(this.change.toFixed(totalDecimals));
        this.changeAlt = parseFloat(this.changeAlt.toFixed(totalDecimals));
        this.remaining = parseFloat(this.remaining.toFixed(totalDecimals));
        this.remainingAlt = parseFloat(this.remainingAlt.toFixed(totalDecimals));
    }

    setCurrency(type: 'base' | 'alt'): void {
        this.selectedCurrency = type;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        const paymentData = {
            method: this.isMultiPayment ? 'mixed' : this.selectedMethod,
            amount: this.selectedCurrency === 'base' ? this.receivedAmount : this.receivedAmountAlt,
            total: this.data.total,
            change: this.change,
            currency_id: this.selectedCurrency === 'base' ? 1 : 2,
            exchange_rate: this.data.exchangeRate,
            multiparams: this.isMultiPayment ? {
                payments: this.payments,
                paymentsAlt: this.paymentsAlt
            } : null,
            paymentDetails: (this.selectedMethod === 'card' || this.selectedMethod === 'paper' || this.selectedMethod === 'Credito' || this.isMultiPayment) ? this.paymentDetails : null
        };

        this.dialogRef.close(paymentData);
    }
}
