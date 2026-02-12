import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Warehouse } from '../../../../../../core/models/warehouse.model';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.warehouse ? 'Editar Almacén' : 'Nuevo Almacén' }}</h2>
    
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-container">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre del Almacén</mat-label>
            <input matInput formControlName="name" placeholder="Ej. Principal, Sucursal Norte...">
            <mat-error *ngIf="form.get('name')?.hasError('required')">
              El nombre es requerido
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Dirección</mat-label>
            <textarea matInput formControlName="address" placeholder="Ubicación física del almacén" rows="3"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de Almacén</mat-label>
            <mat-select formControlName="type">
              <mat-option value="factory">Fábrica / Centro de Distribución</mat-option>
              <mat-option value="pos">Punto de Venta (Tienda)</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('type')?.hasError('required')">
              El tipo es requerido
            </mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data.warehouse ? 'Actualizar' : 'Guardar' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
      min-width: 320px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class WarehouseFormComponent {
  private fb = inject(FormBuilder);
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<WarehouseFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { warehouse?: Warehouse }
  ) {
    this.form = this.fb.group({
      name: [data.warehouse?.name || '', [Validators.required]],
      address: [data.warehouse?.address || ''],
      type: [data.warehouse?.type || 'factory', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
