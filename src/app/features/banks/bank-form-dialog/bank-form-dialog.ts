import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BanksService } from '../../../core/services/banks.service';
import { Bank } from '../../../core/models/bank.model';

@Component({
    selector: 'app-bank-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatCheckboxModule,
        MatSnackBarModule
    ],
    templateUrl: './bank-form-dialog.html',
    styleUrls: ['./bank-form-dialog.scss']
})
export class BankFormDialogComponent implements OnInit {
    bankForm: FormGroup;
    mode: 'create' | 'edit';
    bank?: Bank;
    saving = false;

    bankEntities = [
        'Banco de Venezuela',
        'Banesco',
        'Banco Mercantil',
        'BBVA Provincial',
        'Banco Bicentenario',
        'Banco del Tesoro',
        'Bancaribe',
        'Banco Exterior',
        'Banco Nacional de Crédito (BNC)',
        'Banco Plaza',
        'Mi Banco',
        'Banco Sofitasa',
        'Banco Activo',
        'Bancrecer',
        'Banco Caroni',
        'Banco Fondo Común',
        'Bangente',
        'Banplus',
        'Banco Venezolano de Crédito',
        'Otro'
    ];

    accountTypes = [
        { value: 'CORRIENTE', label: 'Corriente' },
        { value: 'AHORRO', label: 'Ahorro' },
        { value: 'CREDITO', label: 'Crédito' }
    ];

    currencies = [
        { value: 'VES', label: 'Bolívares (VES)' },
        { value: 'USD', label: 'Dólares (USD)' }
    ];

    constructor(
        private fb: FormBuilder,
        private banksService: BanksService,
        private dialogRef: MatDialogRef<BankFormDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.mode = data.mode;
        this.bank = data.bank;

        this.bankForm = this.fb.group({
            name: ['', Validators.required],
            bank_entity: [''],
            account_number: [''],
            account_type: ['CORRIENTE', Validators.required],
            currency: ['VES', Validators.required],
            initial_balance: [0, [Validators.required, Validators.min(0)]],
            notes: [''],
            active: [true]
        });
    }

    ngOnInit(): void {
        if (this.mode === 'edit' && this.bank) {
            this.bankForm.patchValue(this.bank);
            // Disable initial_balance for edit mode
            this.bankForm.get('initial_balance')?.disable();
        }
    }

    onSubmit(): void {
        if (this.bankForm.invalid) {
            this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
            return;
        }

        this.saving = true;
        const formValue = this.bankForm.getRawValue();

        if (this.mode === 'create') {
            this.banksService.createBank(formValue).subscribe({
                next: () => {
                    this.snackBar.open('Banco creado exitosamente', 'Cerrar', { duration: 3000 });
                    this.dialogRef.close(true);
                },
                error: (error) => {
                    console.error('Error creating bank:', error);
                    this.snackBar.open('Error al crear banco', 'Cerrar', { duration: 3000 });
                    this.saving = false;
                }
            });
        } else {
            this.banksService.updateBank(this.bank!.id, formValue).subscribe({
                next: () => {
                    this.snackBar.open('Banco actualizado exitosamente', 'Cerrar', { duration: 3000 });
                    this.dialogRef.close(true);
                },
                error: (error) => {
                    console.error('Error updating bank:', error);
                    this.snackBar.open('Error al actualizar banco', 'Cerrar', { duration: 3000 });
                    this.saving = false;
                }
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
