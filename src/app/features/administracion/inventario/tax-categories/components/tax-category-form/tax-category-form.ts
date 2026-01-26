import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TaxService, TaxCategory } from '../../../../../../core/services/tax.service';

@Component({
    selector: 'app-tax-category-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSnackBarModule
    ],
    template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Nueva' }} Categoría de Impuesto</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="form.get('name')?.hasError('required')">Requerido</mat-error>
        </mat-form-field>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
    styles: [`
    .full-width { width: 100%; }
  `]
})
export class TaxCategoryFormComponent {
    form: FormGroup;
    isEdit = false;

    private fb = inject(FormBuilder);
    private taxService = inject(TaxService);
    private snackBar = inject(MatSnackBar);
    public dialogRef = inject(MatDialogRef<TaxCategoryFormComponent>);

    constructor(@Inject(MAT_DIALOG_DATA) public data: TaxCategory | null) {
        this.isEdit = !!data;

        this.form = this.fb.group({
            name: [data?.name || '', Validators.required]
        });
    }

    save() {
        if (this.form.invalid) return;

        const { name } = this.form.value;

        const request = this.isEdit
            ? this.taxService.updateCategory(this.data!.id, name)
            : this.taxService.createCategory(name);

        request.subscribe({
            next: (res: TaxCategory) => {
                this.snackBar.open(this.isEdit ? 'Categoría actualizada' : 'Categoría creada', 'Cerrar', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: (err: any) => {
                console.error(err);
                let msg = 'Error al guardar';
                if (err.error && err.error.error) msg = err.error.error;
                this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
