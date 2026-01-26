import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProductKitService } from '../../../../core/services/product-kit.service';
import { KitComponent } from '../../../../core/services/product-kit.model';

@Component({
  selector: 'app-product-kit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.component ? 'Editar' : 'Agregar' }} Componente</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-container">
          <!-- Componente -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Producto Componente</mat-label>
            <mat-select formControlName="component_id" [disabled]="!!data.component">
              <mat-option *ngFor="let prod of eligibleProducts" [value]="prod.id">
                {{ prod.name }} ({{ prod.reference }})
              </mat-option>
            </mat-select>
          </mat-form-field>

          <div class="row">
            <!-- Cantidad -->
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Cantidad</mat-label>
              <input matInput type="number" formControlName="quantity" min="0.0001">
            </mat-form-field>

            <!-- Obligatorio -->
            <div class="half-width checkbox-container">
               <mat-checkbox formControlName="is_mandatory">Obligatorio</mat-checkbox>
            </div>
          </div>

          <div class="group-header">
            <span>Flexibilidad (Opcional)</span>
            <small>Componentes en el mismo grupo son alternativas entre sí.</small>
          </div>

          <div class="row">
             <mat-form-field appearance="outline" class="half-width">
                <mat-label>ID de Grupo (Número)</mat-label>
                <input matInput type="number" formControlName="group_id" placeholder="Ej: 1">
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Nombre del Grupo</mat-label>
                <input matInput formControlName="group_name" placeholder="Ej: Bebidas">
              </mat-form-field>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Confirmar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-container { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .half-width { width: 50%; }
    .checkbox-container { display: flex; align-items: center; }
    .group-header { 
      margin-top: 16px; 
      padding: 8px; 
      background: #f5f5f5; 
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      span { font-weight: 500; font-size: 13px; }
      small { color: #666; font-size: 11px; }
    }
  `]
})
export class ProductKitDialogComponent implements OnInit {
  form: FormGroup;
  eligibleProducts: any[] = [];

  private fb = inject(FormBuilder);
  private kitService = inject(ProductKitService);
  public dialogRef = inject(MatDialogRef<ProductKitDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { kitId: number, component?: KitComponent }) {
    this.form = this.fb.group({
      component_id: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.0001)]],
      group_id: [null],
      group_name: [''],
      is_mandatory: [true]
    });
  }

  ngOnInit(): void {
    this.kitService.getEligibleComponents().subscribe(prods => {
      this.eligibleProducts = prods;
      if (this.data.component) {
        this.form.patchValue(this.data.component);
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      const selectedProd = this.eligibleProducts.find(p => p.id === formValue.component_id);

      this.dialogRef.close({
        ...formValue,
        component_name: selectedProd?.name,
        component_reference: selectedProd?.reference
      });
    }
  }
}
