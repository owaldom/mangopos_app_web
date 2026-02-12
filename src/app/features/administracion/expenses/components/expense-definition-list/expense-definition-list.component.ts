import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { SharedPaginatorComponent } from '../../../../../shared/components/shared-paginator/shared-paginator.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import { ExpenseService, Expense } from '../../../../../core/services/expense.service';
import { ExpenseDefinitionDialogComponent } from '../expense-definition-dialog/expense-definition-dialog.component';

@Component({
  selector: 'app-expense-definition-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    SharedPaginatorComponent,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  template: `
    <div class="actions-container">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Buscar gasto</mat-label>
        <input matInput [(ngModel)]="searchText" (keyup.enter)="loadExpenses()" placeholder="Nombre...">
        <button mat-icon-button matSuffix (click)="loadExpenses()" [attr.aria-label]="'Buscar'">
          <mat-icon>search</mat-icon>
        </button>
      </mat-form-field>

      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon> Nuevo Tipo de Gasto
      </button>
    </div>

    <div class="table-container mat-elevation-z2">
      <table mat-table [dataSource]="expenses">
        
        <!-- Name Column -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef> Nombre </th>
          <td mat-cell *matCellDef="let element"> {{element.name}} </td>
        </ng-container>

        <!-- Frequency Column -->
        <ng-container matColumnDef="frequency">
          <th mat-header-cell *matHeaderCellDef> Frecuencia </th>
          <td mat-cell *matCellDef="let element"> 
            <mat-chip-option [selectable]="false">{{element.frequency}}</mat-chip-option>
          </td>
        </ng-container>

        <!-- Supplier Column -->
        <ng-container matColumnDef="supplier">
          <th mat-header-cell *matHeaderCellDef> Proveedor </th>
          <td mat-cell *matCellDef="let element"> {{element.supplier_name || '-'}} </td>
        </ng-container>

        <!-- Tax Category Column -->
        <ng-container matColumnDef="taxcat">
          <th mat-header-cell *matHeaderCellDef> Impuesto </th>
          <td mat-cell *matCellDef="let element"> {{element.taxcat_name || '-'}} </td>
        </ng-container>

        <!-- Status Column -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef> Estado </th>
          <td mat-cell *matCellDef="let element">
            <span [class.active-status]="element.visible" [class.inactive-status]="!element.visible">
              {{element.visible ? 'Activo' : 'Inactivo'}}
            </span>
          </td>
        </ng-container>

        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> Acciones </th>
          <td mat-cell *matCellDef="let element">
            <button mat-icon-button color="primary" (click)="openDialog(element)" matTooltip="Editar">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="delete(element)" matTooltip="Eliminar">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <app-shared-paginator [length]="totalElements" [pageSize]="pageSize" 
        (page)="onPageChange($event)">
      </app-shared-paginator>
    </div>
  `,
  styles: [`
    .actions-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .search-field {
      width: 300px;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
    .active-status {
      color: green;
      font-weight: bold;
    }
    .inactive-status {
      color: gray;
    }
  `]
})
export class ExpenseDefinitionListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'frequency', 'supplier', 'taxcat', 'status', 'actions'];
  expenses: Expense[] = [];
  totalElements = 0;
  pageSize = 50;
  searchText = '';


  private expenseService = inject(ExpenseService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(page: number = 1) {
    this.expenseService.getAll(page, this.pageSize, this.searchText).subscribe(res => {
      this.expenses = res.data;
      this.totalElements = res.total;
    });
  }

  onPageChange(event: any) {
    this.loadExpenses(event.pageIndex + 1);
  }

  openDialog(expense?: Expense) {
    const dialogRef = this.dialog.open(ExpenseDefinitionDialogComponent, {
      width: '500px',
      data: expense || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExpenses();
        this.snackBar.open(expense ? 'Gasto actualizado' : 'Gasto creado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  delete(expense: Expense) {
    if (confirm(`¿Está seguro que desea eliminar el tipo de gasto "${expense.name}"?`)) {
      this.expenseService.delete(expense.id).subscribe({
        next: () => {
          this.snackBar.open('Gasto eliminado', 'Cerrar', { duration: 3000 });
          this.loadExpenses();
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al eliminar (puede tener registros asociados)', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
