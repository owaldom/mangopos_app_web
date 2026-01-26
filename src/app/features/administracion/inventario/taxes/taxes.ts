import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TaxService, Tax } from '../../../../core/services/tax.service';
import { TaxFormComponent } from './components/tax-form/tax-form';

@Component({
    selector: 'app-taxes',
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
    <div class="container">
      <div class="header">
        <h2>Gestión de Impuestos</h2>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nuevo Impuesto
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="taxes" class="full-width">
            
            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let element"> {{element.name}} </td>
            </ng-container>

            <!-- Rate Column -->
            <ng-container matColumnDef="rate">
              <th mat-header-cell *matHeaderCellDef> Tasa </th>
              <td mat-cell *matCellDef="let element"> {{element.rate | percent}} </td>
            </ng-container>

             <!-- Category Column -->
             <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef> Categoría </th>
              <td mat-cell *matCellDef="let element"> {{element.category_name}} </td>
            </ng-container>

            <!-- CustCategory Column -->
            <ng-container matColumnDef="custcategory">
              <th mat-header-cell *matHeaderCellDef> Cat. Cliente </th>
              <td mat-cell *matCellDef="let element"> {{element.custcategory_name || '-'}} </td>
            </ng-container>
            
            <!-- Parent Column -->
            <ng-container matColumnDef="parent">
              <th mat-header-cell *matHeaderCellDef> Padre </th>
              <td mat-cell *matCellDef="let element"> {{element.parent_name || '-'}} </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> </th>
              <td mat-cell *matCellDef="let element">
                <button mat-icon-button color="primary" (click)="openForm(element)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteTax(element)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" colspan="6">No hay impuestos registrados</td>
            </tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .container { padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .full-width { width: 100%; }
    td.mat-cell { padding: 8px; }
  `]
})
export class TaxesComponent implements OnInit {
    taxes: Tax[] = [];
    displayedColumns: string[] = ['name', 'rate', 'category', 'custcategory', 'parent', 'actions'];

    private taxService = inject(TaxService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    ngOnInit(): void {
        this.loadTaxes();
    }

    loadTaxes() {
        this.taxService.getAll().subscribe({
            next: (data) => {
                this.taxes = data;
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error al cargar impuestos', 'Cerrar', { duration: 3000 });
            }
        });
    }

    openForm(tax?: Tax) {
        const dialogRef = this.dialog.open(TaxFormComponent, {
            width: '600px',
            data: tax || null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadTaxes();
            }
        });
    }

    deleteTax(tax: Tax) {
        if (confirm(`¿Estás seguro de eliminar el impuesto "${tax.name}"?`)) {
            this.taxService.delete(tax.id).subscribe({
                next: () => {
                    this.snackBar.open('Impuesto eliminado', 'Cerrar', { duration: 3000 });
                    this.loadTaxes();
                },
                error: (err) => {
                    console.error(err);
                    this.snackBar.open('Error al eliminar: ' + err.message, 'Cerrar', { duration: 5000 });
                }
            });
        }
    }
}
