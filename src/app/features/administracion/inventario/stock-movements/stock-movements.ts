import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { SettingsService } from '../../../../core/services/settings.service';
import { SystemDatePipe } from '../../../../shared/pipes/system-date.pipe';

import { StockService, StockMovement, MovementReason } from '../../../../core/services/stock.service';
import { StockMovementFormComponent } from './components/stock-movement-form/stock-movement-form';

@Component({
  selector: 'app-stock-movements',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    SystemDatePipe
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Movimientos de Stock (Kardex)</h1>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nuevo Movimiento
        </button>
      </div>

      <mat-card>
        <div class="table-container">
          <table mat-table [dataSource]="dataSource">
            
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef> Fecha </th>
              <td mat-cell *matCellDef="let element"> {{ element.datenew | systemDate }} </td>
            </ng-container>

            <ng-container matColumnDef="location">
              <th mat-header-cell *matHeaderCellDef> Almacén </th>
              <td mat-cell *matCellDef="let element"> {{ element.location_name }} </td>
            </ng-container>
            
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef> Producto </th>
              <td mat-cell *matCellDef="let element"> 
                <span class="product-name">{{ element.product_name }}</span>
                <span class="product-ref">{{ element.product_reference }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="reason">
              <th mat-header-cell *matHeaderCellDef> Motivo </th>
              <td mat-cell *matCellDef="let element"> {{ getReasonName(element.reason) }} </td>
            </ng-container>

            <ng-container matColumnDef="units">
              <th mat-header-cell *matHeaderCellDef> Unidades </th>
              <td mat-cell *matCellDef="let element" [class.negative]="element.units < 0" [class.positive]="element.units > 0">
                {{ element.units | number:settingsService.getDecimalFormat('quantity') }}
              </td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef> Precio </th>
              <td mat-cell *matCellDef="let element"> {{ element.price | currency:'USD':'$ ':settingsService.getDecimalFormat('price') }} </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
        
        <mat-paginator 
            [length]="totalElements"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)">
        </mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .table-container { overflow-x: auto; }
    .product-name { display: block; font-weight: 500; }
    .product-ref { display: block; font-size: 0.8em; color: #666; }
    .negative { color: #d32f2f; font-weight: bold; }
    .positive { color: #388e3c; font-weight: bold; }
  `]
})
export class StockMovementsComponent implements OnInit {
  displayedColumns: string[] = ['date', 'location', 'product', 'reason', 'units', 'price'];
  dataSource = new MatTableDataSource<StockMovement>([]);
  totalElements = 0;
  pageSize = 20;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private stockService = inject(StockService);
  private dialog = inject(MatDialog);
  public settingsService = inject(SettingsService);

  ngOnInit(): void {
    this.loadMovements(1);
  }

  loadMovements(page: number): void {
    this.stockService.getMovements(page, this.pageSize).subscribe(res => {
      this.dataSource.data = res.data;
      this.totalElements = res.total;
    });
  }

  onPageChange(event: any): void {
    this.loadMovements(event.pageIndex + 1);
  }

  openForm(): void {
    const dialogRef = this.dialog.open(StockMovementFormComponent, {
      width: '1000px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.stockService.createMovement(result).subscribe({
          next: () => {
            this.loadMovements(1);
          },
          error: (err) => alert('Error: ' + err.error.error)
        });
      }
    });
  }

  getReasonName(key: number): string {
    const reason = MovementReason.getAll().find(r => r.key === key);
    return reason ? reason.name : 'Desconocido';
  }
}
