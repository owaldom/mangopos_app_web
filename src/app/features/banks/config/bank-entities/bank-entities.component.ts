import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BanksService } from '../../../../core/services/banks.service';
import { BankEntity } from '../../../../core/models/bank.model';
import { BankEntityDialogComponent } from './bank-entity-dialog.component';

@Component({
    selector: 'app-bank-entities',
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
                    <mat-card-title>Entidades Bancarias</mat-card-title>
                    <mat-card-subtitle>Gestionar listado de bancos (entidades)</mat-card-subtitle>
                    <span class="spacer"></span>
                    <button mat-raised-button color="primary" (click)="openDialog()">
                        <mat-icon>add</mat-icon> Nueva Entidad
                    </button>
                </mat-card-header>

                <mat-card-content>
                    <table mat-table [dataSource]="entities" class="w-100">
                        <ng-container matColumnDef="name">
                            <th mat-header-cell *matHeaderCellDef>Nombre</th>
                            <td mat-cell *matCellDef="let entity">{{ entity.name }}</td>
                        </ng-container>

                        <ng-container matColumnDef="code">
                            <th mat-header-cell *matHeaderCellDef>Código</th>
                            <td mat-cell *matCellDef="let entity">{{ entity.code || '-' }}</td>
                        </ng-container>

                        <ng-container matColumnDef="active">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let entity">
                                <span class="badge" [ngClass]="entity.active ? 'bg-success' : 'bg-danger'">
                                    {{ entity.active ? 'Activo' : 'Inactivo' }}
                                </span>
                            </td>
                        </ng-container>

                        <ng-container matColumnDef="actions">
                            <th mat-header-cell *matHeaderCellDef>Acciones</th>
                            <td mat-cell *matCellDef="let entity">
                                <button mat-icon-button color="primary" (click)="openDialog(entity)">
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
export class BankEntitiesComponent implements OnInit {
    private banksService = inject(BanksService);
    private snackBar = inject(MatSnackBar);

    entities: BankEntity[] = [];
    displayedColumns: string[] = ['name', 'code', 'active', 'actions'];

    ngOnInit(): void {
        this.loadEntities();
    }

    loadEntities(): void {
        this.banksService.getBankEntities().subscribe({
            next: (data) => this.entities = data,
            error: () => this.snackBar.open('Error al cargar entidades', 'Cerrar', { duration: 3000 })
        });
    }

    private dialog = inject(MatDialog);

    openDialog(entity?: BankEntity): void {
        const dialogRef = this.dialog.open(BankEntityDialogComponent, {
            width: '400px',
            data: { entity }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadEntities();
                this.snackBar.open('Entidad actualizada', 'OK', { duration: 3000 });
            }
        });
    }
}
