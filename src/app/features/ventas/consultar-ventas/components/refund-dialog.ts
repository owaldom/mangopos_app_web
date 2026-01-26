import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SalesHistoryService, Ticket, TicketLine, RefundLine } from '../../../../core/services/sales-history.service';
import { SystemDatePipe } from '../../../../shared/pipes/system-date.pipe';

interface RefundLineItem extends TicketLine {
  selected: boolean;
  refundUnits: number;
}

@Component({
  selector: 'app-refund-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    SystemDatePipe
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>assignment_return</mat-icon>
      Procesar Devolución - Ticket #{{ ticket?.ticket_number }}
    </h2>

    <mat-dialog-content class="dialog-content">
      <mat-spinner *ngIf="loading" diameter="40" class="spinner"></mat-spinner>

      <div *ngIf="!loading && ticket" class="refund-content">
        <div class="info-section">
          <p><strong>Cliente:</strong> {{ ticket.customer_name || 'Público General' }}</p>
          <p><strong>Fecha Original:</strong> {{ ticket.date | systemDate }}</p>
        </div>

        <h3>Seleccione los productos a devolver:</h3>

        <table mat-table [dataSource]="refundLines" class="refund-table">
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox 
                (change)="toggleAll($event.checked)"
                [checked]="allSelected()"
                [indeterminate]="someSelected()">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let line">
              <mat-checkbox 
                [(ngModel)]="line.selected"
                (change)="onLineSelectionChange(line)">
              </mat-checkbox>
            </td>
          </ng-container>

          <ng-container matColumnDef="product">
            <th mat-header-cell *matHeaderCellDef>Producto</th>
            <td mat-cell *matCellDef="let line">
              <div class="product-info">
                <strong>{{ line.product_name }}</strong>
                <small>{{ line.product_reference }}</small>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="original_units">
            <th mat-header-cell *matHeaderCellDef>Cant. Original</th>
            <td mat-cell *matCellDef="let line">{{ line.units }}</td>
          </ng-container>

          <ng-container matColumnDef="refund_units">
            <th mat-header-cell *matHeaderCellDef>Cant. a Devolver</th>
            <td mat-cell *matCellDef="let line">
              <mat-form-field appearance="outline" class="units-field">
                <input 
                  matInput 
                  type="number" 
                  [(ngModel)]="line.refundUnits"
                  [disabled]="!line.selected"
                  [min]="0"
                  [max]="line.units"
                  (change)="validateRefundUnits(line)">
              </mat-form-field>
            </td>
          </ng-container>

          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Precio Unit.</th>
            <td mat-cell *matCellDef="let line">{{ line.price | currency:'USD':'symbol':'1.2-2' }}</td>
          </ng-container>

          <ng-container matColumnDef="refund_total">
            <th mat-header-cell *matHeaderCellDef>Total Devolución</th>
            <td mat-cell *matCellDef="let line" class="total-cell">
              {{ calculateLineRefund(line) | currency:'USD':'symbol':'1.2-2' }}
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div class="refund-summary">
          <div class="summary-row">
            <span>Subtotal Devolución:</span>
            <strong>{{ calculateRefundSubtotal() | currency:'USD':'symbol':'1.2-2' }}</strong>
          </div>
          <div class="summary-row">
            <span>IVA:</span>
            <strong>{{ calculateRefundTax() | currency:'USD':'symbol':'1.2-2' }}</strong>
          </div>
          <div class="summary-row total-row">
            <span>TOTAL A DEVOLVER:</span>
            <strong>{{ calculateRefundTotal() | currency:'USD':'symbol':'1.2-2' }}</strong>
          </div>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Método de Devolución</mat-label>
          <mat-select [(ngModel)]="refundPaymentMethod">
            <mat-option value="CASH_REFUND">Efectivo</mat-option>
            <mat-option value="CARD">Tarjeta</mat-option>
            <mat-option value="TRANSFER">Pago Móvil</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()" [disabled]="processing">CANCELAR</button>
      <button 
        mat-raised-button 
        color="warn" 
        (click)="processRefund()" 
        [disabled]="!canProcessRefund() || processing">
        <mat-icon>assignment_return</mat-icon>
        {{ processing ? 'PROCESANDO...' : 'PROCESAR DEVOLUCIÓN' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 800px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .spinner {
      margin: 40px auto;
      display: block;
    }

    .refund-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-section {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
    }

    .info-section p {
      margin: 5px 0;
    }

    h3 {
      margin: 20px 0 10px 0;
      color: #333;
    }

    .refund-table {
      width: 100%;
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

    .units-field {
      width: 80px;
      margin-bottom: -1.25em;
    }

    .total-cell {
      font-weight: 600;
      color: #c62828;
    }

    .refund-summary {
      background: #fff3e0;
      padding: 20px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-row {
      border-top: 2px solid #ff9800;
      padding-top: 10px;
      margin-top: 5px;
      font-size: 18px;
      color: #c62828;
    }

    .full-width {
      width: 100%;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #c62828;
    }
  `]
})
export class RefundDialogComponent implements OnInit {
  private salesHistoryService = inject(SalesHistoryService);
  private dialogRef = inject(MatDialogRef<RefundDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA);

  ticket: Ticket | null = null;
  refundLines: RefundLineItem[] = [];
  loading = true;
  processing = false;
  refundPaymentMethod = 'CASH_REFUND';

  displayedColumns = ['select', 'product', 'original_units', 'refund_units', 'price', 'refund_total'];

  ngOnInit() {
    this.loadTicketDetails();
  }

  loadTicketDetails() {
    this.salesHistoryService.getTicketById(this.data.ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.refundLines = (ticket.lines || []).map(line => ({
          ...line,
          selected: false,
          refundUnits: line.units
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalles del ticket:', error);
        this.snackBar.open('Error al cargar ticket', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  toggleAll(checked: boolean) {
    this.refundLines.forEach(line => {
      line.selected = checked;
      if (!checked) {
        line.refundUnits = line.units;
      }
    });
  }

  allSelected(): boolean {
    return this.refundLines.length > 0 && this.refundLines.every(line => line.selected);
  }

  someSelected(): boolean {
    return this.refundLines.some(line => line.selected) && !this.allSelected();
  }

  onLineSelectionChange(line: RefundLineItem) {
    if (!line.selected) {
      line.refundUnits = line.units;
    }
  }

  validateRefundUnits(line: RefundLineItem) {
    if (line.refundUnits < 0) {
      line.refundUnits = 0;
    }
    if (line.refundUnits > line.units) {
      line.refundUnits = line.units;
    }
  }

  calculateLineRefund(line: RefundLineItem): number {
    if (!line.selected) return 0;
    return line.refundUnits * line.price * (1 + line.tax_rate);
  }

  calculateRefundSubtotal(): number {
    return this.refundLines
      .filter(line => line.selected)
      .reduce((sum, line) => sum + (line.refundUnits * line.price), 0);
  }

  calculateRefundTax(): number {
    return this.refundLines
      .filter(line => line.selected)
      .reduce((sum, line) => sum + (line.refundUnits * line.price * line.tax_rate), 0);
  }

  calculateRefundTotal(): number {
    return this.calculateRefundSubtotal() + this.calculateRefundTax();
  }

  canProcessRefund(): boolean {
    const hasSelectedLines = this.refundLines.some(line => line.selected && line.refundUnits > 0);
    return hasSelectedLines && !!this.refundPaymentMethod;
  }

  processRefund() {
    if (!this.canProcessRefund() || !this.ticket) return;

    const selectedLines = this.refundLines.filter(line => line.selected && line.refundUnits > 0);

    const refundData = {
      person_id: this.ticket.cashier_id,
      refund_lines: selectedLines.map(line => ({
        product_id: line.product,
        units: line.refundUnits,
        price: line.price,
        taxid: line.taxid,
        tax_rate: line.tax_rate
      })),
      refund_payment_method: this.refundPaymentMethod,
      cash_register_id: undefined,
      currency_id: this.ticket.currency_id,
      exchange_rate: this.ticket.exchange_rate
    };

    this.processing = true;

    this.salesHistoryService.processRefund(this.ticket.id, refundData).subscribe({
      next: (response) => {
        this.snackBar.open(
          `Devolución procesada exitosamente. Ticket #${response.refundTicketNumber}`,
          'Cerrar',
          { duration: 5000 }
        );
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error al procesar devolución:', error);
        this.snackBar.open(
          'Error al procesar devolución: ' + (error.error?.error || 'Error desconocido'),
          'Cerrar',
          { duration: 5000 }
        );
        this.processing = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
