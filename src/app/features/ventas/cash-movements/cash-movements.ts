import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common'; // Import Pipes
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { SharedPaginatorComponent } from '../../../shared/components/shared-paginator/shared-paginator.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../../core/services/settings.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SystemDatePipe } from '../../../shared/pipes/system-date.pipe';

interface Currency {
    id: number;
    name: string;
    symbol: string;
}

import { CashService, CashMovement } from '../../../core/services/cash.service';
import { CashMovementFormComponent } from './components/cash-movement-form';

@Component({
    selector: 'app-cash-movements',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatTableModule,
        MatPaginatorModule,
        SharedPaginatorComponent,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSnackBarModule,
        SystemDatePipe
    ],
    providers: [DatePipe, DecimalPipe, SystemDatePipe],
    template: `
        <div class="container">
            <div class="header">
                <h1>Movimientos de Caja</h1>
                <button mat-flat-button color="primary" (click)="openForm()">
                    <mat-icon>add</mat-icon> Nuevo Movimiento
                </button>
            </div>
            
            <div class="actions-row" style="margin-bottom: 20px; display: flex; justify-content: flex-end;">
                <button mat-stroked-button (click)="exportPdf()">
                    <mat-icon>picture_as_pdf</mat-icon> Exportar Reporte
                </button>
            </div>

            <mat-card class="filters-card">
                <mat-card-content>
                    <div class="filters-row">
                        <mat-form-field appearance="outline">
                            <mat-label>Fecha Desde</mat-label>
                            <input matInput [matDatepicker]="pickerStart" [(ngModel)]="filterStartDate" (ngModelChange)="applyFilters()">
                            <mat-datepicker-toggle matIconSuffix [for]="pickerStart"></mat-datepicker-toggle>
                            <mat-datepicker #pickerStart></mat-datepicker>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>Fecha Hasta</mat-label>
                            <input matInput [matDatepicker]="pickerEnd" [(ngModel)]="filterEndDate" (ngModelChange)="applyFilters()">
                            <mat-datepicker-toggle matIconSuffix [for]="pickerEnd"></mat-datepicker-toggle>
                            <mat-datepicker #pickerEnd></mat-datepicker>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>Tipo</mat-label>
                            <mat-select [(ngModel)]="filterType" (ngModelChange)="applyFilters()">
                                <mat-option [value]="null">Todos</mat-option>
                                <mat-option value="IN">Entrada</mat-option>
                                <mat-option value="OUT">Salida</mat-option>
                            </mat-select>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>Moneda</mat-label>
                            <mat-select [(ngModel)]="filterCurrency" (ngModelChange)="applyFilters()">
                                <mat-option [value]="null">Todas</mat-option>
                                <mat-option *ngFor="let currency of currencies" [value]="currency.id">
                                    {{ currency.name }} ({{ currency.symbol }})
                                </mat-option>
                            </mat-select>
                        </mat-form-field>

                        <button mat-stroked-button (click)="clearFilters()">
                            <mat-icon>clear</mat-icon> Limpiar Filtros
                        </button>
                    </div>
                </mat-card-content>
            </mat-card>

            <mat-card>
                <div class="table-container">
                    <table mat-table [dataSource]="dataSource">
                        
                        <ng-container matColumnDef="date">
                            <th mat-header-cell *matHeaderCellDef> Fecha </th>
                            <td mat-cell *matCellDef="let element"> {{ element.datenew | systemDate }} </td>
                        </ng-container>

                        <ng-container matColumnDef="type">
                            <th mat-header-cell *matHeaderCellDef> Tipo </th>
                            <td mat-cell *matCellDef="let element">
                                <span [class.type-in]="element.movement_type === 'IN'" [class.type-out]="element.movement_type === 'OUT'">
                                    {{ element.movement_type === 'IN' ? 'Entrada' : 'Salida' }}
                                </span>
                            </td>
                        </ng-container>

                        <ng-container matColumnDef="amount">
                            <th mat-header-cell *matHeaderCellDef> Monto </th>
                            <td mat-cell *matCellDef="let element" [class.amount-in]="element.movement_type === 'IN'" [class.amount-out]="element.movement_type === 'OUT'">
                                {{ element.currency_symbol || '$' }} {{ element.amount | number:settingsService.getDecimalFormat('total') }}
                            </td>
                        </ng-container>

                        <ng-container matColumnDef="concept">
                            <th mat-header-cell *matHeaderCellDef> Concepto </th>
                            <td mat-cell *matCellDef="let element"> {{ element.concept || '-' }} </td>
                        </ng-container>

                        <ng-container matColumnDef="person">
                            <th mat-header-cell *matHeaderCellDef> Usuario </th>
                            <td mat-cell *matCellDef="let element"> {{ element.person_name || '-' }} </td>
                        </ng-container>

                        <ng-container matColumnDef="session">
                            <th mat-header-cell *matHeaderCellDef> Sesión </th>
                            <td mat-cell *matCellDef="let element"> 
                                {{ element.host ? (element.host + ' #' + element.hostsequence) : '-' }}
                            </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                    </table>
                </div>
                
                <app-shared-paginator 
                    [length]="totalElements"
                    [pageSize]="pageSize"
                    (page)="onPageChange($event)">
                </app-shared-paginator>
            </mat-card>
        </div>
    `,
    styles: [`
        .container { padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .filters-card { margin-bottom: 20px; }
        .filters-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .table-container { overflow-x: auto; }
        .type-in { color: #388e3c; font-weight: 500; }
        .type-out { color: #d32f2f; font-weight: 500; }
        .amount-in { color: #388e3c; font-weight: bold; }
        .amount-out { color: #d32f2f; font-weight: bold; }
    `]
})
export class CashMovementsComponent implements OnInit {
    displayedColumns: string[] = ['date', 'type', 'amount', 'concept', 'person', 'session'];
    dataSource = new MatTableDataSource<CashMovement>([]);
    totalElements = 0;
    pageSize = 50;

