import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ExpenseService, Expense } from '../../../../../core/services/expense.service';
import { SupplierService, Supplier } from '../../../../../core/services/supplier.service';
import { TaxService, TaxCategory } from '../../../../../core/services/tax.service';

@Component({
  selector: 'app-expense-definition-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data ? 'Editar Gasto' : 'Nuevo Tipo de Gasto' }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <div class="form-grid">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre del Gasto</mat-label>
            <input matInput formControlName="name" placeholder="Ej. Alquiler, Luz, Agua">
            <mat-error *ngIf="form.get('name')?.hasError('required')">El nombre es requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Frecuencia</mat-label>
            <mat-select formControlName="frequency">
              <mat-option *ngFor="let freq of frequencies" [value]="freq">
                {{ freq }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('frequency')?.hasError('required')">La frecuencia es requerida</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Categoría de Impuesto</mat-label>
            <mat-select formControlName="taxcat">
              <mat-option [value]="null">Ninguno</mat-option>
              <mat-option *ngFor="let cat of taxCategories" [value]="cat.id">
                {{ cat.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Proveedor Asociado</mat-label>
            <mat-select formControlName="idsupplier">
              <mat-option>
                <ngx-mat-select-search [formControl]="supplierFilterCtrl" placeholderLabel="Buscar proveedor..." noEntriesFoundLabel="No encontrado"></ngx-mat-select-search>
              </mat-option>
              <mat-option [value]="null">-- Ninguno --</mat-option>
              <mat-option *ngFor="let supplier of filteredSuppliers" [value]="supplier.id">
                {{ supplier.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('idsupplier')?.hasError('required')">El proveedor es requerido</mat-error>
            <mat-hint>Si selecciona un proveedor, este se pre-cargará al registrar el gasto</mat-hint>
          </mat-form-field>

          <div class="toggle-container">
            <mat-slide-toggle formControlName="visible" color="primary">
              Gasto Activo
            </mat-slide-toggle>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">
          {{ data ? 'Actualizar' : 'Crear' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-content {
      padding-top: 10px;
      min-width: 400px; 
      max-width: 600px;
    }
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .full-width {
      width: 100%;
    }
    .toggle-container {
      margin-top: 10px;
      margin-bottom: 20px;
    }
  `]
})
export class ExpenseDefinitionDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;
  private fb = inject(FormBuilder);

  frequencies = [
    'Diario', 'Semanal', 'Quincenal', 'Mensual',
    'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Único'
  ];

  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  supplierFilterCtrl = this.fb.control('');

  taxCategories: TaxCategory[] = [];

  private expenseService = inject(ExpenseService);
  private supplierService = inject(SupplierService);
  private taxService = inject(TaxService);
  private snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<ExpenseDefinitionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Expense | null
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      frequency: ['Mensual', Validators.required],
      idsupplier: [null, Validators.required],
      taxcat: [null],
      visible: [true]
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadTaxCategories();

    if (this.data) {
      this.form.patchValue(this.data);
    }

    this.supplierFilterCtrl.valueChanges.subscribe(val => {
      this.filterSuppliers(val || '');
    });
  }

  loadSuppliers() {
    // Load all suppliers logic (might need adjustment if list is huge, for now loading first page with large limit)
    this.supplierService.getAll(1, 100).subscribe(res => {
      this.suppliers = res.data;
      this.filteredSuppliers = this.suppliers;
    });
  }

  loadTaxCategories() {
    this.taxService.getAllCategories().subscribe(cats => {
      this.taxCategories = cats;
    });
  }

  filterSuppliers(search: string) {
    if (!search) {
      this.filteredSuppliers = this.suppliers;
      return;
    }
    search = search.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter(s => s.name.toLowerCase().includes(search));
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    const value = this.form.value;

    const request$ = this.data
      ? this.expenseService.update(this.data.id, value)
      : this.expenseService.create(value);

    request$.subscribe({
      next: (res) => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error saving expense definition', err);
        this.snackBar.open('Error al guardar el tipo de gasto', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
