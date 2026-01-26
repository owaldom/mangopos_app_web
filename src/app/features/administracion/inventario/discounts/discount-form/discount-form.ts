import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { DiscountService, Discount } from '../../../../../core/services/discount.service';

@Component({
  selector: 'app-discount-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.discount ? 'Editar' : 'Nuevo' }} Descuento</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-container">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" placeholder="Ej. Descuento Verano">
            <mat-error *ngIf="form.get('name')?.hasError('required')">El nombre es requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Valor</mat-label>
            <input matInput type="number" formControlName="quantity">
            <mat-error *ngIf="form.get('quantity')?.hasError('required')">El valor es requerido</mat-error>
          </mat-form-field>

          <div class="radio-group">
            <label>Tipo de Descuento:</label>
            <mat-radio-group formControlName="percentage">
              <mat-radio-button [value]="true">Porcentaje (%)</mat-radio-button>
              <mat-radio-button [value]="false">Monto Fijo ($)</mat-radio-button>
            </mat-radio-group>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Categoría de Producto</mat-label>
            <mat-select formControlName="idcategory">
               <mat-option *ngFor="let cat of categories" [value]="cat.id">
                {{ cat.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('idcategory')?.hasError('required')">La categoría es requerida</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Categoría de Cliente (Opcional)</mat-label>
            <mat-select formControlName="custcategory">
              <mat-option [value]="null">-- Ninguna (General) --</mat-option>
              <mat-option *ngFor="let cat of custCategories" [value]="cat.id">
                {{ cat.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 300px;
    }
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 8px;
    }
    mat-radio-group {
      display: flex;
      gap: 16px;
    }
  `]
})
export class DiscountFormComponent implements OnInit {
  form: FormGroup;
  categories: any[] = [];
  custCategories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private discountService: DiscountService,
    public dialogRef: MatDialogRef<DiscountFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { discount?: Discount }
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      percentage: [true, Validators.required],
      idcategory: ['', Validators.required],
      custcategory: [null]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.data.discount) {
      this.form.patchValue(this.data.discount);
    }
  }

  loadCategories() {
    this.discountService.getDiscountCategories().subscribe((cats: any[]) => {
      this.categories = cats;
      // If categories exist but none selected (new form), select distinct 'General' or first
      if (!this.form.get('idcategory')?.value && this.categories.length > 0) {
        // Optionally auto-select if only 1, or leave empty
        const general = this.categories.find((c: any) => c.name.toLowerCase() === 'general');
        if (general) {
          this.form.patchValue({ idcategory: general.id });
        } else {
          this.form.patchValue({ idcategory: this.categories[0].id });
        }
      }
    });

    this.discountService.getDiscountCustCategories().subscribe((cats: any[]) => {
      this.custCategories = cats;
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
