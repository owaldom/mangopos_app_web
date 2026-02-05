import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BanksService } from '../../../core/services/banks.service';
import { Bank } from '../../../core/models/bank.model';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';

@Component({
    selector: 'app-bank-reconcile',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MoneyInputDirective
    ],
    templateUrl: './bank-reconcile.html',
    styles: [`
        .reconcile-container {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        .reconcile-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 20px;
        }
        .balance-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.03);
            border-radius: 8px;
            border-left: 4px solid #3f51b5;
        }
        .balance-item {
            display: flex;
            flex-direction: column;
        }
        .balance-item label {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .balance-item span {
            font-size: 1.4rem;
            font-weight: 500;
        }
        .difference {
            font-weight: 600;
        }
        .positive {
            color: #2e7d32;
        }
        .negative {
            color: #d32f2f;
        }
        .actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
        }
        .loading-container {
            display: flex;
            justify-content: center;
            padding: 40px;
        }
        mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
        }
    `]
})
export class BankReconcileComponent implements OnInit {
    reconcileForm: FormGroup;
    banks: Bank[] = [];
    selectedBank?: Bank;
    loading = false;
    saving = false;

    constructor(
        private fb: FormBuilder,
        private banksService: BanksService,
        private snackBar: MatSnackBar
    ) {
        this.reconcileForm = this.fb.group({
            bank_id: ['', Validators.required],
            new_balance: [0, [Validators.required, Validators.min(0)]],
            notes: ['']
        });
    }

    ngOnInit(): void {
        this.loadBanks();
        this.reconcileForm.get('bank_id')?.valueChanges.subscribe(id => {
            this.selectedBank = this.banks.find(b => b.id === id);
            if (this.selectedBank) {
                this.reconcileForm.patchValue({ new_balance: this.selectedBank.current_balance });
            }
        });
    }

    loadBanks(): void {
        this.loading = true;
        this.banksService.getBanks(true).subscribe({
            next: (banks) => {
                this.banks = banks;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading banks:', error);
                this.snackBar.open('Error al cargar bancos', 'Cerrar', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    get difference(): number {
        if (!this.selectedBank) return 0;
        const newBalance = this.reconcileForm.get('new_balance')?.value || 0;
        return newBalance - this.selectedBank.current_balance;
    }

    onSubmit(): void {
        if (this.reconcileForm.invalid) return;

        this.saving = true;
        const { bank_id, new_balance, notes } = this.reconcileForm.value;

        this.banksService.reconcileBalance(bank_id, new_balance, notes).subscribe({
            next: () => {
                this.snackBar.open('Conciliación realizada con éxito', 'Cerrar', { duration: 3000 });
                this.loadBanks(); // Reload to get updated balance
                this.saving = false;
                this.reconcileForm.get('notes')?.reset();
            },
            error: (error) => {
                console.error('Error in reconciliation:', error);
                this.snackBar.open('Error al realizar conciliación', 'Cerrar', { duration: 3000 });
                this.saving = false;
            }
        });
    }
}
