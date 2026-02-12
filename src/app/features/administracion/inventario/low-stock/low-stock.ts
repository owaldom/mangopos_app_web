import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { SharedPaginatorComponent } from '../../../../shared/components/shared-paginator/shared-paginator.component';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { StockService } from '../../../../core/services/stock.service';
import { CategoryService, Category } from '../../../../core/services/category.service';
import { SettingsService } from '../../../../core/services/settings.service';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    SharedPaginatorComponent,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  providers: [DatePipe, DecimalPipe],
  template: `
    <div class="container">
      <div class="header">
        <h1>Consulta de Stock Bajo</h1>
        <div class="actions">
          <button mat-stroked-button color="primary" (click)="exportExcel()" [disabled]="dataSource.data.length === 0">
            <mat-icon>table_view</mat-icon> EXPORTAR A EXCEL
          </button>
          <button mat-stroked-button color="accent" (click)="exportPdf()" [disabled]="dataSource.data.length === 0">
            <mat-icon>picture_as_pdf</mat-icon> EXPORTAR REPORTE
          </button>
        </div>
      </div>

      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-row">
            <mat-form-field appearance="outline">
              <mat-label>Categoría</mat-label>
              <mat-select [(ngModel)]="filters.categoryId" (selectionChange)="loadReport()">
                <mat-option [value]="null">Todas las Categorías</mat-option>
                <mat-option *ngFor="let cat of categories" [value]="cat.id">
                  {{ cat.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar producto...</mat-label>
              <input matInput [(ngModel)]="filters.search" (keyup.enter)="loadReport()" placeholder="Nombre, código o referencia">
              <button mat-icon-button matSuffix (click)="loadReport()">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>

            <button mat-flat-button color="primary" class="filter-btn" (click)="loadReport()">
               FILTRAR
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        <div class="table-container">
          <table mat-table [dataSource]="dataSource" matSort>
            
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Referencia </th>
              <td mat-cell *matCellDef="let element"> {{element.reference}} </td>
            </ng-container>

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Código </th>
              <td mat-cell *matCellDef="let element"> {{element.code}} </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Nombre </th>
              <td mat-cell *matCellDef="let element"> {{element.name}} </td>
            </ng-container>

            <ng-container matColumnDef="category_name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Categoría </th>
              <td mat-cell *matCellDef="let element"> {{element.category_name}} </td>
            </ng-container>

            <ng-container matColumnDef="min_stock">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Stock Mínimo </th>
              <td mat-cell *matCellDef="let element" class="text-right"> {{element.min_stock | number:'1.0-3'}} </td>
            </ng-container>

            <ng-container matColumnDef="current_stock">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Stock Actual </th>
              <td mat-cell *matCellDef="let element" class="text-right"> 
                <span [class.stock-critical]="element.current_stock <= 0" 
                      [class.stock-warning]="element.current_stock > 0">
                  {{element.current_stock | number:'1.0-3'}}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" colspan="6" class="text-center p-20">
                {{ loading ? 'Cargando datos...' : 'No se encontraron productos con stock bajo.' }}
              </td>
            </tr>
          </table>
        </div>

        <app-shared-paginator [length]="dataSource.data.length" [pageSize]="50"></app-shared-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .actions { display: flex; gap: 10px; }
    .filter-card { margin-bottom: 20px; }
    .filter-row { display: flex; gap: 15px; align-items: baseline; }
    .search-field { flex: 1; }
    .filter-btn { height: 50px; }
    .full-width { width: 100%; }
    .table-container { overflow-x: auto; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .p-20 { padding: 20px; }
    
    .stock-critical { color: #f44336; font-weight: bold; }
    .stock-warning { color: #ff9800; font-weight: bold; }
  `]
})
export class LowStockComponent implements OnInit {
  private stockService = inject(StockService);
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);
  public settingsService = inject(SettingsService);
  private datePipe = inject(DatePipe);
  private decimalPipe = inject(DecimalPipe);

  displayedColumns: string[] = ['reference', 'code', 'name', 'category_name', 'min_stock', 'current_stock'];
  dataSource = new MatTableDataSource<any>([]);
  categories: Category[] = [];
  loading = false;

  filters = {
    categoryId: null,
    search: ''
  };

  @ViewChild(SharedPaginatorComponent) sharedPaginator!: SharedPaginatorComponent;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadCategories();
    this.loadReport();
  }

  loadCategories() {
    this.categoryService.getAll(1, 200).subscribe(res => {
      this.categories = res.data;
    });
  }

  loadReport() {
    this.loading = true;
    this.stockService.getLowStockReport(this.filters).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        // Wait for ViewChild to be available (if data loads very fast, it might be race condition, but usually ok)
        setTimeout(() => {
          if (this.sharedPaginator && this.sharedPaginator.paginator) {
            this.dataSource.paginator = this.sharedPaginator.paginator;
          }
        });
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar reporte:', err);
        this.snackBar.open('Error al cargar reporte de stock bajo', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  exportExcel() {
    if (this.dataSource.data.length === 0) return;

    // Generar CSV
    const headers = ['Referencia', 'Codigo', 'Nombre', 'Categoria', 'Stock Minimo', 'Stock Actual'];
    const rows = this.dataSource.data.map(item => [
      `"${item.reference}"`,
      `"${item.code}"`,
      `"${item.name}"`,
      `"${item.category_name}"`,
      item.min_stock,
      item.current_stock
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `StockBajo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportPdf() {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      this.snackBar.open('Por favor permita las ventanas emergentes para ver el reporte', 'Cerrar', { duration: 3000 });
      return;
    }

    const categoryName = this.filters.categoryId
      ? (this.categories.find(c => c.id === this.filters.categoryId)?.name || 'Seleccionada')
      : 'Todas';

    const rows = this.dataSource.data.map(item => `
        <tr>
            <td>${item.reference}</td>
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.category_name}</td>
            <td style="text-align: right;">${this.decimalPipe.transform(item.min_stock, '1.0-3')}</td>
            <td style="text-align: right; color: ${item.current_stock <= 0 ? '#d32f2f' : '#f57c00'}; font-weight: bold;">
                ${this.decimalPipe.transform(item.current_stock, '1.0-3')}
            </td>
        </tr>
    `).join('');

    const html = `
        <html>
        <head>
            <title>Reporte de Stock Bajo</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 30px; }
                .report-header { text-align: center; margin-bottom: 30px; }
                h1 { color: #d32f2f; margin: 0; font-size: 24px; letter-spacing: 1px; }
                .report-header p { margin: 5px 0; color: #666; font-size: 14px; }
                .metadata { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #d32f2f; }
                .metadata table { width: 100%; border: none; }
                .metadata td { border: none; padding: 3px 0; }
                table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                table.data-table th, table.data-table td { border: 1px solid #dee2e6; padding: 10px 8px; text-align: left; }
                table.data-table th { background-color: #f1f3f5; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #495057; }
                table.data-table tr:nth-child(even) { background-color: #fcfcfc; }
                .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
                .text-right { text-align: right; }
                @media print {
                  @page { margin: 15mm; }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>REPORTE DE STOCK BAJO</h1>
                <p>Inventario de Reposición Crítica</p>
            </div>
            
            <div class="metadata">
                <table>
                    <tr>
                        <td width="50%"><strong>Empresa:</strong> Mango POS Sun Market</td>
                        <td width="50%" class="text-right"><strong>Fecha Emisión:</strong> ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}</td>
                    </tr>
                    <tr>
                        <td><strong>Filtro Categoría:</strong> ${categoryName}</td>
                        <td class="text-right"><strong>Total Productos:</strong> ${this.dataSource.data.length}</td>
                    </tr>
                </table>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Referencia</th>
                        <th>Código</th>
                        <th>Descripción Producto</th>
                        <th>Categoría</th>
                        <th class="text-right">Mínimo</th>
                        <th class="text-right">Actual</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="footer">
                Documento generado automáticamente por el Sistema Mango POS - Control de Inventario
            </div>

            <script>
                window.onload = function() { 
                    window.print(); 
                    // window.close();
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}
