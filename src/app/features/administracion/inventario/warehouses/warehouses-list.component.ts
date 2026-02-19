import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { WarehouseService } from '../../../../core/services/warehouse.service';
import { Warehouse } from '../../../../core/models/warehouse.model';
import { WarehouseFormComponent } from './components/warehouse-form/warehouse-form';

@Component({
  selector: 'app-warehouses-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Gestión de Almacenes</h1>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nuevo Almacén
        </button>
      </div>

      <mat-card>
        <div class="table-container">
          <table mat-table [dataSource]="warehouses" class="full-width">
            
            <!-- ID Column -->
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef> ID </th>
              <td mat-cell *matCellDef="let element"> {{element.id}} </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let element"> {{element.name}} </td>
            </ng-container>

            <!-- Address Column -->
            <ng-container matColumnDef="address">
              <th mat-header-cell *matHeaderCellDef> Dirección </th>
              <td mat-cell *matCellDef="let element"> {{element.address || '-'}} </td>
            </ng-container>

            <!-- Type Column -->
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef> Tipo </th>
              <td mat-cell *matCellDef="let element">
                <span class="badge" [ngClass]="element.type">
                  {{element.type === 'factory' ? 'Fábrica' : 'Punto de Venta'}}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> Acciones </th>
              <td mat-cell *matCellDef="let element">
                <button mat-icon-button color="primary" (click)="openForm(element)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteWarehouse(element)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" colspan="5">No hay almacenes registrados</td>
            </tr>
          </table>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      h1 { margin: 0; }
    }
    .full-width {
      width: 100%;
    }
    .mat-column-id {
      width: 60px;
    }
    .mat-column-actions {
      width: 100px;
      text-align: right;
    }
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    .badge.factory { background-color: #e3f2fd; color: #1976d2; }
    .badge.pos { background-color: #f1f8e9; color: #33691e; }
  `]
})
export class WarehousesListComponent implements OnInit {
  warehouses: Warehouse[] = [];
  displayedColumns: string[] = ['id', 'name', 'address', 'type', 'actions'];

  private warehouseService = inject(WarehouseService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.warehouseService.getAll().subscribe({
      next: (data) => this.warehouses = data,
      error: (err) => console.error('Error cargando almacenes', err)
    });
  }

  openForm(warehouse?: Warehouse): void {
    const dialogRef = this.dialog.open(WarehouseFormComponent, {
      width: '450px',
      data: { warehouse }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (warehouse) {
          this.warehouseService.update(warehouse.id, result).subscribe({
            next: () => {
              this.showSuccess('Almacén actualizado');
              this.loadWarehouses();
            },
            error: (err) => this.showError('Error al actualizar: ' + (err.error?.error || err.message))
          });
        } else {
          this.warehouseService.create(result).subscribe({
            next: () => {
              this.showSuccess('Almacén creado');
              this.loadWarehouses();
            },
            error: (err) => this.showError('Error al crear: ' + (err.error?.error || err.message))
          });
        }
      }
    });
  }

  deleteWarehouse(warehouse: Warehouse): void {
    if (confirm(`¿Estás seguro de eliminar el almacén "${warehouse.name}"?`)) {
      this.warehouseService.delete(warehouse.id).subscribe({
        next: () => {
          this.showSuccess('Almacén eliminado');
          this.loadWarehouses();
        },
        error: (err) => this.showError('Error al eliminar: ' + (err.error?.error || err.message))
      });
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
