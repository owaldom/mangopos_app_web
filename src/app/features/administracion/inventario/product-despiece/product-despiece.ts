import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { DespieceService, RelacionDespiece } from '../../../../core/services/despiece.service';
import { ProductService, Product } from '../../../../core/services/product.service';
import { StockService } from '../../../../core/services/stock.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { ProductSelectorComponent } from '../stock-movements/components/product-selector/product-selector';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface LocationInfo {
  id: number;
  name: string;
}

@Component({
  selector: 'app-product-despiece',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Despiece de Productos</h1>
      </div>

      <mat-tab-group>
        <!-- Tab 1: Configuración de Relaciones -->
        <mat-tab label="Configuración de Relaciones">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header>
                <mat-card-title>Nueva Relación de Despiece</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="relacionForm" (ngSubmit)="crearRelacion()" class="form-row">
                  <div class="product-field-group">
                    <mat-form-field appearance="outline" class="field-producto">
                      <mat-label>Producto Mayor (Origen)</mat-label>
                      <input matInput 
                             [matAutocomplete]="autoMayor"
                             formControlName="productoMayor"
                             placeholder="Buscar producto...">
                      <mat-autocomplete #autoMayor="matAutocomplete" 
                                        [displayWith]="displayProduct"
                                        (optionSelected)="onProductMayorSelected($event)">
                        @for (product of filteredProductsMayor; track product.id) {
                          <mat-option [value]="product">
                            {{ product.code }} - {{ product.name }}
                          </mat-option>
                        }
                      </mat-autocomplete>
                    </mat-form-field>
                    <button mat-icon-button color="primary" type="button" (click)="openProductSelectorMayor()" matTooltip="Buscar Producto">
                      <mat-icon>search</mat-icon>
                    </button>
                  </div>

                  <mat-icon class="arrow-icon">arrow_forward</mat-icon>

                  <div class="product-field-group">
                    <mat-form-field appearance="outline" class="field-producto">
                      <mat-label>Producto Menor (Destino)</mat-label>
                      <input matInput 
                             [matAutocomplete]="autoMenor"
                             formControlName="productoMenor"
                             placeholder="Buscar producto...">
                      <mat-autocomplete #autoMenor="matAutocomplete" 
                                        [displayWith]="displayProduct"
                                        (optionSelected)="onProductMenorSelected($event)">
                        @for (product of filteredProductsMenor; track product.id) {
                          <mat-option [value]="product">
                            {{ product.code }} - {{ product.name }}
                          </mat-option>
                        }
                      </mat-autocomplete>
                    </mat-form-field>
                    <button mat-icon-button color="primary" type="button" (click)="openProductSelectorMenor()" matTooltip="Buscar Producto">
                      <mat-icon>search</mat-icon>
                    </button>
                  </div>

                  <mat-form-field appearance="outline" class="field-factor">
                    <mat-label>Factor</mat-label>
                    <input matInput type="number" formControlName="relacion" min="1">
                    <mat-hint>Ej: 24 unidades por caja</mat-hint>
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit" 
                          [disabled]="!relacionForm.valid || !selectedProductMayor || !selectedProductMenor">
                    <mat-icon>add</mat-icon> Agregar
                  </button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card class="table-card">
              <mat-card-header>
                <mat-card-title>Relaciones Configuradas</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="dataSource">
                    <ng-container matColumnDef="productoMayor">
                      <th mat-header-cell *matHeaderCellDef>Producto Mayor</th>
                      <td mat-cell *matCellDef="let element">
                        <span class="product-name">{{ element.producto_mayor_name }}</span>
                        <span class="product-code">{{ element.producto_mayor_code }}</span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="productoMenor">
                      <th mat-header-cell *matHeaderCellDef>Producto Menor</th>
                      <td mat-cell *matCellDef="let element">
                        <span class="product-name">{{ element.producto_menor_name }}</span>
                        <span class="product-code">{{ element.producto_menor_code }}</span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="relacion">
                      <th mat-header-cell *matHeaderCellDef>Factor</th>
                      <td mat-cell *matCellDef="let element" class="factor-cell">
                        <strong>{{ element.relacion }}</strong>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let element">
                        <button mat-icon-button color="warn" (click)="eliminarRelacion(element)" matTooltip="Eliminar">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
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
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: Ejecutar Despiece -->
        <mat-tab label="Ejecutar Despiece">
          <div class="tab-content">
            <mat-card class="ejecutar-card">
              <mat-card-header>
                <mat-card-title>Ejecutar Despiece</mat-card-title>
                <mat-card-subtitle>Seleccione el producto a despiezar y la cantidad</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="ejecutarForm" (ngSubmit)="ejecutarDespiece()" class="ejecutar-form">
                  <div class="form-section">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Almacén</mat-label>
                      <mat-select formControlName="location">
                        @for (loc of locations; track loc.id) {
                          <mat-option [value]="loc.id">{{ loc.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <mat-divider></mat-divider>

                  <div class="form-section">
                    <div class="product-field-group ejecutar-group">
                      <mat-form-field appearance="outline" class="field-producto-ejecutar">
                        <mat-label>Producto Mayor (a despiezar)</mat-label>
                        <input matInput 
                               [matAutocomplete]="autoEjecutar"
                               formControlName="productoMayor"
                               placeholder="Buscar por código o nombre...">
                        <mat-autocomplete #autoEjecutar="matAutocomplete" 
                                          [displayWith]="displayProduct"
                                          (optionSelected)="onProductEjecutarSelected($event)">
                          @for (product of filteredProductsEjecutar; track product.id) {
                            <mat-option [value]="product">
                              {{ product.code }} - {{ product.name }}
                            </mat-option>
                          }
                        </mat-autocomplete>
                      </mat-form-field>
                      <button mat-raised-button color="primary" type="button" (click)="openProductSelectorEjecutar()">
                        <mat-icon>search</mat-icon> Buscar
                      </button>
                    </div>

                    @if (selectedProductEjecutar) {
                      <div class="stock-info">
                        <mat-icon>inventory</mat-icon>
                        <span>Stock disponible: <strong>{{ stockDisponible | number:'1.2-2' }}</strong></span>
                      </div>
                    }
                  </div>

                  @if (despiecesDisponibles.length > 0) {
                    <div class="form-section">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Producto Menor (resultado)</mat-label>
                        <mat-select formControlName="productoMenor" (selectionChange)="onProductMenorEjecutarChange($event)">
                          @for (dp of despiecesDisponibles; track dp.id) {
                            <mat-option [value]="dp.idproductmenor">
                              {{ dp.producto_menor_name }} (Factor: {{ dp.relacion }})
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>

                      @if (factorActual > 0) {
                        <div class="factor-info">
                          <mat-icon>transform</mat-icon>
                          <span>Factor de conversión: <strong>{{ factorActual }}</strong> unidades por producto mayor</span>
                        </div>
                      }
                    </div>

                    <div class="form-section">
                      <mat-form-field appearance="outline" class="field-cantidad">
                        <mat-label>Cantidad a despiezar</mat-label>
                        <input matInput type="number" formControlName="cantidad" min="1" 
                               (input)="calcularResultado()">
                      </mat-form-field>

                      @if (unidadesResultantes > 0) {
                        <div class="resultado-info">
                          <mat-icon>output</mat-icon>
                          <span>Unidades a generar: <strong class="resultado-cantidad">{{ unidadesResultantes | number:'1.2-2' }}</strong></span>
                        </div>
                      }
                    </div>
                  }

                  @if (selectedProductEjecutar && despiecesDisponibles.length === 0) {
                    <div class="no-despieces">
                      <mat-icon>warning</mat-icon>
                      <span>Este producto no tiene relaciones de despiece configuradas</span>
                    </div>
                  }

                  <div class="actions">
                    <button mat-flat-button color="primary" type="submit" 
                            [disabled]="!ejecutarForm.valid || unidadesResultantes === 0">
                      <mat-icon>call_split</mat-icon> Ejecutar Despiece
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .header { margin-bottom: 20px; }
    .header h1 { margin: 0; color: #333; }
    
    .tab-content { padding: 20px 0; }
    
    .form-card, .table-card, .ejecutar-card { margin-bottom: 20px; }
    
    .form-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .field-producto { flex: 1; min-width: 200px; }
    .field-factor { width: 120px; }
    
    .arrow-icon { color: #666; }
    
    .table-container { overflow-x: auto; }
    
    .product-name { display: block; font-weight: 500; }
    .product-code { display: block; font-size: 0.8em; color: #666; }
    
    .factor-cell { font-size: 1.1em; }
    
    .ejecutar-form { max-width: 600px; }
    
    .form-section { margin: 20px 0; }
    
    .full-width { width: 100%; }
    .field-cantidad { width: 200px; }
    
    .stock-info, .factor-info, .resultado-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 8px;
      margin-top: 8px;
    }
    
    .factor-info {
      background: #fff3e0;
    }
    
    .resultado-info {
      background: #e8f5e9;
    }
    
    .resultado-cantidad {
      font-size: 1.3em;
      color: #2e7d32;
    }
    
    .no-despieces {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #fff8e1;
      border-radius: 8px;
      color: #f57c00;
    }
    
    .actions {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
    }
    
    mat-divider { margin: 20px 0; }
    
    .product-field-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .ejecutar-group {
      width: 100%;
    }
    
    .field-producto-ejecutar {
      flex: 1;
    }
  `]
})
export class ProductDespieceComponent implements OnInit {
  displayedColumns: string[] = ['productoMayor', 'productoMenor', 'relacion', 'acciones'];
  dataSource = new MatTableDataSource<RelacionDespiece>([]);
  totalElements = 0;
  pageSize = 20;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Services
  private despieceService = inject(DespieceService);
  private productService = inject(ProductService);
  private stockService = inject(StockService);
  private settingsService = inject(SettingsService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Forms
  relacionForm!: FormGroup;
  ejecutarForm!: FormGroup;

  // Autocomplete products
  filteredProductsMayor: Product[] = [];
  filteredProductsMenor: Product[] = [];
  filteredProductsEjecutar: Product[] = [];

  // Selected products
  selectedProductMayor: Product | null = null;
  selectedProductMenor: Product | null = null;
  selectedProductEjecutar: Product | null = null;

  // Locations
  locations: LocationInfo[] = [];

  // Ejecutar despiece
  despiecesDisponibles: RelacionDespiece[] = [];
  stockDisponible = 0;
  factorActual = 0;
  unidadesResultantes = 0;

  // Search subjects
  private searchMayor$ = new Subject<string>();
  private searchMenor$ = new Subject<string>();
  private searchEjecutar$ = new Subject<string>();

  ngOnInit(): void {
    this.initForms();
    this.loadRelaciones(1);
    this.loadLocations();
    this.setupAutocomplete();
  }

  initForms(): void {
    this.relacionForm = this.fb.group({
      productoMayor: [''],
      productoMenor: [''],
      relacion: [1, [Validators.required, Validators.min(1)]]
    });

    this.ejecutarForm = this.fb.group({
      location: ['', Validators.required],
      productoMayor: [''],
      productoMenor: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
  }

  setupAutocomplete(): void {
    // Búsqueda producto mayor (configuración)
    this.relacionForm.get('productoMayor')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => typeof value === 'string' && value.length >= 2)
    ).subscribe(value => {
      this.productService.getAll(1, 10, { search: value }).subscribe(res => {
        this.filteredProductsMayor = res.data;
      });
    });

    // Búsqueda producto menor (configuración)
    this.relacionForm.get('productoMenor')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => typeof value === 'string' && value.length >= 2)
    ).subscribe(value => {
      this.productService.getAll(1, 10, { search: value }).subscribe(res => {
        this.filteredProductsMenor = res.data;
      });
    });

    // Búsqueda producto (ejecutar)
    this.ejecutarForm.get('productoMayor')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => typeof value === 'string' && value.length >= 2)
    ).subscribe(value => {
      this.productService.getAll(1, 10, { search: value }).subscribe(res => {
        this.filteredProductsEjecutar = res.data;
      });
    });
  }

  loadRelaciones(page: number): void {
    this.despieceService.getRelaciones(page, this.pageSize).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.totalElements = res.total;
      },
      error: (err) => this.showError('Error al cargar relaciones')
    });
  }

  loadLocations(): void {
    this.stockService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        if (locations.length > 0) {
          this.ejecutarForm.patchValue({ location: locations[0].id });
        }
      },
      error: () => this.showError('Error al cargar almacenes')
    });
  }

  onPageChange(event: any): void {
    this.loadRelaciones(event.pageIndex + 1);
  }

  displayProduct(product: Product): string {
    return product ? `${product.code} - ${product.name}` : '';
  }

  onProductMayorSelected(event: any): void {
    const product = event.option.value;
    const isRestricted = product.typeproduct === 'KI' || product.typeproduct === 'CO' || !!(product.servicio && product.servicio !== '0' && product.servicio !== false);

    if (isRestricted) {
      this.snackBar.open(`No se permite despiece para este tipo de producto (Kit, Compuesto o Servicio)`, 'Cerrar', { duration: 4000 });
      this.selectedProductMayor = null;
      this.relacionForm.patchValue({ productoMayor: '' });
      return;
    }

    this.selectedProductMayor = product;
  }

  onProductMenorSelected(event: any): void {
    this.selectedProductMenor = event.option.value;
  }

  // Dialog openers for product selection
  openProductSelectorMayor(): void {
    const dialogRef = this.dialog.open(ProductSelectorComponent, {
      width: '90%',
      maxWidth: '1000px',
      height: '80%'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const isRestricted = result.typeproduct === 'KI' || result.typeproduct === 'CO' || !!(result.servicio && result.servicio !== '0' && result.servicio !== false);

        if (isRestricted) {
          this.snackBar.open(`No se permite despiece para este tipo de producto (Kit, Compuesto o Servicio)`, 'Cerrar', { duration: 4000 });
          return;
        }

        this.selectedProductMayor = result;
        this.relacionForm.patchValue({ productoMayor: result });
      }
    });
  }

  openProductSelectorMenor(): void {
    const dialogRef = this.dialog.open(ProductSelectorComponent, {
      width: '90%',
      maxWidth: '1000px',
      height: '80%'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedProductMenor = result;
        this.relacionForm.patchValue({ productoMenor: result });
      }
    });
  }

  openProductSelectorEjecutar(): void {
    const dialogRef = this.dialog.open(ProductSelectorComponent, {
      width: '90%',
      maxWidth: '1000px',
      height: '80%'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const isRestricted = result.typeproduct === 'KI' || result.typeproduct === 'CO' || !!(result.servicio && result.servicio !== '0' && result.servicio !== false);

        if (isRestricted) {
          this.snackBar.open(`No se permite despiece para este tipo de producto (Kit, Compuesto o Servicio)`, 'Cerrar', { duration: 4000 });
          return;
        }

        this.selectedProductEjecutar = result;
        this.ejecutarForm.patchValue({ productoMayor: result });
        this.loadDespiecesDisponibles();
        this.loadStockDisponible();
      }
    });
  }

  onProductEjecutarSelected(event: any): void {
    const product = event.option.value;
    const isRestricted = product.typeproduct === 'KI' || product.typeproduct === 'CO' || !!(product.servicio && product.servicio !== '0' && product.servicio !== false);

    if (isRestricted) {
      this.snackBar.open(`No se permite despiece para este tipo de producto (Kit, Compuesto o Servicio)`, 'Cerrar', { duration: 4000 });
      this.selectedProductEjecutar = null;
      this.ejecutarForm.patchValue({ productoMayor: '' });
      return;
    }

    this.selectedProductEjecutar = product;
    this.loadDespiecesDisponibles();
    this.loadStockDisponible();
  }

  loadDespiecesDisponibles(): void {
    if (!this.selectedProductEjecutar) return;

    this.despieceService.getRelacionesByProduct(this.selectedProductEjecutar.id).subscribe({
      next: (despieces) => {
        this.despiecesDisponibles = despieces;
        if (despieces.length > 0) {
          this.ejecutarForm.patchValue({ productoMenor: despieces[0].idproductmenor });
          this.factorActual = despieces[0].relacion;
          this.calcularResultado();
        }
      },
      error: () => this.showError('Error al cargar despieces disponibles')
    });
  }

  loadStockDisponible(): void {
    if (!this.selectedProductEjecutar) return;

    const locationId = this.ejecutarForm.get('location')?.value;
    if (!locationId) return;

    this.stockService.getProductStock(String(this.selectedProductEjecutar.id)).subscribe({
      next: (stocks) => {
        const stockEnLocation = stocks.find((s: any) => s.location_name);
        this.stockDisponible = stocks.reduce((acc: number, s: any) => acc + parseFloat(s.units), 0);
      },
      error: () => this.stockDisponible = 0
    });
  }

  onProductMenorEjecutarChange(event: any): void {
    const despiece = this.despiecesDisponibles.find(d => d.idproductmenor === event.value);
    if (despiece) {
      this.factorActual = despiece.relacion;
      this.calcularResultado();
    }
  }

  calcularResultado(): void {
    const cantidad = this.ejecutarForm.get('cantidad')?.value || 0;
    this.unidadesResultantes = cantidad * this.factorActual;
  }

  crearRelacion(): void {
    if (!this.selectedProductMayor || !this.selectedProductMenor) {
      this.showError('Seleccione ambos productos');
      return;
    }

    const data = {
      idproductmayor: this.selectedProductMayor.id,
      idproductmenor: this.selectedProductMenor.id,
      relacion: this.relacionForm.get('relacion')?.value
    };

    this.despieceService.createRelacion(data).subscribe({
      next: () => {
        this.showSuccess('Relación creada correctamente');
        this.loadRelaciones(1);
        this.relacionForm.reset({ relacion: 1 });
        this.selectedProductMayor = null;
        this.selectedProductMenor = null;
      },
      error: (err) => this.showError(err.error?.error || 'Error al crear relación')
    });
  }

  eliminarRelacion(relacion: RelacionDespiece): void {
    if (confirm(`¿Eliminar la relación ${relacion.producto_mayor_name} → ${relacion.producto_menor_name}?`)) {
      this.despieceService.deleteRelacion(relacion.id).subscribe({
        next: () => {
          this.showSuccess('Relación eliminada');
          this.loadRelaciones(1);
        },
        error: () => this.showError('Error al eliminar relación')
      });
    }
  }

  ejecutarDespiece(): void {
    if (!this.selectedProductEjecutar) return;

    const cantidad = this.ejecutarForm.get('cantidad')?.value;

    if (cantidad > this.stockDisponible) {
      this.showError(`Stock insuficiente. Disponible: ${this.stockDisponible}`);
      return;
    }

    const data = {
      idproductmayor: this.selectedProductEjecutar.id,
      idproductmenor: this.ejecutarForm.get('productoMenor')?.value,
      cantidad: cantidad,
      location: this.ejecutarForm.get('location')?.value
    };

    this.despieceService.ejecutarDespiece(data).subscribe({
      next: (result) => {
        this.showSuccess(`Despiece ejecutado: ${result.unidadesGeneradas} unidades generadas`);
        this.loadStockDisponible();
        this.ejecutarForm.patchValue({ cantidad: 1 });
        this.calcularResultado();
      },
      error: (err) => this.showError(err.error?.error || 'Error al ejecutar despiece')
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
