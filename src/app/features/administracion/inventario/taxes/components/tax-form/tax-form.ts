import { Component, inject, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TaxService, Tax, TaxCategory, TaxCustCategory } from '../../../../../../core/services/tax.service';

@Component({
    selector: 'app-tax-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSnackBarModule
    ],
    template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Nuevo' }} Impuesto</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content>
        <div class="row">
          <mat-form-field appearance="outline" class="col-8">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="form.get('name')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="col-4">
            <mat-label>Tasa (0.10 = 10%)</mat-label>
            <input matInput type="number" formControlName="rate" required step="0.01">
            <mat-error *ngIf="form.get('rate')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>
        </div>

        <div class="row">
           <mat-form-field appearance="outline" class="col-6">
            <mat-label>Categoría</mat-label>
            <mat-select formControlName="category" required>
              <mat-option *ngFor="let cat of categories" [value]="cat.id">
                {{ cat.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('category')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="col-6">
            <mat-label>Válido Desde</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="validfrom" required>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('validfrom')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>
        </div>

        <div class="row">
           <mat-form-field appearance="outline" class="col-6">
            <mat-label>Categoría Cliente (Opcional)</mat-label>
            <mat-select formControlName="custcategory">
              <mat-option [value]="null">-- Ninguna --</mat-option>
              <mat-option *ngFor="let ccat of custCategories" [value]="ccat.id">
                {{ ccat.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="col-6">
            <mat-label>Impuesto Padre (Opcional)</mat-label>
            <mat-select formControlName="parentid">
              <mat-option [value]="null">-- Ninguno --</mat-option>
               <mat-option *ngFor="let p of parentTaxes" [value]="p.id">
                {{ p.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        
        <div class="row checkboxes">
           <mat-checkbox formControlName="ratecascade">Cascada</mat-checkbox>
           
           <mat-form-field appearance="outline" class="small-field" *ngIf="form.get('ratecascade')?.value">
                <mat-label>Orden</mat-label>
                <input matInput type="number" formControlName="rateorder">
           </mat-form-field>
        </div>

      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
    styles: [`
    .row { display: flex; gap: 10px; margin-bottom: 5px; }
    .col-8 { flex: 2; }
    .col-4 { flex: 1; }
    .col-6 { flex: 1; }
    .checkboxes { align-items: center; }
    .small-field { width: 100px; margin-left: 20px; }
  `]
})
export class TaxFormComponent implements OnInit {
    form: FormGroup;
    isEdit = false;

    categories: TaxCategory[] = [];
    custCategories: TaxCustCategory[] = [];
    parentTaxes: Tax[] = []; // List of potential parent taxes

    private fb = inject(FormBuilder);
    private taxService = inject(TaxService);
    private snackBar = inject(MatSnackBar);
    public dialogRef = inject(MatDialogRef<TaxFormComponent>);

    constructor(@Inject(MAT_DIALOG_DATA) public data: Tax | null) {
        this.isEdit = !!data;

        this.form = this.fb.group({
            name: [data?.name || '', Validators.required],
            rate: [data?.rate || 0, Validators.required],
            category: [data?.category || null, Validators.required],
            custcategory: [data?.custcategory || null],
            parentid: [data?.parentid || null],
            ratecascade: [data?.ratecascade || false],
            rateorder: [data?.rateorder || null],
            validfrom: [data ? new Date(data.validfrom) : new Date(), Validators.required]
        });
    }

    ngOnInit(): void {
        // Load dependencies parallel
        this.loadDropdowns();
    }

    loadDropdowns() {
        this.taxService.getTaxCategories().subscribe(res => this.categories = res);
        this.taxService.getTaxCustCategories().subscribe(res => this.custCategories = res);
        // Load existing taxes for parent selection (excluding self if edit)
        this.taxService.getAll().subscribe(res => {
            if (this.isEdit && this.data) {
                this.parentTaxes = res.filter(t => t.id !== this.data!.id);
            } else {
                this.parentTaxes = res;
            }
        });
    }

    save() {
        if (this.form.invalid) return;

        const val = this.form.value;

        const request = this.isEdit
            ? this.taxService.update(this.data!.id, val)
            : this.taxService.create(val);

        request.subscribe({
            next: (res) => {
                this.snackBar.open(this.isEdit ? 'Impuesto actualizado' : 'Impuesto creado', 'Cerrar', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: (err) => {
                console.error(err);
                let msg = 'Error al guardar';
                if (err.error && err.error.error) msg = err.error.error;
                this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
