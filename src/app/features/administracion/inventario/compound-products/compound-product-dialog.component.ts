import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CompoundProductsService } from './compound-products.service';
import { CompoundProduct, CompoundProductDetail, ProductForCompound, Unidad } from './compound-products.model';

@Component({
    selector: 'app-compound-product-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSnackBarModule
    ],
    template: `
    <h2 mat-dialog-title>{{ data.compoundProduct ? 'Editar' : 'Agregar' }} Insumo</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Insumo *</mat-label>
          <mat-select formControlName="idinsumo" [disabled]="!!data.compoundProduct">
            <mat-option *ngFor="let insumo of insumos" [value]="insumo.id">
              {{insumo.name}} ({{insumo.reference}})
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('idinsumo')?.hasError('required')">
            El insumo es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cantidad *</mat-label>
          <input matInput type="number" formControlName="cantidad" step="0.01" min="0.01">
          <mat-hint>Use coma (,) como separador decimal. Ej: 25,76</mat-hint>
          <mat-error *ngIf="form.get('cantidad')?.hasError('required')">
            La cantidad es obligatoria
          </mat-error>
          <mat-error *ngIf="form.get('cantidad')?.hasError('min')">
            La cantidad debe ser mayor a 0
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Unidad del Producto *</mat-label>
          <mat-select formControlName="unidadproduct">
            <mat-option *ngFor="let unidad of unidades" [value]="unidad.code">
              {{unidad.name}}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('unidadproduct')?.hasError('required')">
            La unidad del producto es obligatoria
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Unidad del Insumo *</mat-label>
          <mat-select formControlName="unidadinsumo">
            <mat-option *ngFor="let unidad of unidades" [value]="unidad.code">
              {{unidad.name}}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('unidadinsumo')?.hasError('required')">
            La unidad del insumo es obligatoria
          </mat-error>
        </mat-form-field>

        <p class="required-note">* Campos obligatorios</p>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid || saving">
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    mat-dialog-content {
      min-width: 500px;
      padding-top: 20px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .required-note {
      color: rgba(0, 0, 0, 0.54);
      font-size: 12px;
      margin-top: 8px;
    }
  `]
})
export class CompoundProductDialogComponent implements OnInit {
    form: FormGroup;
    insumos: ProductForCompound[] = [];
    unidades: Unidad[] = [];
    saving = false;

    private fb = inject(FormBuilder);
    private compoundProductsService = inject(CompoundProductsService);
    private snackBar = inject(MatSnackBar);
    private dialogRef = inject(MatDialogRef<CompoundProductDialogComponent>);

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: {
            compoundProduct?: CompoundProductDetail;
            productId: number
        }
    ) {
        this.form = this.fb.group({
            idinsumo: [null, Validators.required],
            cantidad: [null, [Validators.required, Validators.min(0.01)]],
            unidadproduct: [null, Validators.required],
            unidadinsumo: [null, Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadInsumos();
        this.loadUnidades();

        if (this.data.compoundProduct) {
            this.form.patchValue({
                idinsumo: this.data.compoundProduct.idinsumo,
                cantidad: this.data.compoundProduct.cantidad,
                unidadproduct: this.data.compoundProduct.unidadproduct,
                unidadinsumo: this.data.compoundProduct.unidadinsumo
            });
        }
    }

    loadInsumos(): void {
        this.compoundProductsService.getInsumos().subscribe({
            next: (insumos) => {
                this.insumos = insumos;
            },
            error: (err) => {
                console.error('Error cargando insumos', err);
                this.showError('Error al cargar insumos');
            }
        });
    }

    loadUnidades(): void {
        this.compoundProductsService.getUnidades().subscribe({
            next: (unidades) => {
                this.unidades = unidades;
            },
            error: (err) => {
                console.error('Error cargando unidades', err);
                this.showError('Error al cargar unidades');
            }
        });
    }

    onSave(): void {
        if (this.form.valid) {
            this.saving = true;
            const formValue = this.form.value;

            const data: CompoundProduct = {
                idproduct: this.data.productId,
                idinsumo: formValue.idinsumo,
                cantidad: formValue.cantidad,
                unidadproduct: formValue.unidadproduct,
                unidadinsumo: formValue.unidadinsumo,
                nameinsumo: '' // Se llenará en el backend
            };

            if (this.data.compoundProduct) {
                // Actualizar
                this.compoundProductsService.updateCompoundProduct(this.data.compoundProduct.id!, data).subscribe({
                    next: () => {
                        this.showSuccess('Insumo actualizado correctamente');
                        this.dialogRef.close(true);
                    },
                    error: (err) => {
                        this.saving = false;
                        this.showError('Error al actualizar: ' + err.error?.error);
                    }
                });
            } else {
                // Crear
                this.compoundProductsService.createCompoundProduct(data).subscribe({
                    next: () => {
                        this.showSuccess('Insumo agregado correctamente');
                        this.dialogRef.close(true);
                    },
                    error: (err) => {
                        this.saving = false;
                        this.showError('Error al crear: ' + err.error?.error);
                    }
                });
            }
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
    }

    private showError(message: string): void {
        this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
    }
}
