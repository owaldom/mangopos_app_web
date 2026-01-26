import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SupplierService } from '../../../core/services/supplier.service';
import { SettingsService } from '../../../core/services/settings.service';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';

@Component({
    selector: 'app-cxp-payment-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MoneyInputDirective
    ],
    templateUrl: './cxp-payment-dialog.html',
    styleUrl: './cxp-payment-dialog.css'
})
export class CxPPaymentDialogComponent implements OnInit {
    private supplierService = inject(SupplierService);
    public settingsService = inject(SettingsService);
    private cdr = inject(ChangeDetectorRef);

    invoices: any[] = [];
    selectedInvoice: any = null;
    amountBs: number = 0;
    amountUsd: number = 0;
    paymentMethod: string = 'cash';
    numDocument: string = '';
    bank: string = '';
    cedula: string = '';
    reference: string = '';
    selectedCurrency: 'base' | 'alt' = 'base';

    totalFormat: string = '1.2-2';

    constructor(
        public dialogRef: MatDialogRef<CxPPaymentDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            supplier: any,
            exchangeRate: number
        }
    ) { }

    ngOnInit(): void {
        this.loadInvoices();
    }

    loadInvoices(): void {
        this.supplierService.getInvoices(this.data.supplier.id).subscribe(res => {
            this.invoices = res;
        });
    }

    selectMethod(method: string): void {
        this.paymentMethod = method;
        this.cdr.detectChanges();
    }

    onInvoiceChange(invoice: any): void {
        this.amountUsd = invoice.balance;
        this.onAmountUsdChange(this.amountUsd);
    }

    onAmountBsChange(value: number): void {
        const rate = this.data.exchangeRate || 1;
        const decimals = this.settingsService.getSettings()?.total_decimals || 2;
        this.amountUsd = parseFloat((value / rate).toFixed(decimals));
        this.cdr.markForCheck();
        /*
        if (this.data.exchangeRate) {
            const decimals = this.settingsService.getSettings()?.total_decimals || 2;
            this.amountUsd = parseFloat((value / this.data.exchangeRate).toFixed(decimals));
        }*/
    }

    onAmountUsdChange(value: number): void {
        const rate = this.data.exchangeRate || 1;
        const decimals = this.settingsService.getSettings()?.total_decimals || 2;
        this.amountBs = parseFloat((value * rate).toFixed(decimals));
        this.cdr.markForCheck();
        /*
        if (this.data.exchangeRate) {
            const decimals = this.settingsService.getSettings()?.total_decimals || 2;
            this.amountBs = parseFloat((value * this.data.exchangeRate).toFixed(decimals));
        }
            */
    }

    isValid(): boolean {
        return this.amountBs > 0 && !!this.selectedInvoice;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        // Prepare payments array for service
        // Backend expects: payments: Array of { method, total, bank, numdocument, invoice_number, currency_id, exchange_rate, amount_base }
        const paymentData = {
            supplier_id: this.data.supplier.id,
            payments: [{
                method: this.paymentMethod,
                total: this.selectedCurrency === 'base' ? this.amountBs : this.amountUsd,
                bank: this.bank,
                numdocument: this.cedula,
                reference: this.reference,
                invoice_number: this.selectedInvoice.numberInvoice,
                amount_base: this.amountBs,
                currency_id: this.selectedCurrency === 'base' ? 1 : 2,
                exchange_rate: this.data.exchangeRate
            }],
            exchange_rate: this.data.exchangeRate,
            currency_id: this.selectedCurrency === 'base' ? 1 : 2
        };
        this.dialogRef.close(paymentData);
    }
}
