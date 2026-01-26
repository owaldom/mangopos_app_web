import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

import { DailyExpenseService } from '../../../../../core/services/daily-expense.service';
import { ExpenseService, Expense } from '../../../../../core/services/expense.service';
import { CashService } from '../../../../../core/services/cash.service';
import { TaxService, Tax } from '../../../../../core/services/tax.service';
import { MoneyInputDirective } from '../../../../../shared/directives/money-input.directive';

@Component({
  selector: 'app-daily-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MoneyInputDirective
  ],
  template: `
    <div class="form-container">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          
          <!-- Expense Type Selection -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de Gasto</mat-label>
            <mat-select formControlName="idgastos" (selectionChange)="onExpenseTypeChange($event.value)">
              <mat-option>
                <ngx-mat-select-search [formControl]="expenseFilterCtrl" placeholderLabel="Buscar gasto..."></ngx-mat-select-search>
              </mat-option>
              <mat-option *ngFor="let expense of filteredExpenses" [value]="expense.id">
                {{ expense.name }} <span class="frequency-hint">({{ expense.frequency }})</span>
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('idgastos')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>

          <!-- Date -->
          <mat-form-field appearance="outline">
            <mat-label>Fecha</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <!-- Payment Method -->
          <mat-form-field appearance="outline">
            <mat-label>Método de Pago</mat-label>
            <mat-select formControlName="payment">
              <mat-option value="cash">Efectivo</mat-option>
              <mat-option value="magcard">Tarjeta</mat-option>
              <mat-option value="check">Cheque</mat-option>
              <mat-option value="transfer">Transferencia</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Amounts Row -->
          <div class="amounts-row">
            <mat-form-field appearance="outline">
              <mat-label>Base Imponible</mat-label>
              <input matInput appMoneyInput decimalType="total" formControlName="taxbase">
              <mat-error *ngIf="form.get('taxbase')?.hasError('required')">Requerido</mat-error>
              <mat-error *ngIf="form.get('taxbase')?.hasError('min')">Debe ser mayor a 0</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Impuestos (Tasa)</mat-label>
              <mat-select formControlName="taxId">
                 <mat-option [value]="null">Sin Impuesto</mat-option>
                 <mat-option *ngFor="let t of taxes" [value]="t.id">
                   {{ t.name }} ({{ t.rate | percent }})
                 </mat-option>
              </mat-select>
              <mat-hint align="end">Monto: {{ form.get('tax')?.value | number:'1.2-2' }}</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="total-field">
              <mat-label>Total</mat-label>
              <input matInput appMoneyInput decimalType="total" formControlName="total" readonly>
            </mat-form-field>
          </div>

          <!-- Invoice Number -->
          <mat-form-field appearance="outline">
            <mat-label>Nº Factura</mat-label>
            <input matInput formControlName="numberinvoice">
            <mat-error *ngIf="form.get('numberinvoice')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>

          <!-- Notes -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notas</mat-label>
            <textarea matInput formControlName="notes" rows="2"></textarea>
          </mat-form-field>

        </div>

        <div class="actions">
          <button mat-button type="button" (click)="resetForm()">Limpiar</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading || !isCashOpened">
            Registrar Gasto
          </button>
        </div>
        
        <div *ngIf="!isCashOpened" class="cash-warning">
          <mat-icon>warning</mat-icon> La caja debe estar abierta para registrar gastos.
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .amounts-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
    }
    .full-width {
      width: 100%;
    }
    .total-field input {
      font-weight: bold;
      color: #3f51b5;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    .frequency-hint {
      color: gray;
      font-size: 0.8em;
    }
    .cash-warning {
      color: #f44336;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 10px;
      background: #ffebee;
      border-radius: 4px;
    }
    @media (max-width: 600px) {
      .amounts-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DailyExpenseFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  private fb = inject(FormBuilder);
  isCashOpened = false;

  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  taxes: Tax[] = [];
  expenseFilterCtrl = this.fb.control('');

  private dailyExpenseService = inject(DailyExpenseService);
  private expenseService = inject(ExpenseService);
  private cashService = inject(CashService);
  private taxService = inject(TaxService);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.form = this.fb.group({
      idgastos: [null, Validators.required],
      date: [new Date(), Validators.required],
      payment: ['cash', Validators.required],
      taxId: [null],
      taxbase: [null, [Validators.required, Validators.min(0.01)]],
      tax: [0],
      total: [0],
      numberinvoice: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.checkCashStatus();
    this.loadExpenses();
    this.loadTaxes();

    this.expenseFilterCtrl.valueChanges.subscribe(val => {
      this.filterExpenses(val || '');
    });

    // Listen to changes in taxbase to recalculate total
    this.form.get('taxbase')?.valueChanges.subscribe(val => {
      this.calculateTotal();
    });

    // Listen to changes in tax selection
    this.form.get('taxId')?.valueChanges.subscribe(val => {
      this.calculateTotal();
    });
  }

  async checkCashStatus() {
    this.isCashOpened = await this.cashService.checkStatus();
    if (!this.isCashOpened) {
      this.form.disable();
    }
  }

  loadExpenses() {
    this.expenseService.getAll(1, 100).subscribe(res => {
      this.expenses = res.data;
      this.filteredExpenses = this.expenses;
    });
  }

  loadTaxes() {
    this.taxService.getAll().subscribe(res => {
      this.taxes = res;
    });
  }

  filterExpenses(search: string) {
    if (!search) {
      this.filteredExpenses = this.expenses;
      return;
    }
    search = search.toLowerCase();
    this.filteredExpenses = this.expenses.filter(e => e.name.toLowerCase().includes(search));
  }

  onExpenseTypeChange(expenseId: number) {
    if (expenseId) {
      const expense = this.expenses.find(e => e.id === expenseId);
      if (expense && expense.taxcat) {
        const tax = this.taxes.find(t => t.category === expense.taxcat);
        if (tax) {
          this.form.patchValue({ taxId: tax.id });
        } else {
          this.form.patchValue({ taxId: null });
        }
      } else {
        this.form.patchValue({ taxId: null });
      }
    }
  }

  calculateTotal() {
    const taxBase = this.form.get('taxbase')?.value;
    const taxId = this.form.get('taxId')?.value;

    if (!taxBase) {
      this.form.patchValue({ tax: 0, total: 0 }, { emitEvent: false });
      return;
    }

    let taxRate = 0;
    if (taxId) {
      const tax = this.taxes.find(t => t.id === taxId);
      if (tax) {
        taxRate = tax.rate;
      }
    }

    const taxAmount = taxBase * taxRate;
    const total = taxBase + taxAmount;

    this.form.patchValue({
      tax: taxAmount,
      total: total
    }, { emitEvent: false });
  }

  onSubmit() {
    if (this.form.invalid || !this.isCashOpened) return;

    this.loading = true;
    const value = this.form.value;

    this.dailyExpenseService.create(value).subscribe({
      next: (res) => {
        this.snackBar.open('Gasto registrado exitosamente', 'Cerrar', { duration: 3000 });
        this.resetForm();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error creating daily expense', err);
        this.snackBar.open('Error al registrar el gasto', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  resetForm() {
    this.form.reset({
      idgastos: null,
      date: new Date(),
      payment: 'cash',
      taxId: null,
      taxbase: null,
      tax: 0,
      total: 0,
      numberinvoice: '',
      notes: ''
    });
    // Re-check cash status just in case
    this.checkCashStatus();
  }
}
