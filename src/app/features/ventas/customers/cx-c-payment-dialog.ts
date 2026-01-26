import { Component, Inject, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CustomerService } from '../../../core/services/customer.service';
import { SettingsService } from '../../../core/services/settings.service';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';
import { LoadingButtonDirective } from '../../../shared/directives/loading-button.directive';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SalesService } from '../../../core/services/sales.service';
import { CashService } from '../../../core/services/cash.service';

@Component({
    selector: 'app-cx-c-payment-dialog',
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
        MatSelectModule,
        MoneyInputDirective,
        LoadingButtonDirective,
        MatSnackBarModule
    ],
    templateUrl: './cx-c-payment-dialog.html',
    styleUrl: './cx-c-payment-dialog.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CxCPaymentDialogComponent implements OnInit {
    private customerService = inject(CustomerService);
    public settingsService = inject(SettingsService);
    private snackBar = inject(MatSnackBar);
    private salesService = inject(SalesService);
    private cashService = inject(CashService);

    isLoading = false;

    invoices: any[] = [];
    selectedInvoice: any = null;
    amountBs: number = 0;
    amountUsd: number = 0;
    paymentMethod: string = 'cash';
    numDocument: string = ''; // Used for reference internally or combined? Let's use specific fields.
    bank: string = '';
    cedula: string = '';
    reference: string = '';
    selectedCurrency: 'base' | 'alt' = 'base';

    totalFormat: string = '1.2-2';

    constructor(
        public dialogRef: MatDialogRef<CxCPaymentDialogComponent>,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: {
            customer: any,
            exchangeRate: number
        }
    ) { }

    ngOnInit(): void {
        this.totalFormat = this.settingsService.getDecimalFormat('total');
        this.loadInvoices();
    }

    loadInvoices(): void {
        this.customerService.getInvoices(this.data.customer.id).subscribe(res => {
            this.invoices = res;
            this.cdr.markForCheck();
        });
    }

    onInvoiceChange(invoice: any): void {
        this.amountUsd = invoice.balance;
        this.onAmountUsdChange(this.amountUsd);
        this.cdr.markForCheck();
    }

    onAmountBsChange(value: number): void {
        const rate = this.data.exchangeRate || 1;
        const decimals = this.settingsService.getSettings()?.total_decimals || 2;
        this.amountUsd = parseFloat((value / rate).toFixed(decimals));
        this.cdr.markForCheck();
    }

    onAmountUsdChange(value: number): void {
        const rate = this.data.exchangeRate || 1;
        const decimals = this.settingsService.getSettings()?.total_decimals || 2;
        this.amountBs = parseFloat((value * rate).toFixed(decimals));
        this.cdr.markForCheck();
    }

    setCurrency(type: 'base' | 'alt'): void {
        this.selectedCurrency = type;
        this.cdr.markForCheck();
    }

    setPaymentMethod(method: string): void {
        this.paymentMethod = method;
        this.cdr.markForCheck();
    }


    isValid(): boolean {
        return this.amountUsd > 0 && !!this.selectedInvoice;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        const paymentData = {
            customer_id: this.data.customer.id,
            payments: [{
                method: this.paymentMethod,
                total: this.selectedCurrency === 'alt' ? this.amountUsd : this.amountBs,
                currency_id: this.selectedCurrency === 'alt' ? 2 : 1,
                bank: this.bank,
                cedula: this.cedula,
                reference: this.reference,
                invoice_number: this.selectedInvoice.numberInvoice,
                amount_base: this.amountBs
            }],
            exchange_rate: this.data.exchangeRate,
            currency_id: this.selectedCurrency === 'alt' ? 2 : 1
        };

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const finalRequest = {
            ...paymentData,
            person_id: user.id || 1,
            cash_register_id: this.cashService.getCashRegisterId(),
            money_id: this.cashService.getMoneyId() || 'CASH_MONEY'
        };

        this.isLoading = true;
        this.cdr.markForCheck();

        this.salesService.createDebtPayment(finalRequest).subscribe({
            next: () => {
                this.isLoading = false;
                this.dialogRef.close(true);
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                this.snackBar.open('Error al procesar el pago', 'Cerrar', { duration: 5000 });
                this.cdr.markForCheck();
            }
        });
    }
}
