import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';

import { Product } from '../../../../../../core/services/product.service';
import { Category, CategoryService } from '../../../../../../core/services/category.service';
import { Tax, TaxCategory, TaxService } from '../../../../../../core/services/tax.service';
import { SettingsService } from '../../../../../../core/services/settings.service';
import { Unit, UnitService } from '../../../../../../core/services/unit.service';
import { DiscountService } from '../../../../../../core/services/discount.service';
import { MoneyInputDirective } from '../../../../../../shared/directives/money-input.directive';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
    MatTabsModule,
    MoneyInputDirective
  ],
  template: `
    <h2 mat-dialog-title>{{ data.product ? 'Editar' : 'Nuevo' }} Producto</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <mat-tab-group>
          <!-- Pestaña General -->
          <mat-tab label="General">
            <div class="tab-content">
              <div class="row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Referencia</mat-label>
                  <input matInput formControlName="reference" required>
                  <mat-error *ngIf="form.get('reference')?.hasError('required')">Requerido</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Código de Barras</mat-label>
                  <input matInput formControlName="code" required>
                  <mat-error *ngIf="form.get('code')?.hasError('required')">Requerido</mat-error>
                </mat-form-field>
              </div>
              
              <div class="row">
                 <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Tipo Código</mat-label>
                  <mat-select formControlName="codetype">
                    <mat-option value="CODE128">CODE128</mat-option>
                    <mat-option value="EAN13">EAN13</mat-option>
                    <mat-option value="EAN8">EAN8</mat-option>
                    <mat-option value="UPC-A">UPC-A</mat-option>
                    <mat-option value="UPC-E">UPC-E</mat-option>
                  </mat-select>
                </mat-form-field>
                
                 <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Unidad</mat-label>
                   <mat-select formControlName="codeunit">
                    <mat-option *ngFor="let unit of units" [value]="unit.code">
                      {{ unit.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="name" required>
                <mat-error *ngIf="form.get('name')?.hasError('required')">Requerido</mat-error>
              </mat-form-field>

              <div class="row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Categoría</mat-label>
                  <mat-select formControlName="category" required>
                    <mat-option *ngFor="let cat of categories" [value]="cat.id">
                      {{ cat.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Impuesto</mat-label>
                  <mat-select formControlName="taxcat" required (selectionChange)="onTaxChange()">
                    <mat-option *ngFor="let tax of taxes" [value]="tax.category">
                      {{ tax.name }} ({{ tax.rate | percent }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>



              <div class="row" style="margin-top: 10px;">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Tipo Producto</mat-label>
                    <mat-select formControlName="typeproduct">
                      <mat-option value="SI">Estándar (Simple)</mat-option>
                      <mat-option value="CO">Compuesto</mat-option>
                      <mat-option value="IN">Insumo</mat-option>
                      <mat-option value="KI">Kit (Combo)</mat-option>
                    </mat-select>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="half-width">
                     <mat-label>Lista Descuento</mat-label>
                      <mat-select formControlName="discount">
                        <mat-option *ngFor="let dcat of discountCategories" [value]="dcat.id.toString()">
                          {{ dcat.name }}
                        </mat-option>
                      </mat-select>
                   </mat-form-field>
              </div>
              
              <div class="row">
                 <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Set de Atributos (ID)</mat-label>
                    <input matInput type="number" formControlName="attributeset_id">
                  </mat-form-field>
              </div>

              
            </div>
          </mat-tab>

          <!-- Pestaña Configuracion -->
          <mat-tab label="Configuración">
            <div class="tab-content">
              <div class="row checkboxes">
                 <mat-checkbox formControlName="iscom">Es Comprobable</mat-checkbox>
                 <mat-checkbox formControlName="incatalog">En Catálogo (TPV)</mat-checkbox>
                 <mat-checkbox formControlName="marketable">Comercializable</mat-checkbox>
                 <mat-checkbox formControlName="isscale">Usa Balanza</mat-checkbox>
              </div>
              <div class="row checkboxes">
                 <mat-checkbox formControlName="regulated">Regulado (Precios)</mat-checkbox>
                 <mat-checkbox formControlName="servicio">Es Servicio</mat-checkbox>
              </div>
            </div>
          </mat-tab>

          <!-- Pestaña Precios -->
          <mat-tab label="Precios">
            <div class="tab-content">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Precio de Compra</mat-label>
                <input matInput type="text" formControlName="pricebuy" appMoneyInput decimalType="price" (input)="onPriceBuyChange()">
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Margen (%)</mat-label>
                <input matInput type="text" formControlName="margin" appMoneyInput decimalType="price" (input)="onMarginChange()">
                <span matSuffix>%</span>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Precio de Venta (Base)</mat-label>
                <input matInput type="text" formControlName="pricesell" appMoneyInput decimalType="price" (input)="onPriceSellChange()">
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width readonly-field">
                <mat-label>Precio de Venta (Con Impuesto)</mat-label>
                <input matInput type="text" [value]="priceSellWithTax | number:settingsService.getDecimalFormat('price')" readonly>
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>
            </div>
          </mat-tab>

            <!-- Pestaña Stock (Inventario) -->
          <mat-tab label="Inventario">
            <div class="tab-content">
               <mat-form-field appearance="outline" class="full-width">
                <mat-label>Stock Costo</mat-label>
                <input matInput type="text" formControlName="stockcost" appMoneyInput decimalType="quantity">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Stock Volumen</mat-label>
                <input matInput type="text" formControlName="stockvolume" appMoneyInput decimalType="quantity">
              </mat-form-field>
              
               <mat-form-field appearance="outline" class="full-width readonly-field">
                <mat-label>Costo Promedio</mat-label>
                <input matInput type="text" [value]="form.get('averagecost')?.value | number:settingsService.getDecimalFormat('price')" readonly>
              </mat-form-field>
            </div>
          </mat-tab>

          <!-- Pestaña Multimedia (Imágenes) -->
          <mat-tab label="Imagen">
            <div class="tab-content centered-content">
               <div class="image-upload-container" (click)="fileInput.click()">
                 <div class="image-preview-large" *ngIf="imageBase64 || form.get('image')?.value; else noImage">
                    <img [src]="imageBase64 || form.get('image')?.value" alt="Producto">
                 </div>
                 <ng-template #noImage>
                    <div class="upload-placeholder">
                        <mat-icon>add_photo_alternate</mat-icon>
                        <span>Haga clic para subir imagen</span>
                    </div>
                 </ng-template>
                 <input #fileInput type="file" (change)="onFileSelected($event)" style="display: none" accept="image/*">
               </div>
               <div class="image-actions" *ngIf="imageBase64 || form.get('image')?.value">
                  <button mat-stroked-button color="warn" type="button" (click)="removeImage($event)">
                      <mat-icon>delete</mat-icon> Eliminar Imagen
                  </button>
                  <button mat-flat-button color="primary" type="button" (click)="fileInput.click()">
                      <mat-icon>edit</mat-icon> Cambiar
                  </button>
               </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-content {
      min-width: 500px;
      padding-top: 10px;
    }
    .tab-content {
      padding: 24px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .row {
      display: flex;
      gap: 16px;
    }
    .full-width {
      width: 100%;
    }
    .half-width {
      width: 50%;
    }
    .checkboxes {
        display: flex;
        gap: 20px;
        margin-top: 10px;
    }
    .centered-content {
        align-items: center;
        justify-content: center;
    }
    .image-upload-container {
        width: 100%;
        max-width: 300px;
        height: 300px;
        border: 2px dashed #ccc;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        background-color: #fafafa;
        overflow: hidden;
    }
    .image-upload-container:hover {
        border-color: #6200ee;
        background-color: #f0ebff;
    }
    .image-preview-large img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        max-height: 300px;
    }
    .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #888;
        gap: 8px;
    }
    .upload-placeholder mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
    }
    .image-actions {
        display: flex;
        gap: 16px;
        margin-top: 16px;
    }
    .readonly-field input {
        color: #666; 
    }
  `]
})
export class ProductFormComponent implements OnInit {
  form: FormGroup;
  categories: Category[] = [];
  taxCategories: TaxCategory[] = [];
  taxes: Tax[] = [];
  units: Unit[] = [];
  discountCategories: any[] = [];

