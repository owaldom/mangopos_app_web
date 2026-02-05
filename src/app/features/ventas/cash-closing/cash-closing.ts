import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CashService, CashSession } from '../../../core/services/cash.service';
import { SettingsService } from '../../../core/services/settings.service';
import { PrintService } from '../../../core/services/print.service';
import { SystemDatePipe } from '../../../shared/pipes/system-date.pipe';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';

@Component({
  selector: 'app-cash-closing',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatSnackBarModule,
    SystemDatePipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MoneyInputDirective
  ],
  template: `
    <div class="container" *ngIf="session">
      <mat-card class="closing-card">
        <mat-card-header>
          <mat-card-title>Cierre de Caja</mat-card-title>
          <mat-card-subtitle>Resumen de sesión: {{ session.money }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="session-info">
            <div class="info-row">
              <span>Equipo:</span> <strong>{{ session.host }}</strong>
            </div>
            <div class="info-row">
              <span>Secuencia:</span> <strong>#{{ session.hostsequence }}</strong>
            </div>
            <div class="info-row">
              <span>Apertura:</span> <strong>{{ session.datestart | systemDate }}</strong>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="summary-section" *ngIf="summary">
            <h3>Métricas de Ventas por Moneda</h3>
            
            <div *ngFor="let m of summary.salesByCurrency" class="currency-sales-block">
                <h4 class="currency-header">
                    <mat-icon>{{ m.currency_id === 1 ? 'payments' : 'monetization_on' }}</mat-icon>
                    Ventas en {{ m.currency_id === 1 ? 'Bolívares (Bs.)' : 'Dólares (USD)' }}
                </h4>
                <div class="metrics-grid">
                  <div class="metric">
                    <span class="label">Tickets</span>
                    <span class="value">{{ m.ticket_count }}</span>
                  </div>
                  <div class="metric">
                    <span class="label">Subtotal</span>
                    <span class="value">{{ m.subtotal | currency: (m.currency_id === 1 ? 'VES' : 'USD'): (m.currency_id === 1 ? 'Bs. ' : '$ '): settingsService.getDecimalFormat('total') }}</span>
                  </div>
                  <div class="metric">
                    <span class="label">Impuestos</span>
                    <span class="value">{{ m.taxes | currency: (m.currency_id === 1 ? 'VES' : 'USD'): (m.currency_id === 1 ? 'Bs. ' : '$ '): settingsService.getDecimalFormat('total') }}</span>
                  </div>
                  <div class="metric highlight">
                    <span class="label">Total en {{ m.currency_id === 1 ? 'Bs.' : 'USD' }}</span>
                    <span class="value">{{ m.total | currency: (m.currency_id === 1 ? 'VES' : 'USD'): (m.currency_id === 1 ? 'Bs. ' : '$ '): settingsService.getDecimalFormat('total') }}</span>
                  </div>
                </div>
            </div>

            <div class="total-accumulation-summary">
                <div class="info-row highlight-row">
                    <span>VENTAS TOTALES (RESUMEN EN BS.):</span>
                    <strong>{{ summary.sales.total | currency:'VES':'Bs. ':settingsService.getDecimalFormat('total') }}</strong>
                </div>
            </div>

            <mat-divider style="margin: 20px 0;"></mat-divider>

            <h3>Métodos de Pago (Ventas)</h3>
            <table mat-table [dataSource]="summary.payments" class="summary-table">
              <ng-container matColumnDef="method">
                <th mat-header-cell *matHeaderCellDef> Método </th>
                <td mat-cell *matCellDef="let element"> {{ getMethodLabel(element.payment) }} </td>
              </ng-container>

              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef> Total </th>
                <td mat-cell *matCellDef="let element"> 
                  {{ element.total | currency: (element.currency_id === 1 ? 'VES' : 'USD'): (element.currency_id === 1 ? 'Bs. ' : '$ '): (element.currency_id === 1 ? settingsService.getDecimalFormat('total') : settingsService.getDecimalFormat('price')) }}
                  <span *ngIf="element.currency_id === 2" class="conversion-text">
                    ({{ element.total_base | currency:'VES':'Bs. ':settingsService.getDecimalFormat('total') }})
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div class="empty-msg" *ngIf="summary.payments.length === 0">
              No se registraron ventas en esta sesión.
            </div>

            <mat-divider style="margin: 10px 0;"></mat-divider>

            <!-- New Section: CxC Payments -->
            <h3>Cobros de Deudas (CxC)</h3>
            <table mat-table [dataSource]="summary.cxcPayments" class="summary-table" *ngIf="summary.cxcPayments && summary.cxcPayments.length > 0">
              <ng-container matColumnDef="method">
                <th mat-header-cell *matHeaderCellDef> Método </th>
                <td mat-cell *matCellDef="let element"> {{ getMethodLabel(element.payment) }} </td>
              </ng-container>

              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef> Total </th>
                <td mat-cell *matCellDef="let element"> 
                  {{ element.total | currency: (element.currency_id === 1 ? 'VES' : 'USD'): (element.currency_id === 1 ? 'Bs. ' : '$ '): (element.currency_id === 1 ? settingsService.getDecimalFormat('total') : settingsService.getDecimalFormat('price')) }}
                  <span *ngIf="element.currency_id === 2" class="conversion-text">
                    ({{ element.total_base | currency:'VES':'Bs. ':settingsService.getDecimalFormat('total') }})
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div class="empty-msg" *ngIf="!summary.cxcPayments || summary.cxcPayments.length === 0">
              No se registraron cobros de deudas en esta sesión.
            </div>
            
            <mat-divider style="margin: 10px 0;"></mat-divider>

            <!-- Movimientos de Caja -->
            <h3>Movimientos de Caja</h3>
            <table mat-table [dataSource]="summary.movements" class="summary-table" *ngIf="summary.movements && summary.movements.length > 0">
                <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef> Tipo </th>
                    <td mat-cell *matCellDef="let element"> 
                        <span [style.color]="element.movement_type === 'IN' ? 'green' : 'red'">
                            {{ element.movement_type === 'IN' ? 'Entrada' : 'Salida' }}
                        </span>
                    </td>
                </ng-container>

                <ng-container matColumnDef="total">
                    <th mat-header-cell *matHeaderCellDef> Total </th>
                    <td mat-cell *matCellDef="let element"> 
                         {{ element.symbol }} {{ element.total | number:settingsService.getDecimalFormat('total') }}
                    </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['type', 'total']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['type', 'total'];"></tr>
            </table>
            
            <div class="empty-msg" *ngIf="!summary.movements || summary.movements.length === 0">
                No hay movimientos de caja registrados.
            </div>

            <mat-divider style="margin: 20px 0;"></mat-divider>

            <!-- Dinero Esperado (Acumulado) -->
            <h3 class="total-expected-header">ESTIMADO DE DINERO EN CAJA (ACUMULADO)</h3>
            <div class="metrics-grid">
                <div class="metric highlight-green" *ngFor="let cash of getExpectedCash()">
                    <span class="label">{{ cash.label }}</span>
                    <span class="value">{{ cash.symbol }} {{ cash.amount | number:settingsService.getDecimalFormat('total') }}</span>
                </div>
            </div>

            <mat-divider style="margin: 20px 0;"></mat-divider>

            <!-- Conteo Físico -->
            <div class="physical-count-section">
                <h3 class="physical-header">CONTEO FÍSICO (MANUAL)</h3>
                <p class="physical-hint">Ingrese los montos reales contados en caja para validar el cierre.</p>
                
                <div class="physical-grid">
                    <div class="physical-field">
                        <mat-form-field appearance="outline" class="full-width">
                            <mat-label>Efectivo en Bs.</mat-label>
                            <input matInput type="text" [(ngModel)]="countedAmounts.cash_ves" appMoneyInput decimalType="total" placeholder="0.00">
                            <span matPrefix>Bs. &nbsp;</span>
                        </mat-form-field>
                    </div>
                    <div class="physical-field">
                        <mat-form-field appearance="outline" class="full-width">
                            <mat-label>Efectivo en USD ($)</mat-label>
                            <input matInput type="text" [(ngModel)]="countedAmounts.cash_usd" appMoneyInput decimalType="total" placeholder="0.00">
                            <span matPrefix>$ &nbsp;</span>
                        </mat-form-field>
                    </div>
                    <div class="physical-field">
                        <mat-form-field appearance="outline" class="full-width">
                            <mat-label>Transferencia (Bs.)</mat-label>
                            <input matInput type="text" [(ngModel)]="countedAmounts.transfer_ves" appMoneyInput decimalType="total" placeholder="0.00">
                            <span matPrefix>Bs. &nbsp;</span>
                        </mat-form-field>
                    </div>
                    <div class="physical-field">
                        <mat-form-field appearance="outline" class="full-width">
                            <mat-label>Pago Móvil (Bs.)</mat-label>
                            <input matInput type="text" [(ngModel)]="countedAmounts.pagomovil_ves" appMoneyInput decimalType="total" placeholder="0.00">
                            <span matPrefix>Bs. &nbsp;</span>
                        </mat-form-field>
                    </div>
                    <div class="physical-field">
                        <mat-form-field appearance="outline" class="full-width">
                            <mat-label>Tarjeta (Bs.)</mat-label>
                            <input matInput type="text" [(ngModel)]="countedAmounts.card_ves" appMoneyInput decimalType="total" placeholder="0.00">
                            <span matPrefix>Bs. &nbsp;</span>
                        </mat-form-field>
                    </div>
                    <div class="physical-field">
                        <mat-form-field appearance="outline" class="full-width">
                            <mat-label>Crédito (Bs.)</mat-label>
                            <input matInput type="text" [(ngModel)]="countedAmounts.debt_ves" appMoneyInput decimalType="total" placeholder="0.00">
                            <span matPrefix>Bs. &nbsp;</span>
                        </mat-form-field>
                    </div>
                </div>
            </div>

          </div>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button (click)="goBack()">VOLVER</button>
          <button mat-raised-button color="primary" (click)="printClosing()" [disabled]="!summary">
            <mat-icon>print</mat-icon> IMPRIMIR RESUMEN
          </button>
          <button mat-raised-button color="warn" (click)="onCloseSession()" [disabled]="closing">
            {{ closing ? 'CERRANDO...' : 'FINALIZAR Y CERRAR CAJA' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>

    <div class="no-session" *ngIf="!session && !loading">
      <mat-icon color="warn">lock</mat-icon>
      <h2>No hay una sesión de caja abierta actualmente.</h2>
      <button mat-raised-button color="primary" (click)="goBack()">VOLVER AL MENU</button>
    </div>
  `,
  styles: [`
    .container { padding: 40px; display: flex; justify-content: center; }
    .closing-card { width: 100%; max-width: 600px; }
    .session-info { padding: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .summary-section { padding-top: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
    .metric { display: flex; flex-direction: column; padding: 10px; background: #f5f5f5; border-radius: 4px; }
    .metric .label { font-size: 0.8rem; color: #666; text-transform: uppercase; }
    .metric .value { font-size: 1.2rem; font-weight: bold; }
    .metric.highlight { background: #e3f2fd; border: 1px solid #bbdefb; }
    .metric.highlight-green { background: #e8f5e9; border: 1px solid #c8e6c9; }
    .summary-table { width: 100%; margin-bottom: 20px; }
    .empty-msg { padding: 40px; text-align: center; color: #888; font-style: italic; }
    .no-session { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh; gap: 20px; }
    .no-session mat-icon { font-size: 80px; width: 80px; height: 80px; }
    .currency-header { display: flex; align-items: center; gap: 10px; color: #1976d2; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .currency-header mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .highlight-row { background: #fff9c4; padding: 10px; border-radius: 4px; display: flex; justify-content: space-between; border: 1px dashed #fbc02d; margin: 15px 0; }
    .total-expected-header { background: #2e7d32; color: white; padding: 8px 15px; border-radius: 4px; font-size: 0.9rem; letter-spacing: 1px; }
    .currency-sales-block { margin-bottom: 30px; }
    .conversion-text { font-size: 0.85rem; color: #666; margin-left: 8px; font-weight: normal; }
    .physical-count-section { margin-top: 20px; padding: 20px; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 8px; }
    .physical-header { margin: 0 0 10px 0; color: #856404; font-weight: bold; letter-spacing: 1px; }
    .physical-hint { font-size: 0.85rem; color: #856404; margin-bottom: 20px; }
    .physical-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .full-width { width: 100%; }
    @media (max-width: 600px) {
        .physical-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CashClosingComponent implements OnInit {
  public cashService = inject(CashService);
  public settingsService = inject(SettingsService);
  private printService = inject(PrintService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  session: any | null = null;
  summary: any = null;
  displayedColumns: string[] = ['method', 'total'];
  loading = true;
  closing = false;

  countedAmounts = {
    cash_ves: 0,
    cash_usd: 0,
    transfer_ves: 0,
    pagomovil_ves: 0,
    card_ves: 0,
    debt_ves: 0
  };

  ngOnInit(): void {
    this.cashService.currentSession$.subscribe((session: any | null) => {
      this.session = session;
      if (session) {
        this.loadSummary(session.money);
      }
      this.loading = false;
    });
  }

  loadSummary(moneyId: string) {
    this.cashService.getSummary(moneyId).subscribe((res: any) => {
      this.summary = res;
      if (this.summary) {
        this.summary.payments = this.groupDataByLabel(this.summary.payments);
        this.summary.cxcPayments = this.groupDataByLabel(this.summary.cxcPayments);
      }
    });
  }

  groupDataByLabel(data: any[]): any[] {
    if (!data) return [];
    const grouped = new Map<string, any>();
    data.forEach(item => {
      const label = this.getMethodLabel(item.payment);
      const key = `${label}_${item.currency_id}`;
      if (grouped.has(key)) {
        const existing = grouped.get(key);
        existing.total = parseFloat(existing.total) + parseFloat(item.total);
        existing.total_base = parseFloat(existing.total_base || 0) + parseFloat(item.total_base || 0);
      } else {
        grouped.set(key, { ...item, payment: label });
      }
    });
    return Array.from(grouped.values());
  }

  getMethodLabel(method: string): string {
    const labels: any = {
      'cash': 'Efectivo',
      'cash_money': 'Efectivo',
      'CASH_MONEY': 'Efectivo',
      'card': 'Tarjeta',
      'paper': 'Pago Móvil',
      'PagoMovil': 'Pago Móvil',
      'transfer': 'Transferencia',
      'transferencia': 'Transferencia',
      'Vale': 'Pago Móvil',
      'vale': 'Pago Móvil',
      'mixed': 'Mixto / Otros',
      'debt': 'Crédito',
      'Credito': 'Crédito'
    };
    return labels[method] || labels[method?.toLowerCase()] || method;
  }

  getExpectedCash(): any[] {
    if (!this.summary) return [];

    const totals = new Map<string, { amount: number, symbol: string, label: string }>();

    // Inicializar campos requeridos en cero
    const required = [
      { key: 'Efectivo_1', label: 'Efectivo en Bs.', symbol: 'Bs. ' },
      { key: 'Efectivo_2', label: 'Efectivo en USD', symbol: '$ ' },
      { key: 'Transferencia_1', label: 'Transferencia en Bs.', symbol: 'Bs. ' },
      { key: 'Pago Móvil_1', label: 'Pago Móvil en Bs.', symbol: 'Bs. ' },
      { key: 'Tarjeta_1', label: 'Tarjeta en Bs.', symbol: 'Bs. ' },
      { key: 'Crédito_1', label: 'Crédito en Bs.', symbol: 'Bs. ' }
    ];
    required.forEach(r => totals.set(r.key, { amount: 0, symbol: r.symbol, label: r.label }));

    // Helper to add amounts to totals map
    const addPayment = (p: any) => {
      const methodLabel = this.getMethodLabel(p.payment);
      const key = `${methodLabel}_${p.currency_id}`;
      const current = totals.get(key) || {
        amount: 0,
        symbol: p.currency_id === 1 ? 'Bs. ' : '$ ',
        label: `${methodLabel} en ${p.currency_id === 1 ? 'Bs.' : 'USD'}`
      };
      current.amount += parseFloat(p.total);
      totals.set(key, current);
    };

    // 1. Add All Payments (sales)
    this.summary.payments.forEach(addPayment);

    // 1b. Add All Payments (CxC)
    if (this.summary.cxcPayments) {
      this.summary.cxcPayments.forEach(addPayment);
    }

    // 1c. Subtract Cash Payments (Purchases & CxP) - Mainted for Cash only as requested or generally for cash/out movements
    const subtractCash = (p: any) => {
      const methodLabel = this.getMethodLabel(p.payment);
      if (p.payment === 'cash' || methodLabel === 'Efectivo') {
        const key = `Efectivo_${p.currency_id}`;
        const current = totals.get(key) || {
          amount: 0,
          symbol: p.currency_id === 1 ? 'Bs. ' : '$ ',
          label: `Efectivo en ${p.currency_id === 1 ? 'Bs.' : 'USD'}`
        };
        current.amount -= parseFloat(p.total);
        totals.set(key, current);
      }
    };

    if (this.summary.purchasePayments) {
      this.summary.purchasePayments.forEach(subtractCash);
    }

    // 2. Add/Subtract Movements (Usually cash movements)
    if (this.summary.movements) {
      this.summary.movements.forEach((m: any) => {
        const key = `Efectivo_${m.currency_id}`; // Movements are assumed to be cash
        const current = totals.get(key) || {
          amount: 0,
          symbol: m.currency_id === 1 ? 'Bs. ' : '$ ',
          label: `Efectivo en ${m.currency_id === 1 ? 'Bs.' : 'USD'}`
        };
        const amount = parseFloat(m.total);
        if (m.movement_type === 'IN') {
          current.amount += amount;
        } else {
          current.amount -= amount;
        }
        totals.set(key, current);
      });
    }

    return Array.from(totals.values()).sort((a, b) => {
      const order = [
        'Efectivo en Bs.',
        'Efectivo en USD',
        'Pago Móvil en Bs.',
        'Tarjeta en Bs.',
        'Crédito en Bs.'
      ];

      const indexA = order.indexOf(a.label);
      const indexB = order.indexOf(b.label);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return a.label.localeCompare(b.label);
    });
  }

  async onCloseSession() {
    const expected = this.getExpectedCash();
    const findExpected = (label: string) => expected.find(e => e.label === label)?.amount || 0;

    const diffs = [
      { name: 'Efectivo en Bs.', diff: Math.abs(Number(this.countedAmounts.cash_ves) - findExpected('Efectivo en Bs.')) },
      { name: 'Efectivo en USD', diff: Math.abs(Number(this.countedAmounts.cash_usd) - findExpected('Efectivo en USD')) },
      { name: 'Transferencia en Bs.', diff: Math.abs(Number(this.countedAmounts.transfer_ves) - findExpected('Transferencia en Bs.')) },
      { name: 'Pago Móvil en Bs.', diff: Math.abs(Number(this.countedAmounts.pagomovil_ves) - findExpected('Pago Móvil en Bs.')) },
      { name: 'Tarjeta en Bs.', diff: Math.abs(Number(this.countedAmounts.card_ves) - findExpected('Tarjeta en Bs.')) },
      { name: 'Crédito en Bs.', diff: Math.abs(Number(this.countedAmounts.debt_ves) - findExpected('Crédito en Bs.')) }
    ].filter(d => d.diff > 0.01);

    if (diffs.length > 0) {
      const msg = `Existen diferencias en el conteo: ${diffs.map(d => d.name).join(', ')}. Por favor verifique los montos ingresados.`;
      this.snackBar.open(msg, 'OK', { duration: 7000, verticalPosition: 'top' });
      return;
    }

    if (!confirm('¿Está seguro de que desea cerrar la caja? Los montos coinciden con el acumulado.')) return;

    this.closing = true;
    try {
      await this.printClosing();
      await this.cashService.closeCash();
      this.snackBar.open('Caja cerrada exitosamente', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.snackBar.open('Error al cerrar caja', 'Cerrar', { duration: 5000 });
    } finally {
      this.closing = false;
    }
  }

  async printClosing() {
    if (this.session && this.summary) {
      await this.printService.printCashClosing(this.session, this.summary, this.getExpectedCash());
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
