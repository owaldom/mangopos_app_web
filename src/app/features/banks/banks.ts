import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BanksService } from '../../core/services/banks.service';
import { Bank } from '../../core/models/bank.model';
import { BankFormDialogComponent } from './bank-form-dialog/bank-form-dialog';
import { BankTransactionsDialogComponent } from './bank-transactions-dialog/bank-transactions-dialog';
import { BankTransferDialogComponent } from './bank-transfer-dialog/bank-transfer-dialog';

@Component({
    selector: 'app-banks',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule,
        MatCardModule,
        MatChipsModule,
        MatTooltipModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './banks.html',
    styleUrls: ['./banks.scss']
})
export class BanksComponent implements OnInit {
    banks: Bank[] = [];
    displayedColumns: string[] = ['name', 'account_number', 'account_type', 'currency', 'current_balance', 'status', 'actions'];
    loading = false;

    constructor(
        private banksService: BanksService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadBanks();
    }

    loadBanks(): void {
        this.loading = true;
        this.banksService.getBanks().subscribe({
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

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(BankFormDialogComponent, {
            width: '600px',
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadBanks();
            }
        });
    }

    openEditDialog(bank: Bank): void {
        const dialogRef = this.dialog.open(BankFormDialogComponent, {
            width: '600px',
            data: { mode: 'edit', bank }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadBanks();
            }
        });
    }

    openTransferDialog(): void {
        const dialogRef = this.dialog.open(BankTransferDialogComponent, {
            width: '500px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadBanks();
            }
        });
    }

    openTransactionsDialog(bank: Bank): void {
        this.dialog.open(BankTransactionsDialogComponent, {
            width: '90%',
            maxWidth: '1200px',
            height: '80vh',
            data: { bank }
        });
    }

    deleteBank(bank: Bank): void {
        if (confirm(`¿Está seguro de eliminar el banco "${bank.name}"?`)) {
            this.banksService.deleteBank(bank.id).subscribe({
                next: (response) => {
                    this.snackBar.open(response.message || 'Banco eliminado exitosamente', 'Cerrar', { duration: 3000 });
                    this.loadBanks();
                },
                error: (error) => {
                    console.error('Error deleting bank:', error);
                    this.snackBar.open('Error al eliminar banco', 'Cerrar', { duration: 3000 });
                }
            });
        }
    }

    getAccountTypeLabel(type: string): string {
        const types: any = {
            'CORRIENTE': 'Corriente',
            'AHORRO': 'Ahorro',
            'CREDITO': 'Crédito'
        };
        return types[type] || type;
    }

    formatCurrency(amount: any, currency: string): string {
        const symbol = currency === 'USD' ? '$' : 'Bs.';
        const value = Number(amount) || 0;
        return `${symbol} ${value.toFixed(2)}`;
    }
}