  imageBase64: string | null = null;
  priceSellWithTax: number | null = null;
  selectedTaxRate: number = 0;

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private taxService = inject(TaxService);
  public settingsService = inject(SettingsService);
  private unitService = inject(UnitService);
  private discountService = inject(DiscountService);
  public dialogRef = inject(MatDialogRef<ProductFormComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { product?: Product }) {
    this.form = this.fb.group({
      reference: ['', Validators.required],
      code: ['', Validators.required],
      name: ['', Validators.required],
      pricebuy: [0, [Validators.min(0)]],
      pricesell: [0, [Validators.min(0)]],
      margin: [0],
      category: [null, Validators.required],
      taxcat: [1, Validators.required],
      stockcost: [0],
      stockvolume: [0],
      image: [null],
      iscom: [false],
      isscale: [false],
      incatalog: [true], // Default true or based on settings
      codetype: ['CODE128'],
      attributeset_id: [null],
      discount: ['001'],
      regulated: [false],
      servicio: [false],
      averagecost: [0],
      marketable: [true],
      codeunit: ['KG', Validators.required],
      typeproduct: ['SI']
    });
  }

  ngOnInit(): void {
    // Cargar dependencias
    this.categoryService.getAll(1, 1000).subscribe(res => this.categories = res.data);
    this.unitService.getAll().subscribe(res => this.units = res);
    this.discountService.getDiscountCategories().subscribe(res => this.discountCategories = res);

    this.settingsService.settings$.subscribe(settings => {
      if (settings) {
        this.calculatePriceWithTax();

        if (this.data.product) {
          // Usamos un pequeño delay para asegurar que las directivas se hayan registrado y suscrito a settings
          setTimeout(() => {
            if (this.data.product) {
              this.form.patchValue(this.data.product);

              if (this.data.product.image) {
                this.imageBase64 = `data:image/png;base64,${this.data.product.image}`;
              } else {
                this.imageBase64 = null;
              }

              this.calculateMarginFromPrices();
            }
          }, 0);
        }
      }
    });

    this.taxService.getTaxes().subscribe(res => {
      this.taxes = res;
      if (this.data.product) {
        this.onTaxChange();
      }
    });

    this.form.get('taxcat')?.valueChanges.subscribe(() => this.onTaxChange());
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageBase64 = reader.result as string;
        this.form.patchValue({ image: this.imageBase64 });
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.imageBase64 = null;
    this.form.patchValue({ image: null });
  }

