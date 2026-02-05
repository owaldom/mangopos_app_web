import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { BanksService } from '../../../core/services/banks.service';
import { Bank } from '../../../core/models/bank.model';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';

@Component({
    selector: 'app-bank-transfer-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatSnackBarModule,
        MatIconModule,
        MoneyInputDirective
    ],
    templateUrl: './bank-transfer-dialog.html',
    styles: [`
        .transfer-form { display: flex; flex-direction: column; gap: 15px; padding: 10px 0; }
        .rate-info { background: #fff8e1; padding: 10px; border-radius: 4px; font-size: 13px; margin-bottom: 10px; }
    `]
})
export class BankTransferDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private banksService = inject(BanksService);
    private dialogRef = inject(MatDialogRef<BankTransferDialogComponent>);
    private snackBar = inject(MatSnackBar);

    transferForm: FormGroup;
    banks: Bank[] = [];
    saving = false;

    constructor() {
        this.transferForm = this.fb.group({
            origin_bank_id: ['', Validators.required],
            destination_bank_id: ['', Validators.required],
            amount: [0, [Validators.required, Validators.min(0.01)]],
            exchange_rate: [1, [Validators.required, Validators.min(0.000001)]],
            notes: ['']
        });
    }

    ngOnInit(): void {
        this.loadBanks();

        // Listen for changes in banks to adjust default rate
        this.transferForm.get('origin_bank_id')?.valueChanges.subscribe(() => this.checkCurrencies());
        this.transferForm.get('destination_bank_id')?.valueChanges.subscribe(() => this.checkCurrencies());
    }

    loadBanks(): void {
        this.banksService.getBanks(true).subscribe(data => this.banks = data);
    }

    get originBank(): Bank | undefined {
        return this.banks.find(b => b.id === this.transferForm.get('origin_bank_id')?.value);
    }

    get destinationBank(): Bank | undefined {
        return this.banks.find(b => b.id === this.transferForm.get('destination_bank_id')?.value);
    }

    get currenciesDifferent(): boolean {
        return !!this.originBank && !!this.destinationBank && this.originBank.currency !== this.destinationBank.currency;
    }

    checkCurrencies(): void {
        if (!this.currenciesDifferent) {
            this.transferForm.patchValue({ exchange_rate: 1 });
        }
    }

    onSubmit(): void {
        if (this.transferForm.invalid) return;

        this.saving = true;
        this.banksService.transferFunds(this.transferForm.value).subscribe({
            next: () => {
                this.snackBar.open('Transferencia completada', 'OK', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error al transferir: ' + (err.error?.error || err.message), 'Cerrar');
                this.saving = false;
            }
        });
    }
}
