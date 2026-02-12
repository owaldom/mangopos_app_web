import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SettingsService } from '../../../../../core/services/settings.service';
import { BanksService } from '../../../../../core/services/banks.service';
import { Bank } from '../../../../../core/models/bank.model';
import { MoneyInputDirective } from '../../../../../shared/directives/money-input.directive';

@Component({
  selector: 'app-payment-dialog',
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
  templateUrl: './payment-dialog.html',
  styleUrl: './payment-dialog.css'
})
export class PaymentDialogComponent implements OnInit {
  receivedAmount: number = 0;
  receivedAmountAlt: number = 0;
  change: number = 0;
  changeAlt: number = 0;
  selectedMethod: string = 'cash';
  selectedCurrency: 'base' | 'alt' = 'base';
  pow = Math.pow;

  isMultiPayment: boolean = false;
  payments: { [key: string]: number } = { cash: 0, card: 0, PagoMovil: 0, transfer: 0, Credito: 0 };
  paymentsAlt: { [key: string]: number } = { cash: 0, card: 0, PagoMovil: 0, transfer: 0, Credito: 0 };

  paymentDetails: { [key: string]: { reference: string, bank: string, cedula: string, bank_id?: string, account?: string, is_pago_movil?: boolean } } = {
    card: { reference: '', bank: '', cedula: '', bank_id: '' },
    PagoMovil: { reference: '', bank: '', cedula: '', bank_id: '', is_pago_movil: true },
    transfer: { reference: '', bank: '', cedula: '', bank_id: '', account: '' },
    cash: { reference: '', bank: '', cedula: '', bank_id: '' },
    Credito: { reference: '', bank: '', cedula: '', bank_id: '' }
  };

  banks: Bank[] = [];
  selectedBankId: string = '';

  remaining: number = 0;
  remainingAlt: number = 0;

  igtfAmount: number = 0;
  igtfAmountAlt: number = 0;

