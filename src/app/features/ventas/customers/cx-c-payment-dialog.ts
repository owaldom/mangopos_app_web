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
import { BanksService } from '../../../core/services/banks.service';
import { Bank } from '../../../core/models/bank.model';

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
    private banksService = inject(BanksService);

    isLoading = false;

    invoices: any[] = [];
    selectedInvoice: any = null;
    amountBs: number = 0;
    amountUsd: number = 0;

    amountReceived: number = 0; // Monto recibido en moneda seleccionada
    change: number = 0;         // Vuelto calculado en moneda seleccionada

    paymentMethod: string = 'cash';
    numDocument: string = '';
    bank: string = '';
    selectedBankId: string = '';
    banks: Bank[] = [];
    cedula: string = '';
    reference: string = '';
    account: string = '';
    is_pago_movil: boolean = false;
    selectedCurrency: 'base' | 'alt' = 'base';

    igtfAmount: number = 0;
    igtfAmountAlt: number = 0;

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
        this.loadBanks();
    }

    loadBanks(): void {
        this.banksService.getBanks(true).subscribe(banks => {
            this.banks = banks;
            this.cdr.markForCheck();
        });
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
        this.calculateIGTF();
        this.cdr.markForCheck();
    }

    onAmountUsdChange(value: number): void {
        const rate = this.data.exchangeRate || 1;
        const decimals = this.settingsService.getSettings()?.total_decimals || 2;
        this.amountBs = parseFloat((value * rate).toFixed(decimals));
        this.calculateIGTF();
        this.cdr.markForCheck();
    }

    calculateIGTF(): void {
        const s = this.settingsService.getSettings();
        const rate = this.data.exchangeRate || 1;
        const decimals = s?.total_decimals || 2;

        if (this.selectedCurrency === 'alt') {
            const igtfRate = (s?.igtf_enabled) ? (s.igtf_percentage || 3) / 100 : 0;
            this.igtfAmountAlt = parseFloat((this.amountUsd * igtfRate).toFixed(decimals));
            this.igtfAmount = parseFloat((this.igtfAmountAlt * rate).toFixed(decimals));
        } else {
            this.igtfAmountAlt = 0;
            this.igtfAmount = 0;
        }
    }

    onAmountReceivedChange(value: number): void {
        let toPay = this.selectedCurrency === 'base' ? this.amountBs : this.amountUsd;

        // Sumar IGTF si aplica
        if (this.selectedCurrency === 'alt') {
            toPay += this.igtfAmountAlt;
        } else {
            toPay += this.igtfAmount;
        }

        this.change = Math.max(0, parseFloat((value - toPay).toFixed(2)));
        this.cdr.markForCheck();
    }

    setCurrency(type: 'base' | 'alt'): void {
        this.selectedCurrency = type;
        this.calculateIGTF();
        // Reset received and change on currency switch
        this.amountReceived = 0;
        this.change = 0;
        this.cdr.markForCheck();
    }

    setPaymentMethod(method: string): void {
        this.paymentMethod = method;
        this.is_pago_movil = (method === 'paper' || method === 'PagoMovil');
        this.cdr.markForCheck();
    }

    getFilteredBanks(): Bank[] {
        if (this.paymentMethod === 'paper' || this.paymentMethod === 'PagoMovil') {
            return this.banks.filter(b => b.allows_pago_movil);
        }
        return this.banks;
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
            igtf_amount: this.igtfAmount, // Enviar monto IGTF en Bs
            igtf_amount_alt: this.igtfAmountAlt, // Enviar monto IGTF en USD
            change: this.change, // Enviar vuelto calculado
            payments: [{
                method: this.paymentMethod === 'paper' ? 'PagoMovil' : (this.paymentMethod === 'transfer' ? 'transfer' : this.paymentMethod),
                total: this.selectedCurrency === 'alt' ? this.amountUsd : this.amountBs,
                currency_id: this.selectedCurrency === 'alt' ? 2 : 1,
                bank: this.banks.find(b => b.id === this.selectedBankId)?.name || this.bank,
                bank_id: this.selectedBankId,
                cedula: this.cedula,
                reference: this.reference,
                account_number: this.account,
                is_pago_movil: this.is_pago_movil,
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
