import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BanksService } from '../../../../core/services/banks.service';
import { BankAccountType } from '../../../../core/models/bank.model';

@Component({
    selector: 'app-bank-account-type-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCheckboxModule
    ],
    template: `
        <h2 mat-dialog-title>{{ data.type ? 'Editar' : 'Nuevo' }} Tipo de Cuenta</h2>
        <mat-dialog-content>
            <form [formGroup]="typeForm" class="d-flex flex-column gap-3 mt-2">
                <mat-form-field appearance="outline">
                    <mat-label>Nombre</mat-label>
                    <input matInput formControlName="name">
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Descripción (Opcional)</mat-label>
                    <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>

                <mat-checkbox formControlName="active">Tipo Activo</mat-checkbox>
            </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cancelar</button>
            <button mat-raised-button color="primary" [disabled]="typeForm.invalid || saving" (click)="onSubmit()">
                {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
        </mat-dialog-actions>
    `
})
export class BankAccountTypeDialogComponent {
    private fb = inject(FormBuilder);
    private banksService = inject(BanksService);
    private dialogRef = inject(MatDialogRef<BankAccountTypeDialogComponent>);

    typeForm: FormGroup;
    saving = false;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { type?: BankAccountType }) {
        this.typeForm = this.fb.group({
            name: [data.type?.name || '', Validators.required],
            description: [data.type?.description || ''],
            active: [data.type ? data.type.active : true]
        });
    }

    onSubmit(): void {
        if (this.typeForm.invalid) return;
        this.saving = true;

        this.banksService.createBankAccountType(this.typeForm.value).subscribe({
            next: () => this.dialogRef.close(true),
            error: () => {
                this.saving = false;
                alert('Error al guardar el tipo de cuenta');
            }
        });
    }
}
