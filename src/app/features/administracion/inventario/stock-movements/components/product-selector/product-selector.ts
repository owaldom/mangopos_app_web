import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SharedPaginatorComponent } from '../../../../../../shared/components/shared-paginator/shared-paginator.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductService, Product } from '../../../../../../core/services/product.service';
import { SettingsService } from '../../../../../../core/services/settings.service';

@Component({
  selector: 'app-product-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    SharedPaginatorComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Buscar Producto</h2>
    <mat-dialog-content>
      <div class="search-container">
        <mat-form-field appearance="outline" class="full-width">
            <mat-label>Filtrar por nombre, código o referencia</mat-label>
            <input matInput #searchInput
                   [formControl]="searchControl" 
                   (keyup.enter)="onSearchEnter($event)"
                   placeholder="Escanear o escribir para buscar...">
            <button *ngIf="searchControl.value" matSuffix mat-icon-button aria-label="Limpiar" (click)="searchControl.setValue('')">
                <mat-icon>close</mat-icon>
            </button>
        </mat-form-field>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="products" class="full-width">
            <!-- Reference Column -->
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef> Ref </th>
              <td mat-cell *matCellDef="let element"> {{element.reference}} </td>
            </ng-container>

            <!-- Code Column -->
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef> Código </th>
              <td mat-cell *matCellDef="let element"> {{element.code}} </td>
            </ng-container>
            
            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let element"> 
                <strong>{{element.name}}</strong>
              </td>
            </ng-container>

            <!-- Price Column -->
             <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef> Precio Venta </th>
              <td mat-cell *matCellDef="let element"> {{element.pricesell | currency:'USD':'$ ':settingsService.getDecimalFormat('price')}} </td>
            </ng-container>

            <!-- Stock Column -->
            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef> Stock </th>
              <td mat-cell *matCellDef="let element"> 
                <span [style.color]="(element.stock_current || 0) <= 0 ? 'red' : 'green'" style="font-weight: bold;">
                    {{element.stock_current || 0 | number:settingsService.getDecimalFormat('quantity')}}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> </th>
              <td mat-cell *matCellDef="let element">
                <button mat-stroked-button color="primary" (click)="selectProduct(element)">
                  Seleccionar
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
             <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" colspan="5">No se encontraron productos</td>
            </tr>
        </table>
      </div>

      <app-shared-paginator 
          [length]="totalProducts"
          [pageSize]="pageSize"
          [pageIndex]="currentPage"
          (page)="onPageChange($event)">
      </app-shared-paginator>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .search-container { margin-bottom: 10px; }
    .table-container { max-height: 800px; overflow: auto; }
    td.mat-cell { padding: 8px; }
  `]
})
export class ProductSelectorComponent implements OnInit {
  products: Product[] = [];
  displayedColumns: string[] = ['reference', 'code', 'name', 'price', 'stock', 'actions'];
  searchControl = new FormControl('');
  @ViewChild('searchInput') searchInput!: ElementRef;

  totalProducts = 0;
  pageSize = 50;
  currentPage = 0;

  private productService = inject(ProductService);
  public dialogRef = inject(MatDialogRef<ProductSelectorComponent>);
  public settingsService = inject(SettingsService);
  public data = inject(MAT_DIALOG_DATA, { optional: true });

  get locationId(): number | null {
    return this.data?.locationId || null;
  }

  ngOnInit(): void {
    this.loadProducts();

    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(val => {
      this.currentPage = 0; // Reset page on search
      this.loadProducts(val || '');
    });

    // Auto-focus search field
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 500);
  }

  onSearchEnter(event: any): void {
    const search = event.target.value?.trim();
    if (!search) return;

    this.productService.getAll(1, this.pageSize, { search, locationId: this.locationId }).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          // Intentar coincidencia exacta primero
          const exactMatch = res.data.find(p => p.code === search || p.reference === search);
          if (exactMatch) {
            this.selectProduct(exactMatch);
            return;
          }
        }
        // Si no hay coincidencia exacta o no se encontró nada, mostramos mensaje o simplemente limpiamos
        // Para emular el POS, si no hay coincidencia exacta pero hay resultados, al menos cargarlos
        this.products = res.data;
        this.totalProducts = res.total;

        if (res.data.length === 0) {
          this.searchControl.setValue('');
        }
      }
    });
  }

  loadProducts(search: string = ''): void {
    const page = this.currentPage + 1;
    this.productService.getAll(page, this.pageSize, { search, locationId: this.locationId }).subscribe({
      next: (res) => {
        this.products = res.data;
        this.totalProducts = res.total;

        // Si la búsqueda es por un código exacto y solo hay un resultado, seleccionarlo automáticamente
        if (search && res.data.length === 1) {
          const product = res.data[0];
          if (product.code === search || product.reference === search) {
            this.selectProduct(product);
          }
        }
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts(this.searchControl.value || '');
  }

  selectProduct(product: Product): void {
    this.dialogRef.close(product);
  }
}
