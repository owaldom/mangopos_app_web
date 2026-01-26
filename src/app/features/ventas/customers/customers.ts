import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../../core/services/customer.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomerFormComponent } from './components/customer-form/customer-form';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { CxCHistoryDialogComponent } from './cx-c-history-dialog';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatPaginatorModule,
    PhoneFormatPipe
  ],
  providers: [PhoneFormatPipe],
  template: `
    <div class="container">
      <mat-card class="main-card">
        <mat-card-header>
          <mat-card-title>Gestión de Clientes</mat-card-title>
          <div class="header-actions">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar cliente...</mat-label>
              <input matInput [(ngModel)]="searchText" (keyup.enter)="loadCustomers()" placeholder="Nombre, Cédula o RIF">
              <button mat-icon-button matSuffix (click)="loadCustomers()">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>person_add</mat-icon> NUEVO CLIENTE
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          <table mat-table [dataSource]="customers" class="full-width-table">
            <ng-container matColumnDef="taxid">
              <th mat-header-cell *matHeaderCellDef> Cédula / RIF </th>
              <td mat-cell *matCellDef="let element"> {{ element.taxid }} </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Nombre / Razón Social </th>
              <td mat-cell *matCellDef="let element"> {{ element.name }} </td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef> Teléfono </th>
              <td mat-cell *matCellDef="let element"> {{ element.phone | phoneFormat }} </td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef> Email </th>
              <td mat-cell *matCellDef="let element"> {{ element.email }} </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> Acciones </th>
              <td mat-cell *matCellDef="let element">
                <button mat-icon-button color="accent" (click)="openViewDialog(element)" title="Ver Detalle">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button color="primary" (click)="openEditDialog(element)" title="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="primary" (click)="openHistoryDialog(element)" title="Ver Historial de Pagos">
                  <mat-icon>history</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator 
            [length]="totalElements"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)">
          </mat-paginator>

          <div class="empty-msg" *ngIf="customers.length === 0">
            No se encontraron clientes.
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .main-card { padding: 10px; }
    .header-actions { display: flex; align-items: center; gap: 20px; margin-left: auto; }
    .search-field { width: 300px; margin-bottom: -1.25em; }
    .full-width-table { width: 100%; margin-top: 20px; }
    .empty-msg { padding: 40px; text-align: center; color: #888; font-style: italic; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  `]
})
export class CustomersComponent implements OnInit {
  private customerService = inject(CustomerService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  customers: Customer[] = [];
  searchText: string = '';
  displayedColumns: string[] = ['taxid', 'name', 'phone', 'email', 'actions'];

  totalElements = 0;
  pageSize = 20;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers(page: number = 1) {
    this.customerService.getAll(page, this.pageSize, this.searchText).subscribe(res => {
      this.customers = res.data;
      this.totalElements = res.total;
    });
  }

  onPageChange(event: any) {
    this.loadCustomers(event.pageIndex + 1);
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      width: '600px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCustomers();
        this.snackBar.open('Cliente registrado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openEditDialog(customer: Customer) {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { customer }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCustomers();
        this.snackBar.open('Cliente actualizado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openViewDialog(customer: Customer) {
    this.dialog.open(CustomerFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { customer, viewOnly: true }
    });
  }

  openHistoryDialog(customer: Customer) {
    this.dialog.open(CxCHistoryDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { customer }
    });
  }
}