  // --- Lógica de Precios ---

  onPriceBuyChange(): void {
    const buy = this.form.get('pricebuy')?.value || 0;
    const margin = this.form.get('margin')?.value || 0;
    const decimals = this.settingsService.getSettings()?.price_decimals || 2;

    const sell = buy * (1 + margin / 100);
    this.form.patchValue({ pricesell: parseFloat(sell.toFixed(decimals)) }, { emitEvent: false });

    this.calculatePriceWithTax();
  }

  onMarginChange(): void {
    const buy = this.form.get('pricebuy')?.value || 0;
    const margin = this.form.get('margin')?.value || 0;
    const decimals = this.settingsService.getSettings()?.price_decimals || 2;

    const sell = buy * (1 + margin / 100);
    this.form.patchValue({ pricesell: parseFloat(sell.toFixed(decimals)) }, { emitEvent: false });

    this.calculatePriceWithTax();
  }

  onPriceSellChange(): void {
    const buy = this.form.get('pricebuy')?.value || 0;
    const sell = this.form.get('pricesell')?.value || 0;
    const decimals = this.settingsService.getSettings()?.price_decimals || 2;

    if (buy > 0) {
      const margin = ((sell / buy) - 1) * 100;
      this.form.patchValue({ margin: parseFloat(margin.toFixed(decimals)) }, { emitEvent: false });
    }

    this.calculatePriceWithTax();
  }

  calculateMarginFromPrices(): void {
    const buy = this.form.get('pricebuy')?.value || 0;
    const sell = this.form.get('pricesell')?.value || 0;
    const decimals = this.settingsService.getSettings()?.price_decimals || 2;

    if (buy > 0) {
      const margin = ((sell / buy) - 1) * 100;
      this.form.patchValue({ margin: parseFloat(margin.toFixed(decimals)) }, { emitEvent: false });
    }
    this.onTaxChange();
  }

  onTaxChange(): void {
    const taxCatId = this.form.get('taxcat')?.value;
    if (taxCatId) {
      const tax = this.taxes.find(t => t.category === taxCatId);
      this.selectedTaxRate = tax ? tax.rate : 0;
    } else {
      this.selectedTaxRate = 0;
    }
    this.calculatePriceWithTax();
  }

  calculatePriceWithTax(): void {
    const sell = this.form.get('pricesell')?.value || 0;
    const total = sell * (1 + parseFloat(this.selectedTaxRate.toString()));
    const decimals = this.settingsService.getSettings()?.price_decimals || 2;
    this.priceSellWithTax = parseFloat(total.toFixed(decimals));
  }

  onSubmit(): void {
    if (this.form.valid) {
      const productData = { ...this.form.value };

      // Procesar imagen
      if (this.imageBase64) {
        const commaIdx = this.imageBase64.indexOf(',');
        if (commaIdx > -1) {
          productData.image = this.imageBase64.substring(commaIdx + 1);
        } else {
          productData.image = this.imageBase64;
        }
      } else {
        productData.image = null;
      }

      delete productData.margin;
      this.dialogRef.close(productData);
    }
  }
}
