import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BanksService } from '../../../../core/services/banks.service';
import { BankAccountType } from '../../../../core/models/bank.model';
import { BankAccountTypeDialogComponent } from './bank-account-type-dialog.component';

@Component({
    selector: 'app-bank-account-types',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    template: `
        <div class="container-fluid p-4">
            <mat-card>
                <mat-card-header>
                    <mat-card-title>Tipos de Cuenta</mat-card-title>
                    <mat-card-subtitle>Configurar categorías de cuentas bancarias</mat-card-subtitle>
                    <span class="spacer"></span>
                    <button mat-raised-button color="primary" (click)="openDialog()">
                        <mat-icon>add</mat-icon> Nuevo Tipo
                    </button>
                </mat-card-header>

                <mat-card-content>
                    <table mat-table [dataSource]="types" class="w-100">
                        <ng-container matColumnDef="name">
                            <th mat-header-cell *matHeaderCellDef>Nombre</th>
                            <td mat-cell *matCellDef="let type">{{ type.name }}</td>
                        </ng-container>

                        <ng-container matColumnDef="description">
                            <th mat-header-cell *matHeaderCellDef>Descripción</th>
                            <td mat-cell *matCellDef="let type">{{ type.description || '-' }}</td>
                        </ng-container>

                        <ng-container matColumnDef="active">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let type">
                                <span class="badge" [ngClass]="type.active ? 'bg-success' : 'bg-danger'">
                                    {{ type.active ? 'Activo' : 'Inactivo' }}
                                </span>
                            </td>
                        </ng-container>

                        <ng-container matColumnDef="actions">
                            <th mat-header-cell *matHeaderCellDef>Acciones</th>
                            <td mat-cell *matCellDef="let type">
                                <button mat-icon-button color="primary" (click)="openDialog(type)">
                                    <mat-icon>edit</mat-icon>
                                </button>
                            </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                    </table>
                </mat-card-content>
            </mat-card>
        </div>
    `,
    styles: [`
        .spacer { flex: 1 1 auto; }
        .w-100 { width: 100%; }
        mat-card-header { align-items: center; margin-bottom: 20px; }
    `]
})
export class BankAccountTypesComponent implements OnInit {
    private banksService = inject(BanksService);
    private snackBar = inject(MatSnackBar);

    types: BankAccountType[] = [];
    displayedColumns: string[] = ['name', 'description', 'active', 'actions'];

    ngOnInit(): void {
        this.loadTypes();
    }

    loadTypes(): void {
        this.banksService.getBankAccountTypes().subscribe({
            next: (data) => this.types = data,
            error: () => this.snackBar.open('Error al cargar tipos de cuenta', 'Cerrar', { duration: 3000 })
        });
    }

    private dialog = inject(MatDialog);

    openDialog(type?: BankAccountType): void {
        const dialogRef = this.dialog.open(BankAccountTypeDialogComponent, {
            width: '400px',
            data: { type }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadTypes();
                this.snackBar.open('Tipo de cuenta actualizado', 'OK', { duration: 3000 });
            }
        });
    }
}
