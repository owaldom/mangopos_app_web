import { Component, inject, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { SupplierService, Supplier } from '../../../core/services/supplier.service';
import { SettingsService } from '../../../core/services/settings.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PurchaseService } from '../../../core/services/purchase.service';
import { CashService } from '../../../core/services/cash.service';
import { SalesService } from '../../../core/services/sales.service';
import { CxPPaymentDialogComponent } from './cxp-payment-dialog.component';
import { CxPHistoryDialogComponent } from './cxp-history-dialog.component';
import { SupplierDialogComponent } from './supplier-dialog/supplier-dialog.component';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-cxp-proveedores',
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
    MatTooltipModule,
    MatPaginatorModule,
    PhoneFormatPipe
  ],
  providers: [DecimalPipe, DatePipe, PhoneFormatPipe],
  template: `
    <div class="container">
      <mat-card class="main-card">
        <mat-card-header>
          <mat-card-title>CxP Proveedores (Deudas)</mat-card-title>
          <div class="header-actions">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar proveedor...</mat-label>
              <input matInput [(ngModel)]="searchText" (keyup.enter)="loadSuppliers()" placeholder="Nombre, RIF">
              <button mat-icon-button matSuffix (click)="loadSuppliers()">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
            <button mat-stroked-button (click)="exportPdf()">
                <mat-icon>picture_as_pdf</mat-icon> Exportar Reporte
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="suppliers" multiTemplateDataRows class="full-width-table">
              
              <ng-container matColumnDef="expand">
                <th mat-header-cell *matHeaderCellDef aria-label="row actions">&nbsp;</th>
                <td mat-cell *matCellDef="let element">
                  <button mat-icon-button aria-label="expand row" (click)="toggleExpand(element, $event)">
                    <mat-icon *ngIf="expandedElement !== element">keyboard_arrow_down</mat-icon>
                    <mat-icon *ngIf="expandedElement === element">keyboard_arrow_up</mat-icon>
                  </button>
                </td>
              </ng-container>

              <ng-container matColumnDef="cif">
                <th mat-header-cell *matHeaderCellDef> RIF / CIF </th>
                <td mat-cell *matCellDef="let element"> {{ element.cif }} </td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef> Nombre / Razón Social </th>
                <td mat-cell *matCellDef="let element"> {{ element.name }} </td>
              </ng-container>
              
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef> Teléfono </th>
                <td mat-cell *matCellDef="let element"> {{ (element.phonecomm | phoneFormat) || (element.phonefact | phoneFormat) || '-' }} </td>
              </ng-container>

              <ng-container matColumnDef="total_paid">
                <th mat-header-cell *matHeaderCellDef style="text-align: right;"> Total Abonado (USD) </th>
                <td mat-cell *matCellDef="let element" class="debt-cell"> 
                    <div class="debt-container">
                        <span class="paid-amount">$ {{ element.total_paid | number:settingsService.getDecimalFormat('total') }}</span>
                        <small class="bs-equivalent" *ngIf="currentExchangeRate">
                            {{ (element.total_paid * currentExchangeRate) | number:settingsService.getDecimalFormat('total') }} Bs.
                        </small>
                    </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef style="text-align: right;"> Saldo Deudor (USD) </th>
                <td mat-cell *matCellDef="let element" class="debt-cell"> 
                    <div class="debt-container">
                        <span class="usd-amount">$ {{ element.balance | number:settingsService.getDecimalFormat('total') }}</span>
                        <small class="bs-equivalent" *ngIf="currentExchangeRate">
                            {{ (element.balance * currentExchangeRate) | number:settingsService.getDecimalFormat('total') }} Bs.
                        </small>
                    </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let element">
                  <button mat-icon-button color="accent" (click)="$event.stopPropagation(); openViewDialog(element)" title="Ver Detalle">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="primary" (click)="$event.stopPropagation(); openHistoryDialog(element)" title="Ver Historial de Pagos">
                    <mat-icon>history</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="$event.stopPropagation(); openPaymentDialog(element)" 
                          [disabled]="!isCashOpened"
                          [matTooltip]="isCashOpened ? 'Abonar / Pagar' : 'Abra caja para registrar pagos'">
                    <mat-icon>payments</mat-icon>
                  </button>
                </td>
              </ng-container>

              <!-- Expanded Content Column -->
              <ng-container matColumnDef="expandedDetail">
                <td mat-cell *matCellDef="let element" [attr.colspan]="displayedColumns.length">
                  <div class="element-detail"
                       [@detailExpand]="element == expandedElement ? 'expanded' : 'collapsed'">
                    <div class="invoices-list">
                        <div *ngIf="!invoicesMap[element.id]" style="padding: 10px; text-align: center;">
                            <span style="color: #666; font-style: italic;">Cargando facturas...</span>
                        </div>
                        <div *ngIf="invoicesMap[element.id] && invoicesMap[element.id].length === 0" style="padding: 10px; text-align: center;">
                            <span style="color: #666; font-style: italic;">No hay facturas pendientes.</span>
                        </div>
                        <table *ngIf="invoicesMap[element.id] && invoicesMap[element.id].length > 0" class="invoices-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>N° Factura</th>
                                    <th style="text-align: right;">Abonado (USD)</th>
                                    <th style="text-align: right;">Saldo (USD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let inv of invoicesMap[element.id]">
                                    <td>{{ inv.dateInvoices }}</td>
                                    <td>{{ inv.numberInvoice }}</td>
                                    <td class="invoice-paid-amount" style="text-align: right;">$ {{ inv.paid | number:'1.2-2' }}</td>
                                    <td class="invoice-amount">$ {{ inv.balance | number:'1.2-2' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let element; columns: displayedColumns;"
                  class="element-row"
                  [class.expanded-row]="expandedElement === element"
                  (click)="toggleExpand(element, $event)">
              </tr>
              <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="detail-row"></tr>
            </table>

            <mat-paginator 
                [length]="totalElements"
                [pageSize]="pageSize"
                [pageSizeOptions]="[10, 20, 50]"
                (page)="onPageChange($event)">
            </mat-paginator>
          </div>

          <div class="empty-msg" *ngIf="suppliers.length === 0">
            No se encontraron proveedores con saldo pendiente.
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
    .debt-cell { text-align: right; }
    .debt-container { display: flex; flex-direction: column; align-items: flex-end; }
    .usd-amount { color: #d32f2f; font-weight: bold; font-size: 1rem; }
    .paid-amount { color: #388e3c; font-weight: bold; font-size: 1rem; }
    .bs-equivalent { color: #757575; font-size: 0.75rem; }
    .table-container { overflow-x: auto; }
    
    /* Expandable Row Styles */
    tr.element-row:not(.expanded-row):hover { background: whitesmoke; }
    tr.element-row:not(.expanded-row):active { background: #efefef; }
    .element-row td { border-bottom-width: 0; }
    .detail-row { height: 0; }
    .element-detail { overflow: hidden; display: flex; width: 100%; border-top: 1px solid #eee; background: #fafafa; }
    .invoices-list { width: 100%; padding: 16px; }
    .invoices-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
    .invoices-table th { text-align: left; padding: 8px; border-bottom: 2px solid #ddd; color: #666; }
    .invoices-table td { padding: 8px; border-bottom: 1px solid #ddd; }
    .invoice-amount { text-align: right; font-weight: 500; color: #d32f2f; }
    .invoice-paid-amount { text-align: right; font-weight: 500; color: #388e3c; }
  `],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class CxPProveedoresComponent implements OnInit {
  private supplierService = inject(SupplierService);
  public settingsService = inject(SettingsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private decimalPipe = inject(DecimalPipe);
  private datePipe = inject(DatePipe);
  private phoneFormatPipe = inject(PhoneFormatPipe);
  private purchaseService = inject(PurchaseService);
  private salesService = inject(SalesService);
  private cashService = inject(CashService);
  private cdr = inject(ChangeDetectorRef);

  suppliers: Supplier[] = [];
  searchText: string = '';
  displayedColumns: string[] = ['expand', 'cif', 'name', 'phone', 'total_paid', 'balance', 'actions'];
  expandedElement: Supplier | null = null;
  invoicesMap: { [key: string]: any[] } = {};
  isCashOpened = false;
  currentExchangeRate = 1;

  totalElements = 0;
  pageSize = 20;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  async ngOnInit() {
    this.loadSuppliers();
    this.isCashOpened = await this.cashService.checkStatus();
    this.loadExchangeRate();
  }

  loadExchangeRate() {
    this.salesService.getCurrencies().subscribe(currencies => {
      const usd = currencies.find(c => c.code === 'USD');
      if (usd) {
        this.currentExchangeRate = usd.exchange_rate;
      }
    });
  }

  loadSuppliers(page: number = 1) {
    this.supplierService.getAll(page, this.pageSize, this.searchText, true).subscribe(res => {
      this.suppliers = res.data;
      this.totalElements = res.total;
    });
  }

  onPageChange(event: any) {
    this.loadSuppliers(event.pageIndex + 1);
  }

  toggleExpand(element: Supplier, event: Event) {
    event.stopPropagation();
    this.expandedElement = this.expandedElement === element ? null : element;

    if (this.expandedElement && !this.invoicesMap[element.id]) {
      this.reloadInvoices(element);
    }
  }

  reloadInvoices(element: Supplier) {
    this.supplierService.getInvoices(element.id).subscribe(res => {
      this.invoicesMap[element.id] = res;
    });
  }

  openViewDialog(supplier: Supplier) {
    this.dialog.open(SupplierDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { supplier, viewOnly: true }
    });
  }

  async openPaymentDialog(supplier: Supplier) {
    this.isCashOpened = await this.cashService.checkStatus();
    if (!this.isCashOpened) {
      this.snackBar.open('Debe tener una sesión de caja abierta para registrar pagos.', 'Cerrar', { duration: 5000 });
      return;
    }

    this.salesService.getCurrencies().subscribe(currencies => {
      const usd = currencies.find(c => c.code === 'USD');
      const rate = usd ? usd.exchange_rate : 1;

      const dialogRef = this.dialog.open(CxPPaymentDialogComponent, {
        width: '650px',
        maxWidth: '95vw',
        data: {
          supplier,
          exchangeRate: rate
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const personId = JSON.parse(localStorage.getItem('user') || '{}').id || 1;
          const cashRegisterId = this.cashService.getCashRegisterId() || 1;

          const finalRequest = {
            ...result,
            person_id: personId,
            cash_register_id: cashRegisterId,
            currency_id: result.currency_id,
            money_id: this.cashService.getMoneyId() || 'CASH_MONEY'
          };

          this.purchaseService.createDebtPayment(finalRequest).subscribe({
            next: () => {
              // Reload on the current page to keep context
              const currentPage = this.paginator ? this.paginator.pageIndex + 1 : 1;

              this.supplierService.getAll(currentPage, this.pageSize, this.searchText, true).subscribe(res => {
                this.suppliers = res.data;
                this.totalElements = res.total;

                // Check if the customer we just paid was expanded
                if (this.expandedElement && this.expandedElement.id === supplier.id) {
                  const updatedSupplier = this.suppliers.find(c => c.id === supplier.id);
                  if (updatedSupplier) {
                    this.expandedElement = updatedSupplier;
                    this.reloadInvoices(updatedSupplier);
                  }
                } else {
                  delete this.invoicesMap[supplier.id];
                }
                this.cdr.markForCheck();
              });

              this.snackBar.open('Pago procesado correctamente', 'Cerrar', { duration: 3000 });
            },
            error: (err) => {
              console.error(err);
              this.snackBar.open('Error al procesar el pago', 'Cerrar', { duration: 5000 });
            }
          });
        }
      });
    });
  }

  openHistoryDialog(supplier: Supplier) {
    this.dialog.open(CxPHistoryDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { supplier }
    });
  }

  exportPdf(): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const rows = this.suppliers.map(row => `
        <tr>
            <td>${row.cif || ''}</td>
            <td>${row.name}</td>
            <td>${this.phoneFormatPipe.transform(row.phonecomm || row.phonefact)}</td>
            <td style="text-align: right; color: green; font-weight: bold;">
                $${this.decimalPipe.transform(row.total_paid, this.settingsService.getDecimalFormat('total'))}
            </td>
            <td style="text-align: right; color: red; font-weight: bold;">
                $${this.decimalPipe.transform(row.balance, this.settingsService.getDecimalFormat('total'))}
            </td>
        </tr>
    `).join('');

    const html = `
        <html>
        <head>
            <title>Reporte de CxP Proveedores</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; }
                h1 { text-align: center; color: #333; }
                .metadata { margin-bottom: 20px; text-align: center; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
                tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
        </head>
        <body>
            <h1>Reporte de CxP Proveedores (Deuda Pendiente - USD)</h1>
            <div class="metadata">
                <strong>Generado:</strong> ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>RIF / CIF</th>
                        <th>Nombre / Razón Social</th>
                        <th>Teléfono</th>
                        <th>Total Abonado</th>
                        <th>Saldo Deudor</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}
