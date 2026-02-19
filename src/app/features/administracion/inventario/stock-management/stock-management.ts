import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../../../core/services/settings.service';
import { AppConfigService } from '../../../../core/services/app-config.service';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { StockService, MovementReason } from '../../../../core/services/stock.service';
import { WarehouseService } from '../../../../core/services/warehouse.service';
import { Warehouse } from '../../../../core/models/warehouse.model';
import { ProductSelectorComponent } from '../stock-movements/components/product-selector/product-selector';
import { ProductService, Product } from '../../../../core/services/product.service';
import { MoneyInputDirective } from '../../../../shared/directives/money-input.directive';

interface StockMovementLine {
    product: Product;
    units: number;
    price: number;
    subtotal: number;
}

@Component({
    selector: 'app-stock-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatTableModule,
        MatCardModule,
        MatDialogModule,
        MatTooltipModule,
        MatSnackBarModule,
        MoneyInputDirective
    ],
    template: `
    <div class="container">
      <h2>Gestión de Inventario (Movimientos Masivos)</h2>
      
      <mat-card class="header-card">
        <mat-card-content>
          <form [formGroup]="headerForm" class="header-form">
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Fecha</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" required>
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Almacén</mat-label>
                <mat-select formControlName="location" required>
                  <mat-option *ngFor="let loc of locations" [value]="loc.id">
                    {{ loc.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="reason-field">
                <mat-label>Tipo de Movimiento</mat-label>
                <mat-select formControlName="reason" required (selectionChange)="onReasonChange()">
                  <mat-option *ngFor="let r of reasons" [value]="r">
                    {{ r.name }} ({{ r.sign > 0 ? 'Entrada' : 'Salida' }})
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="input-card">
        <mat-card-content>
            <div class="input-row">
                <div class="barcode-container">
                    <mat-icon class="barcode-icon">qr_code_scanner</mat-icon>
                    <input #barcodeInput type="text" [(ngModel)]="barcode" (ngModelChange)="onBarcodeChange($event)" (keyup.enter)="onBarcodeEnter($event)"
                        placeholder="Escanear..." class="barcode-input">
                </div>

                <button mat-raised-button color="primary" (click)="openProductSelector()" type="button">
                    <mat-icon>search</mat-icon> Buscar Producto
                </button>
                
                <div class="info-text" *ngIf="!currentProduct">
                    Seleccione un producto para agregar
                </div>
                
                <ng-container *ngIf="currentProduct">
                    <div class="product-summary">
                        <strong>{{ currentProduct.name }}</strong> ({{ currentProduct.reference }})
                        <br>
                        Precio: {{ currentPrice | currency:'USD':'$ ':settingsService.getDecimalFormat('price') }}
                    </div>

                    <mat-form-field appearance="outline" class="small-field">
                        <mat-label>Unidades</mat-label>
                        <input matInput type="text" [(ngModel)]="currentUnits" appMoneyInput decimalType="quantity">
                    </mat-form-field>
                    
                     <mat-form-field appearance="outline" class="small-field">
                        <mat-label>Precio</mat-label>
                        <input matInput type="text" [(ngModel)]="currentPrice" appMoneyInput decimalType="price">
                    </mat-form-field>

                    <button mat-mini-fab color="accent" (click)="addLine()" [disabled]="currentUnits <= 0" matTooltip="Agregar línea">
                        <mat-icon>add</mat-icon>
                    </button>
                </ng-container>
            </div>
        </mat-card-content>
      </mat-card>

      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="lines">
            
            <!-- Product Column -->
            <ng-container matColumnDef="product">
                <th mat-header-cell *matHeaderCellDef> Producto </th>
                <td mat-cell *matCellDef="let element"> {{element.product.name}} </td>
            </ng-container>

            <!-- Units Column -->
            <ng-container matColumnDef="units">
                <th mat-header-cell *matHeaderCellDef> Unidades </th>
                <td mat-cell *matCellDef="let element"> {{element.units | number:settingsService.getDecimalFormat('quantity')}} </td>
            </ng-container>

             <!-- Price Column -->
             <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef> Precio </th>
                <td mat-cell *matCellDef="let element"> {{element.price | currency:'USD':'$ ':settingsService.getDecimalFormat('price')}} </td>
            </ng-container>

             <!-- Subtotal Column -->
             <ng-container matColumnDef="subtotal">
                <th mat-header-cell *matHeaderCellDef> Subtotal </th>
                <td mat-cell *matCellDef="let element"> {{element.subtotal | currency:'USD':'$ ':settingsService.getDecimalFormat('total')}} </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> </th>
                <td mat-cell *matCellDef="let element; let i = index">
                    <button mat-icon-button color="warn" (click)="removeLine(i)">
                        <mat-icon>delete</mat-icon>
                    </button>
                </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <div class="empty-state" *ngIf="lines.length === 0">
            No hay productos en la lista
        </div>
      </div>

           <div class="footer-actions">
           <div class="totals">
               Total Unidades: {{ getTotalUnits() | number:settingsService.getDecimalFormat('quantity') }} | Importe Total: {{ getTotalAmount() | currency:'USD':'$ ':settingsService.getDecimalFormat('total') }}
           </div>
           <button mat-raised-button color="primary" size="large" (click)="saveEverything()" [disabled]="lines.length === 0 || headerForm.invalid">
               <mat-icon>save</mat-icon> GUARDAR MOVIMIENTOS
           </button>
      </div>

    </div>
  `,
    styles: [`
    .container { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
    .header-card, .input-card { padding: 10px; }
    .row { display: flex; gap: 20px; flex-wrap: wrap; }
    .reason-field { flex-grow: 1; }
    
    .input-row { display: flex; align-items: center; gap: 20px; }
    .info-text { color: #888; font-style: italic; }
    .product-summary { background: #e0f7fa; padding: 5px 10px; border-radius: 4px; border: 1px solid #4dd0e1; }
    .small-field { width: 100px; }
    
    .table-container { max-height: 400px; overflow: auto; background: white; }
    .empty-state { padding: 20px; text-align: center; color: #999; }
    
    .footer-actions { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: white; border-top: 1px solid #eee; position: sticky; bottom: 0; }
    .totals { font-weight: bold; font-size: 1.1em; }

    .barcode-container {
      display: flex;
      align-items: center;
      background: #f0f2f5;
      border-radius: 8px;
      padding: 4px 12px;
      border: 1px solid #ddd;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      width: 200px;
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
      font-size: 0.9rem;
      color: #333;
    }
  `]
})
export class StockManagementComponent implements OnInit {
    headerForm: FormGroup;
    locations: Warehouse[] = [];
    reasons = MovementReason.getAll();
    lines: StockMovementLine[] = [];
    displayedColumns: string[] = ['product', 'units', 'price', 'subtotal', 'actions'];

