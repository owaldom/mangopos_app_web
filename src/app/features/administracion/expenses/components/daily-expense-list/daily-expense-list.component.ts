import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DailyExpenseService, DailyExpense, DailyExpenseFilters } from '../../../../../core/services/daily-expense.service';
import { ExpenseService, Expense } from '../../../../../core/services/expense.service';
import { SystemDatePipe } from '../../../../../shared/pipes/system-date.pipe';

@Component({
  selector: 'app-daily-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTooltipModule,
    SystemDatePipe
  ],
  template: `
    <div class="filter-container">
      <form [formGroup]="filterForm" class="filter-form">
        <mat-form-field appearance="outline" class="small-field">
          <mat-label>Desde</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="startDate">
          <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="small-field">
          <mat-label>Hasta</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate">
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar...</mat-label>
          <input matInput formControlName="search" placeholder="Gasto o nota">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de Gasto</mat-label>
          <mat-select formControlName="idgastos">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option *ngFor="let expense of expenses" [value]="expense.id">
              {{ expense.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="filter-actions">
          <button mat-raised-button color="primary" (click)="loadExpenses()">
            <mat-icon>search</mat-icon> Filtrar
          </button>
          <button mat-button (click)="resetFilters()">
            <mat-icon>clear</mat-icon>
          </button>
        </div>
      </form>
    </div>

    <div class="table-container mat-elevation-z2">
      <table mat-table [dataSource]="dailyExpenses">
        
        <!-- Date Column -->
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef> Fecha </th>
          <td mat-cell *matCellDef="let element"> {{element.date | systemDate }} </td>
        </ng-container>

        <!-- Expense Name Column -->
        <ng-container matColumnDef="expense_name">
          <th mat-header-cell *matHeaderCellDef> Gasto </th>
          <td mat-cell *matCellDef="let element"> {{element.expense_name}} </td>
        </ng-container>

        <!-- Notes Column -->
        <ng-container matColumnDef="notes">
          <th mat-header-cell *matHeaderCellDef> Notas </th>
          <td mat-cell *matCellDef="let element"> {{element.notes || '-'}} </td>
        </ng-container>

        <!-- Payment Column -->
        <ng-container matColumnDef="payment">
          <th mat-header-cell *matHeaderCellDef> Pago </th>
          <td mat-cell *matCellDef="let element"> {{ getPaymentLabel(element.payment) }} </td>
        </ng-container>

        <!-- Tax Base Column -->
        <ng-container matColumnDef="taxbase">
          <th mat-header-cell *matHeaderCellDef> Base </th>
          <td mat-cell *matCellDef="let element"> {{element.taxbase | number:'1.2-2'}} </td>
        </ng-container>

        <!-- Tax Column -->
        <ng-container matColumnDef="tax">
          <th mat-header-cell *matHeaderCellDef> Imp. </th>
          <td mat-cell *matCellDef="let element"> {{element.tax | number:'1.2-2'}} </td>
        </ng-container>

        <!-- Total Column -->
        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef> Total </th>
          <td mat-cell *matCellDef="let element" class="total-cell"> {{element.total | number:'1.2-2'}} </td>
        </ng-container>

        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> Acciones </th>
          <td mat-cell *matCellDef="let element">
            <button mat-icon-button color="warn" (click)="delete(element)" matTooltip="Eliminar">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <mat-paginator [length]="totalElements" [pageSize]="pageSize" [pageSizeOptions]="[10, 20, 50]"
        (page)="onPageChange($event)">
      </mat-paginator>

      <div class="totals-footer">
        <strong>Total Periodo: {{ getTotalPeriod() | number:'1.2-2' }}</strong>
      </div>
    </div>
  `,
  styles: [`
    .filter-container {
      margin-bottom: 20px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: flex-start;
    }
    .small-field {
      width: 140px;
    }
    .search-field {
      flex: 1;
      min-width: 200px;
    }
    .filter-actions {
      display: flex;
      gap: 10px;
      margin-top: 5px;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
    .total-cell {
      font-weight: bold;
    }
    .totals-footer {
      padding: 15px;
      text-align: right;
      font-size: 1.2em;
      background-color: #e0f7fa;
      margin-top: 10px;
    }
  `]
})
export class DailyExpenseListComponent implements OnInit {
  displayedColumns: string[] = ['date', 'expense_name', 'notes', 'payment', 'taxbase', 'tax', 'total', 'actions'];
  dailyExpenses: DailyExpense[] = [];
  expenses: Expense[] = [];
  totalElements = 0;
  pageSize = 20;

  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private dailyExpenseService = inject(DailyExpenseService);
  private expenseService = inject(ExpenseService);
  private snackBar = inject(MatSnackBar);

  constructor(private fb: FormBuilder) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filterForm = this.fb.group({
      startDate: [firstDay],
      endDate: [today],
      search: [''],
      idgastos: [null]
    });
  }

  ngOnInit(): void {
    this.loadExpenseTypes();
    this.loadExpenses();
  }

  loadExpenseTypes() {
    this.expenseService.getAll(1, 100).subscribe(res => {
      this.expenses = res.data;
    });
  }

  loadExpenses(page: number = 1) {
    const filters = this.filterForm.value;
    const queryFilters: DailyExpenseFilters = {
      page: page,
      limit: this.pageSize,
      search: filters.search,
      startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
      idgastos: filters.idgastos
    };

    this.dailyExpenseService.getAll(queryFilters).subscribe(res => {
      this.dailyExpenses = res.data;
      this.totalElements = res.total;
    });
  }

  onPageChange(event: any) {
    this.loadExpenses(event.pageIndex + 1);
  }

  resetFilters() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filterForm.reset({
      startDate: firstDay,
      endDate: today,
      search: '',
      idgastos: null
    });
    this.loadExpenses();
  }

  delete(expense: DailyExpense) {
    if (confirm('¿Está seguro que desea eliminar este registro de gasto?')) {
      this.dailyExpenseService.delete(expense.id).subscribe({
        next: () => {
          this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
          this.loadExpenses(this.paginator.pageIndex + 1);
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al eliminar registro', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getPaymentLabel(payment: string): string {
    const map: { [key: string]: string } = {
      'cash': 'Efectivo',
      'magcard': 'Tarjeta',
      'check': 'Cheque',
      'transfer': 'Transferencia'
    };
    return map[payment] || payment;
  }

  getTotalPeriod(): number {
    return this.dailyExpenses.reduce((acc, curr) => acc + Number(curr.total), 0);
  }
}