  constructor(
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      total: number,
      subtotal: number,
      taxes: number,
      exchangeRate: number,
      totalAlt: number,
      money_id?: string | null,
      customer?: any
    },
    public settingsService: SettingsService,
    private banksService: BanksService
  ) { }

  ngOnInit(): void {
    // Initialize with the total in foreign currency (Alt) and calculate the local currency (Base)
    this.receivedAmountAlt = this.data.totalAlt;
    this.calculateChange(this.receivedAmountAlt, 'alt');

    // Load active banks
    this.loadBanks();
  }

  loadBanks(): void {
    this.banksService.getBanks(true).subscribe({
      next: (banks) => {
        this.banks = banks;
      },
      error: (error) => {
        console.error('Error loading banks:', error);
      }
    });
  }

  requiresBank(method: string): boolean {
    return ['card', 'transfer', 'Debito', 'Credito', 'PagoMovil'].includes(method);
  }

  getFilteredBanks(method: string): Bank[] {
    if (method === 'PagoMovil') {
      return this.banks.filter(b => b.allows_pago_movil);
    }
    return this.banks;
  }

  toggleMultiPayment(): void {
    this.isMultiPayment = !this.isMultiPayment;
    if (this.isMultiPayment) {
      // Initialize with current received amount based on selected currency
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
      this.payments = { cash: 0, card: 0, PagoMovil: 0, transfer: 0, Credito: 0 };
      this.paymentsAlt = { cash: 0, card: 0, PagoMovil: 0, transfer: 0, Credito: 0 };
      // Reset to main amount
      this.calculateChange(this.selectedCurrency === 'base' ? this.receivedAmount : this.receivedAmountAlt, this.selectedCurrency);
    }
  }

  updateMultiPayment(method: string, value: number, fromSource: 'base' | 'alt'): void {
    // In mixed mode, values are independent
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

    // Sum all Bs payments
    const totalBsPaid = Object.values(this.payments).reduce((a, b) => a + b, 0);

    // Sum all USD payments
    const totalUsdPaid = Object.values(this.paymentsAlt).reduce((a, b) => a + b, 0);

    // Calculate IGTF
    const igtfRate = (s?.igtf_enabled) ? (s.igtf_percentage || 3) / 100 : 0;
    this.igtfAmountAlt = totalUsdPaid * igtfRate;
    this.igtfAmount = this.igtfAmountAlt * rate;

    // Total Value PAID in Bs = Bs + (USD * Rate)
    const totalValueInBs = totalBsPaid + (totalUsdPaid * rate);

    // Total Value PAID in USD = USD + (Bs / Rate)
    const totalValueInUsd = totalUsdPaid + (totalBsPaid / rate);

    this.receivedAmount = parseFloat(totalValueInBs.toFixed(totalDecimals));
    this.receivedAmountAlt = parseFloat(totalValueInUsd.toFixed(totalDecimals));

    // Calculate Change/Remaining
    const baseTotalBs = parseFloat((this.data.totalAlt * rate).toFixed(totalDecimals));
    const baseTotalUsd = this.data.totalAlt;

    const totalDueBs = baseTotalBs + this.igtfAmount;
    const totalDueUsd = baseTotalUsd + this.igtfAmountAlt;

    this.change = Math.max(0, this.receivedAmount - totalDueBs);
    this.changeAlt = Math.max(0, this.receivedAmountAlt - totalDueUsd);

    this.remaining = Math.max(0, totalDueBs - this.receivedAmount);
    this.remainingAlt = Math.max(0, totalDueUsd - this.receivedAmountAlt);

    // Rounding
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

    // Ensure val is a valid number, default to 0 if NaN
    if (isNaN(val)) val = 0;

    // In single mode, we only have one source of payment
    let totalUsdPaid = 0;
    if (fromSource === 'alt') {
      totalUsdPaid = val;
    }

    // Calculate IGTF
    const igtfRate = (s?.igtf_enabled) ? (s.igtf_percentage || 3) / 100 : 0;
    this.igtfAmountAlt = totalUsdPaid * igtfRate;
    this.igtfAmount = this.igtfAmountAlt * rate;

    if (fromSource === 'base') {
      this.receivedAmount = val; // Sync local state
      this.receivedAmountAlt = parseFloat((val / rate).toFixed(priceDecimals));
    } else {
      this.receivedAmountAlt = val; // Sync local state
      this.receivedAmount = parseFloat((val * rate).toFixed(priceDecimals));
    }

    const baseTotalBs = parseFloat((this.data.totalAlt * rate).toFixed(totalDecimals));
    const baseTotalUsd = this.data.totalAlt;

    const totalDueBs = baseTotalBs + this.igtfAmount;
    const totalDueUsd = baseTotalUsd + this.igtfAmountAlt;

    this.change = Math.max(0, this.receivedAmount - totalDueBs);
    this.changeAlt = Math.max(0, this.receivedAmountAlt - totalDueUsd);

    this.remaining = Math.max(0, totalDueBs - this.receivedAmount);
    this.remainingAlt = Math.max(0, totalDueUsd - this.receivedAmountAlt);

    // Round change values for display
    this.change = parseFloat(this.change.toFixed(totalDecimals));
    this.changeAlt = parseFloat(this.changeAlt.toFixed(totalDecimals));
    this.remaining = parseFloat(this.remaining.toFixed(totalDecimals));
    this.remainingAlt = parseFloat(this.remainingAlt.toFixed(totalDecimals));
  }

  setCurrency(type: 'base' | 'alt'): void {
    this.selectedCurrency = type;

    // If switching to USD and current method is disabled (card, transfer, PagoMovil), reset to cash
    if (type === 'alt' && ['card', 'transfer', 'PagoMovil'].includes(this.selectedMethod)) {
      this.selectedMethod = 'cash';
    }

    // Recalculate with current value
    this.calculateChange(this.selectedCurrency === 'base' ? this.receivedAmount : this.receivedAmountAlt, this.selectedCurrency);
  }

  isMethodDisabled(method: string): boolean {
    if (this.selectedCurrency === 'alt') {
      if (['card', 'transfer', 'PagoMovil'].includes(method)) {
        return true;
      }
    }

    if (method === 'Credito' && !this.data.customer) {
      return true;
    }

    return false;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getTaxPercentage(): number {
    if (this.data.subtotal > 0 && this.data.taxes > 0) {
      return Math.round((this.data.taxes / this.data.subtotal) * 100);
    }
    return 16; // Default IVA percentage
  }

  onConfirm(): void {
    const paymentData = {
      method: this.isMultiPayment ? 'mixed' : this.selectedMethod,
      amount: this.selectedCurrency === 'base' ? this.receivedAmount : this.receivedAmountAlt,
      total: this.data.total,
      change: this.selectedCurrency === 'base' ? this.change : this.changeAlt,
      currency_id: this.selectedCurrency === 'base' ? 1 : 2,
      exchange_rate: this.data.exchangeRate,
      money_id: this.data.money_id,
      bank_id: this.selectedBankId || null,
      igtf_amount: this.igtfAmount, // Enviar monto IGTF en Bs
      igtf_amount_alt: this.igtfAmountAlt, // Enviar monto IGTF en USD
      multiparams: this.isMultiPayment ? {
        payments: this.payments,
        paymentsAlt: this.paymentsAlt
      } : null,
      paymentDetails: (this.selectedMethod === 'card' || this.selectedMethod === 'transfer' || this.selectedMethod === 'PagoMovil' || this.selectedMethod === 'Credito' || this.isMultiPayment) ? this.paymentDetails : null
    };

    // Validation for Credit Sale
    const isMixedDebt = this.isMultiPayment && (this.payments['Credito'] > 0 || this.paymentsAlt['Credito'] > 0);
    const isSingleDebt = !this.isMultiPayment && this.selectedMethod === 'Credito';

    if (isMixedDebt || isSingleDebt) {
      if (!this.data.customer) {
        alert('Debe seleccionar un cliente para realizar una venta a crédito.');
        return;
      }

      const currentDebt = Number(this.data.customer.curdebt || 0);
      const maxDebt = Number(this.data.customer.maxdebt || 0);

      let totalPaidDebt = 0;
      if (isSingleDebt) {
        totalPaidDebt = this.selectedCurrency === 'base' ?
          this.receivedAmount :
          (this.receivedAmountAlt * this.data.exchangeRate);
      } else {
        totalPaidDebt = (this.payments['Credito'] || 0) + ((this.paymentsAlt['Credito'] || 0) * this.data.exchangeRate);
      }

      const totalDebtBS = currentDebt + totalPaidDebt;
      const totalDebtUSD = totalDebtBS / (this.data.exchangeRate || 1.0);

      if (maxDebt > 0 && totalDebtUSD > (maxDebt + 0.01)) { // 0.01 for rounding margin
        alert(`El cliente ha excedido su límite de crédito. Límite: $ ${maxDebt}, Deuda total (en USD): $ ${totalDebtUSD.toFixed(2)}`);
        return;
      }
    }

    this.dialogRef.close(paymentData);
  }
}
