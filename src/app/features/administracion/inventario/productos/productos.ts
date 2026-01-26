import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { ProductService, Product } from '../../../../core/services/product.service';
import { ProductFormComponent } from './components/product-form/product-form';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../../../core/services/settings.service';
import { Category, CategoryService } from '../../../../core/services/category.service';
import { PriceChangeDialogComponent } from '../../../inventario/price-change-dialog/price-change-dialog.component';
import { SalesService } from '../../../../core/services/sales.service';

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_base: boolean;
}

@Component({
  selector: 'app-productos',
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
    MatPaginatorModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Gestión de Productos</h1>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nuevo Producto
        </button>
      </div>

      <mat-card class="filter-card">
        <mat-card-header>
            <mat-card-title>Filtros Avanzados</mat-card-title>
        </mat-card-header>
        <mat-card-content>
            <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="filter-form">
                <div class="filter-row">
                    <mat-form-field appearance="outline">
                        <mat-label>Nombre</mat-label>
                        <input matInput formControlName="name" placeholder="Ej: Arroz...">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                        <mat-label>Categoría</mat-label>
                        <mat-select formControlName="category">
                            <mat-option value="all">Todas</mat-option>
                            <mat-option *ngFor="let cat of categories" [value]="cat.id">
                                {{cat.name}}
                            </mat-option>
                        </mat-select>
                    </mat-form-field>

                    <div class="barcode-container">
                      <mat-icon class="barcode-icon">qr_code_scanner</mat-icon>
                      <input #barcodeInput type="text" formControlName="code" (keyup.enter)="applyFilters()"
                          placeholder="Escanea Código..." class="barcode-input">
                    </div>

                    <mat-form-field appearance="outline">
                        <mat-label>Tipo</mat-label>
                        <mat-select formControlName="typeproduct">
                            <mat-option value="">Cualquiera</mat-option>
                            <mat-option value="SI">Estándar</mat-option>
                            <mat-option value="CO">Compuesto</mat-option>
                            <mat-option value="IN">Insumo</mat-option>
                            <mat-option value="KI">Kit/Combo</mat-option>
                        </mat-select>
                    </mat-form-field>
                </div>

                <div class="filter-row">
                    <div class="checkbox-group">
                        <mat-checkbox formControlName="servicio">Servicio</mat-checkbox>
                        <mat-checkbox formControlName="isscale">Balanza</mat-checkbox>
                        <mat-checkbox formControlName="regulated">Regulado</mat-checkbox>
                    </div>

                    <div class="button-group">
                        <button mat-button type="button" (click)="clearFilters()">Limpiar</button>
                        <button mat-flat-button color="primary" type="submit">
                            <mat-icon>filter_alt</mat-icon> Filtrar
                        </button>
                    </div>
                </div>
            </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        <div class="table-container">
          <table mat-table [dataSource]="products" multiTemplateDataRows class="full-width">
            
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef> Referencia </th>
              <td mat-cell *matCellDef="let element"> {{element.reference}} </td>
            </ng-container>

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef> Código </th>
              <td mat-cell *matCellDef="let element"> {{element.code}} </td>
            </ng-container>
            
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let element"> {{element.name}} </td>
            </ng-container>

            <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef> Categoría </th>
                <td mat-cell *matCellDef="let element"> {{element.category_name || element.category}} </td>
            </ng-container>

            <ng-container matColumnDef="pricesell">
                <th mat-header-cell *matHeaderCellDef style="text-align: right;"> Precio Venta Bs. </th>
                <td mat-cell *matCellDef="let element" style="text-align: right;"> {{element.pricesell * this.exchangeRate | currency:settingsService.getSettings()?.currency_symbol:'symbol':settingsService.getDecimalFormat('price')}} </td>
            </ng-container>

            <ng-container matColumnDef="pricesellusd">
                <th mat-header-cell *matHeaderCellDef style="text-align: right;"> Precio Venta USD </th>
                <td mat-cell *matCellDef="let element" style="text-align: right;"> $ {{element.pricesell | number:settingsService.getDecimalFormat('price')}}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="text-align: center;"> Acciones </th>
              <td mat-cell *matCellDef="let element" style="text-align: center;">
                <div class="action-buttons-cell">
                    <button mat-icon-button color="accent" (click)="openPriceDialog(element); $event.stopPropagation()" matTooltip="Cambiar Precio">
                    <mat-icon>price_change</mat-icon>
                    </button>
                    <button mat-icon-button color="primary" (click)="openForm(element); $event.stopPropagation()" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteProduct(element); $event.stopPropagation()" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                    </button>
                    <button mat-icon-button (click)="toggleExpand(element, $event)">
                        <mat-icon>{{expandedElement === element ? 'expand_less' : 'expand_more'}}</mat-icon>
                    </button>
                </div>
              </td>
            </ng-container>

            <!-- Expanded Content Column -->
            <ng-container matColumnDef="expandedDetail">
                <td mat-cell *matCellDef="let element" [attr.colspan]="displayedColumns.length">
                    <div class="element-detail" [@detailExpand]="element == expandedElement ? 'expanded' : 'collapsed'">
                        <div class="detail-container">
                            <div class="detail-grid">
                                <div class="detail-info">
                                    <p><strong>Precio Compra USD:</strong> $ {{element.pricebuy | number:settingsService.getDecimalFormat('price')}}</p>
                                    <p><strong>Tipo:</strong> {{getTypeLabel(element.typeproduct)}}</p>
                                    <p><strong>Unidad:</strong> {{element.codeunit}}</p>
                                    <p><strong>Stock Actual:</strong> {{element.stock_current | number:'1.2-2'}}</p>
                                </div>
                                <div class="detail-info">
                                    <p><strong>Servicio:</strong> {{element.servicio ? 'Sí' : 'No'}}</p>
                                    <p><strong>Balanza:</strong> {{element.isscale ? 'Sí' : 'No'}}</p>
                                    <p><strong>Regulado:</strong> {{element.regulated ? 'Sí' : 'No'}}</p>
                                    <p><strong>Catálogo:</strong> {{element.incatalog ? 'Sí' : 'No'}}</p>
                                </div>
                                <div class="detail-image" *ngIf="element.image">
                                    <img [src]="'data:image/png;base64,' + element.image" alt="Producto">
                                </div>
                            </div>
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

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" colspan="6">No hay productos que coincidan con los filtros</td>
            </tr>
          </table>
        </div>

        <mat-paginator 
          [length]="totalProducts"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50, 100]"
          (page)="onPageChange($event)"
          aria-label="Seleccionar página de productos">
        </mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 24px; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      h1 { margin: 0; }
    }
    .full-width { width: 100%; }
    .filter-card { margin-bottom: 24px; border-radius: 12px; }
    .filter-form { display: flex; flex-direction: column; gap: 8px; padding-top: 16px; }
    .filter-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
    .filter-row > mat-form-field { flex: 1; min-width: 150px; }
    .checkbox-group { display: flex; gap: 24px; flex: 2; padding: 0 16px; }
    .button-group { display: flex; gap: 12px; justify-content: flex-end; align-items: center; }
    
    .barcode-container {
      display: flex;
      align-items: center;
      background: #f0f2f5;
      border-radius: 8px;
      padding: 4px 12px;
      border: 1px solid #ddd;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      height: 50px;
      margin-bottom: 4px;
      flex: 1.5;
      min-width: 200px;
    }
    .barcode-container:focus-within {
      border-color: #6200ee;
      background: #fff;
      box-shadow: 0 0 0 2px rgba(98, 0, 238, 0.1);
    }
    .barcode-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #666;
      margin-right: 12px;
    }
    .barcode-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 1rem;
      color: #333;
    }

    .table-container { overflow-x: auto; }
    .element-row td { border-bottom-width: 0; cursor: pointer; }
    .element-row:hover { background: rgba(0,0,0,0.04); }
    .detail-row { height: 0; }
    .element-detail { overflow: hidden; display: flex; }
    .detail-container { width: 100%; padding: 20px; background: #fcfcfc; border-bottom: 1px solid #eee; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr 150px; gap: 20px; }
    .detail-info p { margin: 4px 0; }
    .detail-info strong { color: #666; margin-right: 8px; }
    .detail-image img { width: 120px; height: 120px; object-fit: contain; border-radius: 8px; border: 1px solid #eee; background: white; }
    .action-buttons-cell { display: flex; align-items: center; gap: 4px; }
  `]
})

export class ProductosComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  displayedColumns: string[] = ['code', 'name', 'category', 'pricesell', 'pricesellusd', 'actions'];
  expandedElement: Product | null = null;
  filterForm: FormGroup;
  @ViewChild('barcodeInput') barcodeInput!: any;

  totalProducts = 0;
  pageSize = 25;
  currentPage = 0;

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  public settingsService = inject(SettingsService);
  private exchange_rate: number = 0;
  private Currency!: Currency;
  private usdCurrency: Currency | null = null;
  private currencies: Currency[] = [];
  exchangeRate: number = 1;

  constructor(private SalesService: SalesService) {
    this.filterForm = this.fb.group({
      name: [''],
      category: ['all'],
      code: [''],
      typeproduct: [''],
      servicio: [''],
      isscale: [''],
      regulated: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();

    this.SalesService.getCurrencies().subscribe(currencies => {
      this.currencies = currencies;
      // Encontrar USD para la tasa alternativa
      this.usdCurrency = currencies.find(c => c.code === 'USD') || null;
      if (this.usdCurrency) {
        const decimals = this.settingsService.getSettings()?.price_decimals || 2;
        // Ensure it's a number before calling toFixed
        const rateValue = Number(this.usdCurrency.exchange_rate);
        this.exchangeRate = parseFloat(rateValue.toFixed(decimals));
        //console.log(this.exchangeRate);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.productService.getById(+params['id']).subscribe((product: Product) => {
          this.openForm(product);
        });
      }
    });
    // Focus barcode on start
    setTimeout(() => this.focusBarcode(), 500);
  }

  focusBarcode() {
    if (this.barcodeInput) {
      this.barcodeInput.nativeElement.focus();
    }
  }

  loadCategories(): void {
    this.categoryService.getAll(1, 1000).subscribe(res => this.categories = res.data);
  }

  loadProducts(): void {
    const page = this.currentPage + 1;
    const filters = this.filterForm.value;
    const activeFilters = { ...filters };
    if (activeFilters.category === 'all') delete activeFilters.category;

    this.productService.getAll(page, this.pageSize, activeFilters).subscribe({
      next: (response: any) => {
        this.products = response.data;
        this.totalProducts = response.total;
      },
      error: (err: any) => console.error('Error cargando productos', err)
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadProducts();
    this.focusBarcode();
  }

  clearFilters(): void {
    this.filterForm.reset({
      category: 'all',
      typeproduct: '',
      servicio: '',
      isscale: '',
      regulated: ''
    });
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  toggleExpand(element: Product, event: MouseEvent): void {
    event.stopPropagation();
    this.expandedElement = this.expandedElement === element ? null : element;
  }

  openForm(product?: Product): void {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (product) {
          this.productService.update(product.id, result).subscribe({
            next: () => {
              this.showSuccess('Producto actualizado');
              this.loadProducts();
            },
            error: (err) => this.showError('Error al actualizar: ' + err.error?.error)
          });
        } else {
          this.productService.create(result).subscribe({
            next: () => {
              this.showSuccess('Producto creado');
              this.loadProducts();
            },
            error: (err) => this.showError('Error al crear: ' + err.error?.error)
          });
        }
      }
    });
  }

  deleteProduct(product: Product): void {
    if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
      this.productService.delete(product.id).subscribe({
        next: () => {
          this.showSuccess('Producto eliminado');
          this.loadProducts();
        },
        error: (err) => this.showError('Error al eliminar: ' + err.error?.error)
      });
    }
  }

  openPriceDialog(product: Product): void {
    const dialogRef = this.dialog.open(PriceChangeDialogComponent, {
      width: '500px',
      data: {
        productId: product.id,
        productName: product.name,
        currentPrice: product.pricesell
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('Precio actualizado correctamente');
        this.loadProducts();
      }
    });
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'SI': return 'Estándar';
      case 'CO': return 'Compuesto';
      case 'IN': return 'Insumo';
      case 'KI': return 'Kit/Combo';
      default: return type;
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
