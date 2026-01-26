import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CompoundProductsService } from './compound-products.service';
import { CompoundProductDetail, ProductForCompound } from './compound-products.model';
import { CompoundProductDialogComponent } from './compound-product-dialog.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-compound-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Configurar Productos Compuestos</h1>
      </div>

      <mat-card class="filter-card">
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Seleccionar Producto Compuesto</mat-label>
            <mat-select [formControl]="selectedProductControl" (selectionChange)="onProductChange()">
              <mat-option *ngFor="let product of products" [value]="product.id">
                {{product.name}} ({{product.reference}})
              </mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <mat-card *ngIf="selectedProductControl.value">
        <mat-card-header>
          <mat-card-title>
            Insumos del Producto
            <button mat-raised-button color="primary" (click)="openDialog()" class="add-button">
              <mat-icon>add</mat-icon> Agregar Insumo
            </button>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="compoundProducts" class="full-width">
              
              <!-- Insumo Column -->
              <ng-container matColumnDef="insumo">
                <th mat-header-cell *matHeaderCellDef> Insumo </th>
                <td mat-cell *matCellDef="let element"> {{element.nameinsumo || element.insumo_name}} </td>
              </ng-container>

              <!-- Cantidad Column -->
              <ng-container matColumnDef="cantidad">
                <th mat-header-cell *matHeaderCellDef> Cantidad </th>
                <td mat-cell *matCellDef="let element"> {{element.cantidad}} </td>
              </ng-container>

              <!-- Unidad Producto Column -->
              <ng-container matColumnDef="unidadproduct">
                <th mat-header-cell *matHeaderCellDef> Unidad Producto </th>
                <td mat-cell *matCellDef="let element"> 
                  {{element.unidad_product_name || element.unidadproduct}} 
                </td>
              </ng-container>

              <!-- Unidad Insumo Column -->
              <ng-container matColumnDef="unidadinsumo">
                <th mat-header-cell *matHeaderCellDef> Unidad Insumo </th>
                <td mat-cell *matCellDef="let element"> 
                  {{element.unidad_insumo_name || element.unidadinsumo}} 
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let element">
                  <button mat-icon-button color="primary" (click)="openDialog(element)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteCompoundProduct(element)" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell" colspan="5">No hay insumos configurados para este producto</td>
              </tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <div *ngIf="!selectedProductControl.value" class="empty-state">
        <mat-icon>inventory_2</mat-icon>
        <p>Seleccione un producto para configurar sus insumos</p>
      </div>
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
    .filter-card {
      margin-bottom: 24px;
    }
    .full-width {
      width: 100%;
    }
    .table-container {
      overflow-x: auto;
    }
    .mat-column-actions {
      width: 120px;
      text-align: right;
    }
    .add-button {
      margin-left: 16px;
    }
    mat-card-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .empty-state {
      text-align: center;
      padding: 48px;
      color: rgba(0, 0, 0, 0.54);
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }
      
      p {
        font-size: 16px;
      }
    }
  `]
})
export class CompoundProductsComponent implements OnInit {
  products: ProductForCompound[] = [];
  compoundProducts: CompoundProductDetail[] = [];
  selectedProductControl = new FormControl<number | null>(null);
  displayedColumns: string[] = ['insumo', 'cantidad', 'unidadproduct', 'unidadinsumo', 'actions'];

  private compoundProductsService = inject(CompoundProductsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.loadProducts();
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.selectedProductControl.setValue(+params['id']);
        this.loadCompoundProducts(+params['id']);
      }
    });
  }

  loadProducts(): void {
    // Cargar 100 por defecto para que aparezcan en el selector de gestión
    this.compoundProductsService.getProductsForCompounds(1, 100).subscribe({
      next: (res: any) => {
        this.products = res.data;
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  onProductChange(): void {
    const productId = this.selectedProductControl.value;
    if (productId) {
      this.loadCompoundProducts(productId);
    } else {
      this.compoundProducts = [];
    }
  }

  loadCompoundProducts(productId: number): void {
    this.compoundProductsService.getCompoundProducts(productId).subscribe({
      next: (data) => {
        this.compoundProducts = data;
      },
      error: (err) => {
        console.error('Error cargando productos compuestos', err);
        this.showError('Error al cargar insumos');
      }
    });
  }

  openDialog(compoundProduct?: CompoundProductDetail): void {
    const productId = this.selectedProductControl.value;
    if (!productId) {
      this.showError('Debe seleccionar un producto primero');
      return;
    }

    const dialogRef = this.dialog.open(CompoundProductDialogComponent, {
      width: '600px',
      data: {
        compoundProduct,
        productId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCompoundProducts(productId);
      }
    });
  }

  deleteCompoundProduct(compoundProduct: CompoundProductDetail): void {
    if (confirm(`¿Está seguro de eliminar el insumo "${compoundProduct.nameinsumo}"?`)) {
      this.compoundProductsService.deleteCompoundProduct(compoundProduct.id!).subscribe({
        next: () => {
          this.showSuccess('Insumo eliminado correctamente');
          this.loadCompoundProducts(this.selectedProductControl.value!);
        },
        error: (err) => this.showError('Error al eliminar: ' + err.error?.error)
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
