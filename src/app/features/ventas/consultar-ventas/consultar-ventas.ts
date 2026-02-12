import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SharedPaginatorComponent } from '../../../shared/components/shared-paginator/shared-paginator.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SalesHistoryService, Ticket, SalesHistoryFilters } from '../../../core/services/sales-history.service';
import { PrintService } from '../../../core/services/print.service';
import { CustomerSelectorComponent } from '../sales/components/customer-selector/customer-selector';
import { Customer } from '../../../core/services/customer.service';
import { TicketDetailDialogComponent } from './components/ticket-detail-dialog';
import { RefundDialogComponent } from './components/refund-dialog';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';
import { SystemDatePipe } from '../../../shared/pipes/system-date.pipe';

@Component({
  selector: 'app-consultar-ventas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    SharedPaginatorComponent,
    MatDialogModule,
    MatSnackBarModule,
    MoneyInputDirective,
    SystemDatePipe
  ],
  template: `
    <div class="container">
      <mat-card class="main-card">
        <mat-card-header>
          <mat-card-title>Historial de Ventas</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Filtros de búsqueda -->
          <div class="filters-panel">
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>Fecha Inicio</mat-label>
                <input matInput [matDatepicker]="startPicker" [(ngModel)]="filters.startDate">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha Fin</mat-label>
                <input matInput [matDatepicker]="endPicker" [(ngModel)]="filters.endDate">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Número de Ticket</mat-label>
                <input matInput type="number" [(ngModel)]="filters.ticketNumber" placeholder="Ej: 1234">
                <mat-icon matSuffix>receipt</mat-icon>
              </mat-form-field>

              <button mat-raised-button (click)="openCustomerSelector()" class="customer-btn">
                <mat-icon>person</mat-icon>
                {{ selectedCustomer ? selectedCustomer.name : 'Seleccionar Cliente' }}
              </button>
            </div>

            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>Total Mínimo (Bs.)</mat-label>
                <input matInput type="text" [(ngModel)]="filters.minTotal" placeholder="0.00" appMoneyInput decimalType="total">
                <span matPrefix>Bs.&nbsp;</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Total Máximo (Bs.)</mat-label>
                <input matInput type="text" [(ngModel)]="filters.maxTotal" placeholder="0.00" appMoneyInput decimalType="total">
                <span matPrefix>Bs.&nbsp;</span>
              </mat-form-field>

              <button mat-raised-button color="primary" (click)="search()" [disabled]="loading">
                <mat-icon>search</mat-icon>
                BUSCAR
              </button>

              <button mat-stroked-button (click)="clearFilters()" [disabled]="loading">
                <mat-icon>clear</mat-icon>
                LIMPIAR
              </button>
            </div>
          </div>

          <!-- Tabla de resultados -->
          <div class="results-section">
            <mat-spinner *ngIf="loading" diameter="50" class="spinner"></mat-spinner>

            <div *ngIf="!loading && tickets.length === 0" class="no-results">
              <mat-icon>receipt_long</mat-icon>
              <p>No se encontraron ventas con los filtros seleccionados</p>
            </div>

            <table mat-table [dataSource]="tickets" *ngIf="!loading && tickets.length > 0" class="tickets-table">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let ticket">{{ ticket.date | systemDate }}</td>
              </ng-container>

              <ng-container matColumnDef="ticket_number">
                <th mat-header-cell *matHeaderCellDef>Ticket #</th>
                <td mat-cell *matCellDef="let ticket">{{ ticket.ticket_number }}</td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Tipo</th>
                <td mat-cell *matCellDef="let ticket">
                  <span [class]="'ticket-type type-' + ticket.tickettype">
                    {{ ticket.tickettype === 0 ? 'Venta' : (ticket.tickettype === 1 ? 'Devolución' : 'Abono') }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef>Cliente</th>
                <td mat-cell *matCellDef="let ticket">{{ ticket.customer_name || 'Público General' }}</td>
              </ng-container>

              <ng-container matColumnDef="cashier">
                <th mat-header-cell *matHeaderCellDef>Cajero</th>
                <td mat-cell *matCellDef="let ticket">{{ ticket.cashier_name }}</td>
              </ng-container>

              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let ticket" class="total-cell">
                  Bs. {{ (ticket.total * (ticket.exchange_rate || 1)) | number:'1.2-2' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let ticket">
                  <button mat-icon-button color="primary" (click)="viewTicketDetails(ticket)" matTooltip="Ver detalles">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" (click)="reprintTicket(ticket)" matTooltip="Reimprimir">
                    <mat-icon>print</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="processRefund(ticket)" 
                          *ngIf="ticket.tickettype === 0" matTooltip="Procesar devolución">
                    <mat-icon>assignment_return</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <app-shared-paginator 
              *ngIf="!loading && tickets.length > 0"
              [length]="pagination.total"
              [pageSize]="pagination.limit"
              [pageIndex]="pagination.page - 1"
              (page)="onPageChange($event)">
            </app-shared-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .main-card { padding: 20px; }
    
    .filters-panel {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .filter-row {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .filter-row:last-child {
      margin-bottom: 0;
    }
    
    .filter-row mat-form-field {
      flex: 1;
    }
    
    .customer-btn {
      height: 56px;
      min-width: 200px;
    }
    
    .results-section {
      position: relative;
      min-height: 300px;
    }
    
    .spinner {
      margin: 50px auto;
      display: block;
    }
    
    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #999;
    }
    
    .no-results mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
    }
    
    .tickets-table {
      width: 100%;
      margin-bottom: 20px;
    }
    
    .total-cell {
      font-weight: 600;
      color: #2e7d32;
    }
    
    .ticket-type {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .type-0 {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .type-1 {
      background: #ffebee;
      color: #c62828;
    }
    
    .type-2 {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    
    mat-card-header {
      margin-bottom: 20px;
    }
  `]
})
export class ConsultarVentasComponent implements OnInit {
  private salesHistoryService = inject(SalesHistoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private printService = inject(PrintService);

  tickets: Ticket[] = [];
  loading = false;
  selectedCustomer: Customer | null = null;

  filters: SalesHistoryFilters = {
    page: 1,
    limit: 50
  };

  pagination = {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  };

  displayedColumns = ['date', 'ticket_number', 'type', 'customer', 'cashier', 'total', 'actions'];

  ngOnInit() {
    this.loadDefaultData();
  }

  loadDefaultData() {
    // Cargar ventas de hoy por defecto
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.filters.startDate = today.toISOString();
    this.search();
  }

  async openCustomerSelector() {
    const dialogRef = this.dialog.open(CustomerSelectorComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedCustomer = result;
        this.filters.customerId = result.id;
      }
    });
  }

  search() {
    this.loading = true;
    this.filters.page = 1;

    // Convertir fechas a formato ISO si existen
    const searchFilters: any = { ...this.filters };
    if (searchFilters.startDate && typeof searchFilters.startDate === 'object') {
      searchFilters.startDate = (searchFilters.startDate as Date).toISOString();
    }
    if (searchFilters.endDate && typeof searchFilters.endDate === 'object') {
      searchFilters.endDate = (searchFilters.endDate as Date).toISOString();
    }

    this.salesHistoryService.getSalesHistory(searchFilters).subscribe({
      next: (response) => {
        this.tickets = response.tickets.map(t => ({
          ...t,
          date: t.date && !t.date.includes('Z') && !t.date.includes('+') ? t.date + 'Z' : t.date
        }));
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al buscar ventas:', error);
        this.snackBar.open('Error al buscar ventas', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  clearFilters() {
    this.filters = { page: 1, limit: 50 };
    this.selectedCustomer = null;
    this.tickets = [];
    this.pagination = { page: 1, limit: 50, total: 0, totalPages: 0 };
  }

  onPageChange(event: PageEvent) {
    this.filters.page = event.pageIndex + 1;
    this.filters.limit = event.pageSize;
    this.search();
  }

  viewTicketDetails(ticket: Ticket) {
    this.dialog.open(TicketDetailDialogComponent, {
      width: '800px',
      maxWidth: '95vw',

      data: { ticketId: ticket.id }
    });
  }

  reprintTicket(ticket: Ticket) {
    this.snackBar.open(`Cargando ticket #${ticket.ticket_number} para imprimir...`, 'Cerrar', { duration: 2000 });
    this.salesHistoryService.getTicketById(ticket.id).subscribe({
      next: (fullTicket) => {
        this.printService.printTicket(fullTicket);
      },
      error: (err) => {
        console.error('Error al cargar ticket para imprimir:', err);
        this.snackBar.open('Error al cargar ticket', 'Cerrar', { duration: 3000 });
      }
    });
  }

  processRefund(ticket: Ticket) {
    const dialogRef = this.dialog.open(RefundDialogComponent, {
      width: '900px',
      data: { ticketId: ticket.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Devolución procesada exitosamente', 'Cerrar', { duration: 3000 });
        this.search(); // Recargar lista
      }
    });
  }
}
