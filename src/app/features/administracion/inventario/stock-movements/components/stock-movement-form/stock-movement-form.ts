import { Component, inject, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

import { StockService, MovementReason, LocationInfo } from '../../../../../../core/services/stock.service';
import { SettingsService } from '../../../../../../core/services/settings.service';
import { ProductService, Product } from '../../../../../../core/services/product.service';
import { ProductSelectorComponent } from '../product-selector/product-selector';
import { MoneyInputDirective } from '../../../../../../shared/directives/money-input.directive';
import { AppConfigService } from '../../../../../../core/services/app-config.service';

@Component({
  selector: 'app-stock-movement-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MoneyInputDirective
  ],
  template: `
    <h2 mat-dialog-title>Nuevo Movimiento de Stock</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        
        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Fecha</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date" required>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Almacén</mat-label>
            <mat-select formControlName="location" required>
              <mat-option *ngFor="let loc of locations" [value]="loc.id">
                {{ loc.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de Movimiento</mat-label>
            <mat-select formControlName="reason" required (selectionChange)="onReasonChange()">
              <mat-option *ngFor="let r of reasons" [value]="r">
                {{ r.name }} ({{ r.sign > 0 ? 'Entrada' : 'Salida' }})
              </mat-option>
            </mat-select>
        </mat-form-field>

        <div class="row full-width-field">
          <mat-form-field appearance="outline" class="flex-grow">
            <mat-label>Buscar Producto (Nombre o Código)</mat-label>
            <input type="text" matInput formControlName="productSearch" [matAutocomplete]="auto">
            <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayProduct" (optionSelected)="onProductSelected($event)">
              <mat-option *ngFor="let prod of filteredProducts" [value]="prod">
                {{ prod.name }} ({{prod.reference}})
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>
          <div class="barcode-container">
            <mat-icon class="barcode-icon">qr_code_scanner</mat-icon>
            <input #barcodeInput type="text" [(ngModel)]="barcode" [ngModelOptions]="{standalone: true}" (ngModelChange)="onBarcodeChange($event)" (keyup.enter)="onBarcodeEnter($event)"
                placeholder="Escanea..." class="barcode-input">
          </div>
          <button mat-mini-fab color="primary" class="search-btn" type="button" (click)="openProductSelector()" matTooltip="Búsqueda avanzada">
             <mat-icon>search</mat-icon>
          </button>
        </div>

        <div class="product-info" *ngIf="selectedProduct">
            <p><strong>Producto: </strong> {{selectedProduct.name}}</p>
            <p><strong>Precio Compra / Venta: </strong> 
                {{selectedProduct.pricebuy | currency:'USD':'$ ':settingsService.getDecimalFormat('price')}} / 
                {{selectedProduct.pricesell | currency:'USD':'$ ':settingsService.getDecimalFormat('price')}}
            </p>
        </div>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Unidades</mat-label>
            <input matInput type="text" formControlName="units" required appMoneyInput decimalType="quantity">
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Precio (Unitario)</mat-label>
            <input matInput type="text" formControlName="price" required appMoneyInput decimalType="price">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
            <mat-label>Concepto / Notas</mat-label>
            <input matInput formControlName="concept">
        </mat-form-field>

      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || !selectedProduct">Registrar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-content { min-width: 1000px; display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
    .row { display: flex; gap: 16px; align-items: baseline; }
    .full-width { width: 100%; }
    .half-width { width: 50%; }
    .flex-grow { flex: 1; }
    .full-width-field { width: 100%; }
    .search-btn { margin-top: 4px; }
    .product-info { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 10px; }

    .barcode-container {
      display: flex;
      align-items: center;
      background: #f0f2f5;
      border-radius: 8px;
      padding: 4px 12px;
      border: 1px solid #ddd;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      width: 150px;
      height: 40px;
    }
    .barcode-container:focus-within {
      border-color: #6200ee;
      background: #fff;
    }
    .barcode-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #666;
      margin-right: 8px;
    }
    .barcode-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 0.85rem;
      color: #333;
    }
  `]
})
export class StockMovementFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  locations: LocationInfo[] = [];
  reasons = MovementReason.getAll();
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;

  private fb = inject(FormBuilder);
  private stockService = inject(StockService);
  private productService = inject(ProductService);
  public dialogRef = inject(MatDialogRef<StockMovementFormComponent>);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public settingsService = inject(SettingsService);
  private configService = inject(AppConfigService);

  barcode: string = '';
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;
  private barcodeSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.form = this.fb.group({
      date: [new Date(), Validators.required],
      location: [null, Validators.required], // Default to first location
      reason: [this.reasons[0], Validators.required],
      productSearch: [''],
      units: [1, [Validators.required, Validators.min(0.001)]],
      price: [0, Validators.required],
      concept: ['']
    });
  }

  ngOnInit(): void {
    this.stockService.getLocations().subscribe(locs => {
      const config = this.configService.getConfig();

      if (config?.installation_type === 'pos') {
        // In POS mode, only show the warehouse that matches the configured location name
        this.locations = locs.filter(l => l.name === config.location_name);
      } else {
        // In Factory mode, show only 'factory' type warehouses for stock movements
        this.locations = locs.filter(l => l.type === 'factory');
      }

      if (this.locations.length > 0) {
        this.form.patchValue({ location: this.locations[0].id });
      }
    });

    // Focus barcode on start
    setTimeout(() => this.focusBarcode(), 500);

    // Auto-search logic
    this.barcodeSubject.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(code => {
      if (code && code.length >= 3) {
        this.processBarcode(code);
      }
    });

    this.form.get('productSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length > 2) {
          return this.productService.getAll(1, 10, { search: value });
        } else {
          return of({ data: [] });
        }
      })
    ).subscribe((res: any) => {
      this.filteredProducts = res.data;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  displayProduct(product: Product): string {
    return product && product.name ? product.name : '';
  }

  onProductSelected(event: any): void {
    const product = event.option.value as any;
    // VALIDACIÓN: No permitir Kits, Compuestos o Servicios
    const isRestricted = product.typeproduct === 'KI' || product.typeproduct === 'CO' || !!(product.servicio && product.servicio !== '0' && product.servicio !== false);

    if (isRestricted) {
      this.snackBar.open(`No se permite gestionar stock para este tipo de producto (Kit, Compuesto o Servicio)`, 'Cerrar', { duration: 4000 });
      this.selectedProduct = null;
      this.form.patchValue({ productSearch: '' });
      return;
    }

    this.selectedProduct = product;
    // Auto-set price based on reason?
    this.updatePriceSuggestion();
  }

  openProductSelector(): void {
    const dialogRef = this.dialog.open(ProductSelectorComponent, {
      width: '1100px',
      height: '800px',
      maxWidth: '95vw',
      data: { locationId: this.form.get('location')?.value }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const prod = result as any;
        // VALIDACIÓN: No permitir Kits, Compuestos o Servicios
        const isRestricted = prod.typeproduct === 'KI' || prod.typeproduct === 'CO' || !!(prod.servicio && prod.servicio !== '0' && prod.servicio !== false);

        if (isRestricted) {
          this.snackBar.open(`No se permite gestionar stock para este tipo de producto (Kit, Compuesto o Servicio)`, 'Cerrar', { duration: 4000 });
          return;
        }

        this.selectedProduct = prod;
        this.form.patchValue({ productSearch: prod });
        this.updatePriceSuggestion();
      }
    });
  }

  onBarcodeEnter(event: any): void {
    const code = event.target.value?.trim();
    if (!code) {
      this.barcode = '';
      return;
    }
    this.processBarcode(code);
  }

  onBarcodeChange(value: string): void {
    const code = value?.trim();
    if (code) {
      this.barcodeSubject.next(code);
    }
  }

  processBarcode(code: string): void {
    this.productService.getAll(1, 1, { search: code }).subscribe((res: any) => {
      if (res.data && res.data.length > 0) {
        const product = (res.data.find((p: any) => p.code === code || p.reference === code) || res.data[0]) as any;
        if (product.code === code || product.reference === code) {
          // VALIDACIÓN: No permitir Kits, Compuestos o Servicios
          const isRestricted = product.typeproduct === 'KI' || product.typeproduct === 'CO' || !!(product.servicio && product.servicio !== '0' && product.servicio !== false);

          if (isRestricted) {
            this.snackBar.open(`No se permite gestionar stock para "${product.name}" (Kit, Compuesto o Servicio)`, 'Cerrar', { duration: 4000 });
            this.barcode = '';
            return;
          }

          this.selectedProduct = product;
          this.form.patchValue({ productSearch: product });
          this.updatePriceSuggestion();
          this.barcode = '';
        } else {
          this.barcode = '';
        }
      } else {
        this.barcode = '';
      }
    });
  }

  focusBarcode(): void {
    if (this.barcodeInput) {
      this.barcodeInput.nativeElement.focus();
    }
  }

  onReasonChange(): void {
    this.updatePriceSuggestion();
  }

  updatePriceSuggestion(): void {
    if (!this.selectedProduct) return;

    const reason = this.form.get('reason')?.value;
    let suggestion = 0;

    // Logic based on MovementReason.java 'getPrice'
    if (reason.key === MovementReason.IN_PURCHASE.key ||
      reason.key === MovementReason.OUT_REFUND.key || // Java: OUT_REFUND uses buy price? 
      reason.key === MovementReason.OUT_BREAK.key ||
      reason.key === MovementReason.OUT_CONSUMPTION.key) {
      suggestion = this.selectedProduct.pricebuy;
    } else {
      suggestion = this.selectedProduct.pricesell;
    }

    this.form.patchValue({ price: suggestion });
  }

  onSubmit(): void {
    if (this.form.valid && this.selectedProduct) {
      const formVal = this.form.value;
      const reason = formVal.reason;

      // Calculate signed units
      const signedUnits = formVal.units * reason.sign;

      const movementPayload = {
        date: formVal.date,
        location: formVal.location,
        reason: reason.key,
        product: this.selectedProduct.id,
        units: signedUnits,
        price: formVal.price,
        concept: formVal.concept
      };

      this.dialogRef.close(movementPayload);
    }
  }
}