    filterStartDate: Date | null = null;
    filterEndDate: Date | null = null;
    filterType: 'IN' | 'OUT' | null = null;
    filterCurrency: number | null = null;
    currencies: Currency[] = [];

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    private cashService = inject(CashService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private http = inject(HttpClient);
    public settingsService = inject(SettingsService);
    private datePipe = inject(DatePipe); // Inject DatePipe
    private decimalPipe = inject(DecimalPipe); // Inject DecimalPipe
    private systemDatePipe = inject(SystemDatePipe);

    ngOnInit(): void {
        this.loadCurrencies();
        this.loadMovements(1);
    }

    loadMovements(page: number): void {
        const filters: any = {};

        if (this.filterStartDate) {
            filters.startDate = this.formatDate(this.filterStartDate);
        }
        if (this.filterEndDate) {
            filters.endDate = this.formatDate(this.filterEndDate);
        }
        if (this.filterType) {
            filters.movementType = this.filterType;
        }
        if (this.filterCurrency) {
            filters.currencyId = this.filterCurrency;
        }

        this.cashService.getCashMovements(page, this.pageSize, filters).subscribe(res => {
            this.dataSource.data = res.data;
            this.totalElements = res.total;
        });
    }

    onPageChange(event: any): void {
        this.loadMovements(event.pageIndex + 1);
    }

    applyFilters(): void {
        this.loadMovements(1);
    }

    clearFilters(): void {
        this.filterStartDate = null;
        this.filterEndDate = null;
        this.filterType = null;
        this.filterCurrency = null;
        this.loadMovements(1);
    }

    private loadCurrencies(): void {
        this.http.get<Currency[]>(`${environment.apiUrl}/sales/currencies`).subscribe(currencies => {
            this.currencies = currencies;
        });
    }

    openForm(): void {
        const dialogRef = this.dialog.open(CashMovementFormComponent, {
            width: '600px',
            maxWidth: '95vw'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.cashService.createCashMovement(result).subscribe({
                    next: () => {
                        this.snackBar.open('Movimiento registrado correctamente', 'Cerrar', { duration: 3000 });
                        this.loadMovements(1);
                    },
                    error: (err) => {
                        this.snackBar.open('Error: ' + (err.error?.error || err.message), 'Cerrar', { duration: 5000 });
                    }
                });
            }
        });
    }

    private formatDate(date: Date): string {
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    exportPdf(): void {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        const dateRange = this.filterStartDate || this.filterEndDate
            ? `Del ${this.filterStartDate ? this.formatDate(this.filterStartDate) : 'Inicio'} al ${this.filterEndDate ? this.formatDate(this.filterEndDate) : 'Actualidad'}`
            : 'Todo el historial';

        const rows = this.dataSource.data.map(row => `
            <tr>
                <td>${this.systemDatePipe.transform(row.datenew)}</td>
                <td>
                    <span style="color: ${row.movement_type === 'IN' ? 'green' : 'red'}; font-weight: bold;">
                        ${row.movement_type === 'IN' ? 'Entrada' : 'Salida'}
                    </span>
                </td>
                <td style="text-align: right;">
                    ${row.currency_symbol} ${this.decimalPipe.transform(row.amount, '1.2-2')}
                </td>
                <td>${row.concept || '-'}</td>
                <td>${row.person_name || '-'}</td>
                <td>${row.host ? row.host + ' #' + row.hostsequence : '-'}</td>
            </tr>
        `).join('');

        const html = `
            <html>
            <head>
                <title>Reporte de Movimientos de Caja</title>
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
                <h1>Reporte de Movimientos de Caja</h1>
                <div class="metadata">
                    <strong>Rango:</strong> ${dateRange} <br>
                    <strong>Generado:</strong> ${this.systemDatePipe.transform(new Date())}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Monto</th>
                            <th>Concepto</th>
                            <th>Usuario</th>
                            <th>Sesión</th>
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
