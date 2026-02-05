import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BanksService } from '../../../../core/services/banks.service';
import { BankEntity } from '../../../../core/models/bank.model';

@Component({
    selector: 'app-bank-entity-dialog',
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
        <h2 mat-dialog-title>{{ data.entity ? 'Editar' : 'Nueva' }} Entidad Bancaria</h2>
        <mat-dialog-content>
            <form [formGroup]="entityForm" class="d-flex flex-column gap-3 mt-2">
                <mat-form-field appearance="outline">
                    <mat-label>Nombre</mat-label>
                    <input matInput formControlName="name">
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Código (Opcional)</mat-label>
                    <input matInput formControlName="code">
                </mat-form-field>

                <mat-checkbox formControlName="active">Entidad Activa</mat-checkbox>
            </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cancelar</button>
            <button mat-raised-button color="primary" [disabled]="entityForm.invalid || saving" (click)="onSubmit()">
                {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
        </mat-dialog-actions>
    `
})
export class BankEntityDialogComponent {
    private fb = inject(FormBuilder);
    private banksService = inject(BanksService);
    private dialogRef = inject(MatDialogRef<BankEntityDialogComponent>);

    entityForm: FormGroup;
    saving = false;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { entity?: BankEntity }) {
        this.entityForm = this.fb.group({
            name: [data.entity?.name || '', Validators.required],
            code: [data.entity?.code || ''],
            active: [data.entity ? data.entity.active : true]
        });
    }

    onSubmit(): void {
        if (this.entityForm.invalid) return;
        this.saving = true;

        // This is a simplified version for common entities
        this.banksService.createBankEntity(this.entityForm.value).subscribe({
            next: () => this.dialogRef.close(true),
            error: () => {
                this.saving = false;
                alert('Error al guardar entidad');
            }
        });
    }
}
