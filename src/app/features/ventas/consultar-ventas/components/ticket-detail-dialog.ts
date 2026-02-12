import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { SalesHistoryService, Ticket, TaxSummary } from '../../../../core/services/sales-history.service';
import { PrintService } from '../../../../core/services/print.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { SystemDatePipe } from '../../../../shared/pipes/system-date.pipe';

@Component({
  selector: 'app-ticket-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCardModule,
    SystemDatePipe
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>receipt</mat-icon>
      Detalles del Ticket #{{ ticket?.ticket_number }}
    </h2>

    <mat-dialog-content class="dialog-content">
      <mat-spinner *ngIf="loading" diameter="40" class="spinner"></mat-spinner>

      <div *ngIf="!loading && ticket" class="ticket-details">
        <!-- Información del ticket -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Información General</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <strong>Fecha:</strong>
                <span>{{ ticket.date | systemDate }}</span>
              </div>
              <div class="info-item">
                <strong>Tipo:</strong>
                <span [class]="'ticket-type type-' + ticket.tickettype">
                  {{ ticket.tickettype === 0 ? 'Venta' : 'Devolución' }}
                </span>
              </div>
              <div class="info-item">
                <strong>Cliente:</strong>
                <span>{{ ticket.customer_name || 'Público General' }}</span>
              </div>
              <div class="info-item" *ngIf="ticket.customer_taxid">
                <strong>Cédula/RIF:</strong>
                <span>{{ ticket.customer_taxid }}</span>
              </div>
              <div class="info-item">
                <strong>Cajero:</strong>
                <span>{{ ticket.cashier_name }}</span>
              </div>
              <div class="info-item">
                <strong>Estado:</strong>
                <span>{{ ticket.status === 0 ? 'Completado' : 'Pendiente' }}</span>
              </div>
              <div class="info-item" *ngIf="ticket.notes" style="grid-column: span 2;">
                <strong>Notas:</strong>
                <span class="notes-box">{{ ticket.notes }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Líneas del ticket -->
        <mat-card class="lines-card">
          <mat-card-header>
            <mat-card-title>Productos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="ticket.lines || []" class="lines-table">
              <ng-container matColumnDef="product">
                <th mat-header-cell *matHeaderCellDef>Producto</th>
                <td mat-cell *matCellDef="let line">
                  <div class="product-info">
                    <strong>{{ line.product_name }}</strong>
                    <small>{{ line.product_reference }}</small>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="units">
                <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                <td mat-cell *matCellDef="let line">{{ line.units | number:quantityFormat }}</td>
              </ng-container>

              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef style="text-align: right;">Precio Unit.</th>
                <td mat-cell *matCellDef="let line" style="text-align: right;">Bs. {{ (line.price * (ticket.exchange_rate || 1)) | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="tax">
                <th mat-header-cell *matHeaderCellDef style="text-align: right;">IVA</th>
                <td mat-cell *matCellDef="let line" style="text-align: right;">Bs. {{ (line.tax_amount * (ticket.exchange_rate || 1)) | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef style="text-align: right;">Total</th>
                <td mat-cell *matCellDef="let line" class="total-cell" style="text-align: right;">
                  Bs. {{ (line.total * (ticket.exchange_rate || 1)) | number:'1.2-2' }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Resumen -->
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title>Resumen</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-grid">
              <div class="summary-row">
                <span>Subtotal:</span>
                <strong>Bs. {{ (calculateSubtotal() * (ticket.exchange_rate || 1)) | number:'1.2-2' }}</strong>
              </div>
              <div class="summary-row" *ngFor="let tax of ticket.taxes">
                <span>IVA ({{ (tax.percentage * 100).toFixed(0) }}%):</span>
                <strong>Bs. {{ (tax.amount * (ticket.exchange_rate || 1)) | number:'1.2-2' }}</strong>
              </div>
              <!-- IGTF Row -->
              <div class="summary-row" *ngIf="(ticket.igtf_amount || 0) > 0">
                <span>I.G.T.F. (3%):</span>
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                    <small *ngIf="ticket.igtf_amount_alt" style="color: #666;">$ {{ ticket.igtf_amount_alt | number:'1.2-2' }}</small>
                    <strong>Bs. {{ ((ticket.igtf_amount || 0) * (ticket.exchange_rate || 1)) | number:'1.2-2' }}</strong>
                </div>
              </div>
              <div class="summary-row total-row">
                <span>TOTAL:</span>
                <strong>Bs. {{ (calculateTotal() * (ticket.exchange_rate || 1)) | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="payments-section">
              <h4>Métodos de Pago</h4>
              <div class="payment-item" *ngFor="let payment of ticket.payments">
                <div class="payment-main-info">
                  <span>{{ getPaymentMethodName(payment.payment) }}</span>
                  <strong>Bs. {{ (payment.amount_base_currency || (payment.total * (ticket.exchange_rate || 1))) | number:'1.2-2' }}</strong>
                </div>
                
                <!-- Extra Details for Card/Transfer -->
                <div class="payment-extra-details" *ngIf="payment.reference || payment.bank">
                    <small *ngIf="payment.bank">Banco: {{ payment.bank }}</small>
                    <small *ngIf="payment.reference">Ref: {{ payment.reference }}</small>
                    <small *ngIf="payment.cedula">C.I/RIF: {{ payment.cedula }}</small>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">CERRAR</button>
      <button mat-raised-button color="accent" (click)="reprint()">
        <mat-icon>print</mat-icon>
        REIMPRIMIR
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .spinner {
      margin: 40px auto;
      display: block;
    }

    .ticket-details {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-card, .lines-card, .summary-card {
      margin: 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .info-item strong {
      color: #666;
      font-size: 12px;
    }

    .ticket-type {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }

    .type-0 {
      background: #e3f2fd;
      color: #1976d2;
    }

    .type-1 {
      background: #ffebee;
      color: #c62828;
    }

    .lines-table {
      width: 100%;
      margin-top: 10px;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .product-info small {
      color: #999;
      font-size: 11px;
    }

    .total-cell {
      font-weight: 600;
      color: #2e7d32;
    }

    .summary-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-row {
      border-top: 2px solid #ddd;
      padding-top: 10px;
      margin-top: 5px;
      font-size: 18px;
      color: #2e7d32;
    }

    .payments-section {
      margin-top: 20px;
    }

    .payments-section h4 {
      margin-bottom: 10px;
      color: #666;
    }

    .payment-item {
      display: flex;
      flex-direction: column;
      padding: 8px 15px;
      background: #f9f9f9;
      border-radius: 4px;
      margin-bottom: 5px;
    }

    .payment-main-info {
        display: flex;
        justify-content: space-between;
        width: 100%;
    }

    .payment-extra-details {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 4px;
        font-size: 11px;
        color: #666;
        padding-top: 4px;
        border-top: 1px dashed #e0e0e0;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .notes-box {
      background: #fff9c4;
      padding: 10px;
      border-radius: 4px;
      border-left: 4px solid #fbc02d;
      font-style: italic;
      margin-top: 5px;
    }
  `]
})
export class TicketDetailDialogComponent implements OnInit {
  private salesHistoryService = inject(SalesHistoryService);
  private dialogRef = inject(MatDialogRef<TicketDetailDialogComponent>);
  private printService = inject(PrintService);
  data = inject(MAT_DIALOG_DATA);
  private settingsService = inject(SettingsService); // Added
  private snackBar = inject(MatSnackBar); // Added

  ticket: Ticket | null = null;
  loading = true;
  lineColumns = ['product', 'units', 'price', 'tax', 'total'];
  isPrinting = false; // Added
  quantityFormat = '1.3-3'; // Added

  constructor() { // Modified to use constructor for settingsService
    this.quantityFormat = this.settingsService.getDecimalFormat('quantity');
  }

  ngOnInit() {
    this.loadTicketDetails();
  }

  loadTicketDetails() {
    this.salesHistoryService.getTicketById(this.data.ticketId).subscribe({
      next: (ticket) => {
        if (ticket && ticket.date && !ticket.date.includes('Z') && !ticket.date.includes('+')) {
          ticket.date += 'Z';
        }
        this.ticket = ticket;
        console.log('Ticket details loaded:', ticket);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalles del ticket:', error);
        this.loading = false;
      }
    });
  }

  calculateSubtotal(): number {
    if (!this.ticket?.lines) return 0;
    return this.ticket.lines.reduce((sum, line) => sum + line.subtotal, 0);
  }

  calculateTotal(): number {
    if (!this.ticket?.lines) return 0;
    return this.ticket.lines.reduce((sum, line) => sum + line.total, 0);
  }

  getPaymentMethodName(method: string): string {
    const methods: { [key: string]: string } = {
      'CASH_MONEY': 'Efectivo',
      'cash_money': 'Efectivo',
      'cash': 'Efectivo',
      'CARD': 'Tarjeta',
      'card': 'Tarjeta',
      'TRANSFER': 'Transferencia',
      'transfer': 'Transferencia',
      'CASH_REFUND': 'Devolución',
      'cash_refund': 'Devolución',
      'paper': 'Pago Móvil',
      'PAPER': 'Pago Móvil',
      'PagoMovil': 'Pago Móvil',
      'debt': 'Crédito',
      'Credito': 'Crédito'
    };
    return methods[method] || methods[method?.toUpperCase()] || method;
  }

  reprint() {
    if (this.ticket) {
      this.printService.printTicket(this.ticket);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