    // Input state
    currentProduct: Product | null = null;
    currentUnits: number = 1;
    currentPrice: number = 0;
    barcode: string = '';
    @ViewChild('barcodeInput') barcodeInput!: ElementRef;
    private barcodeSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    private fb = inject(FormBuilder);
    private stockService = inject(StockService);
    private productService = inject(ProductService);
    private warehouseService = inject(WarehouseService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    public settingsService = inject(SettingsService);
    private configService = inject(AppConfigService);

    constructor() {
        this.headerForm = this.fb.group({
            date: [new Date(), Validators.required],
            location: [null, Validators.required],
            reason: [this.reasons[0], Validators.required] // Default IN_PURCHASE
        });
    }

    ngOnInit(): void {
        this.warehouseService.getAll().subscribe({
            next: (locs: Warehouse[]) => {
                console.log('Warehouses loaded in StockManagement:', locs?.length);
                this.locations = locs || [];

                if (this.locations.length > 0 && !this.headerForm.get('location')?.value) {
                    this.headerForm.patchValue({ location: this.locations[0].id });
                }
            },
            error: (err) => {
                console.error('Error loading warehouses in StockManagement:', err);
                this.snackBar.open('Error al cargar almacenes', 'Cerrar', { duration: 5000 });
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
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onReasonChange() {
        // Maybe clear table or re-calculate prices if needed?
        // For now, keep table but maybe warn user
        if (this.currentProduct) {
            this.updateSuggestedPrice();
        }
    }

    openProductSelector() {
        const dialogRef = this.dialog.open(ProductSelectorComponent, {
            width: '90%',
            maxWidth: '1100px',
            height: '85%',
            data: { locationId: this.headerForm.get('location')?.value }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // VALIDACIÓN: No permitir Kits, Compuestos o Servicios
                const isRestricted = result.typeproduct === 'KI' || result.typeproduct === 'CO' || !!(result.servicio && result.servicio !== '0' && result.servicio !== false);
                if (isRestricted) {
                    this.snackBar.open(`No se permite gestionar stock para este tipo de producto (Kit, Compuesto o Servicio)`, 'Cerrar', { duration: 4000 });
                    return;
                }
                this.currentProduct = result;
                this.currentUnits = 1;
                this.updateSuggestedPrice();
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
                const product = res.data.find((p: any) => p.code === code || p.reference === code) || res.data[0];
                if (product.code === code || product.reference === code) {
                    // VALIDACIÓN: No permitir Kits, Compuestos o Servicios
                    const isRestricted = product.typeproduct === 'KI' || product.typeproduct === 'CO' || !!(product.servicio && product.servicio !== '0' && product.servicio !== false);
                    if (isRestricted) {
                        this.snackBar.open(`No se permite gestionar stock para "${product.name}" (Kit, Compuesto o Servicio)`, 'Cerrar', { duration: 4000 });
                        this.barcode = '';
                        return;
                    }
                    this.currentProduct = product;
                    this.currentUnits = 1;
                    this.updateSuggestedPrice();
                    this.barcode = '';
                    this.snackBar.open(`Producto: ${product.name}`, 'OK', { duration: 1500 });
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

    updateSuggestedPrice() {
        if (!this.currentProduct) return;
        const reason = this.headerForm.get('reason')?.value;

        // Basic logic: Purchase/Refund -> Buy Price, Sale/Out -> Sell Price
        if (reason.key === MovementReason.IN_PURCHASE.key ||
            reason.key === MovementReason.OUT_REFUND.key ||
            reason.key === MovementReason.OUT_BREAK.key ||
            reason.key === MovementReason.OUT_CONSUMPTION.key) {
            this.currentPrice = this.currentProduct.pricebuy;
        } else {
            this.currentPrice = this.currentProduct.pricesell;
        }
    }

    addLine() {
        if (this.currentProduct && this.currentUnits > 0) {
            const line: StockMovementLine = {
                product: this.currentProduct,
                units: this.currentUnits,
                price: this.currentPrice,
                subtotal: this.currentUnits * this.currentPrice
            };

            this.lines = [...this.lines, line]; // Immutable update for table datasource

            // Reset input
            this.currentProduct = null;
            this.currentUnits = 1;
            this.currentPrice = 0;
        }
    }

    removeLine(index: number) {
        this.lines.splice(index, 1);
        this.lines = [...this.lines]; // Trigger update
    }

    getTotalUnits() {
        return this.lines.reduce((acc, line) => acc + line.units, 0);
    }

    getTotalAmount() {
        return this.lines.reduce((acc, line) => acc + (line.units * line.price), 0);
    }

    saveEverything() {
        if (this.headerForm.invalid || this.lines.length === 0) return;

        const header = this.headerForm.value;
        const reason = header.reason;

        const payload = {
            date: header.date,
            location: header.location,
            reason: reason.key,
            lines: this.lines.map(l => ({
                product: l.product.id,
                units: l.units * reason.sign, // Apply sign here!
                price: l.price,
                attributesetinstance_id: null // Future support
            }))
        };

        this.stockService.createBulkMovement(payload).subscribe({
            next: (res: any) => {
                this.snackBar.open('Movimientos guardados correctamente', 'Cerrar', { duration: 3000 });
                this.lines = [];
                // Keep header or reset? Usually keep for next batch
            },
            error: (err: any) => {
                console.error(err);
                this.snackBar.open('Error al guardar: ' + err.message, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
