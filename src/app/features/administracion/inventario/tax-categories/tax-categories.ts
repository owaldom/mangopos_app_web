import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TaxService, TaxCategory } from '../../../../core/services/tax.service';
import { TaxCategoryFormComponent } from './components/tax-category-form/tax-category-form';

@Component({
    selector: 'app-tax-categories',
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
        <h2>Categorías de Impuestos</h2>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nueva Categoría
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="categories" class="full-width">
            
             <!-- ID Column -->
             <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef> ID </th>
              <td mat-cell *matCellDef="let element"> {{element.id}} </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let element"> {{element.name}} </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> </th>
              <td mat-cell *matCellDef="let element">
                <button mat-icon-button color="primary" (click)="openForm(element)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteCategory(element)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" colspan="6">No hay categorías registradas</td>
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
export class TaxCategoriesComponent implements OnInit {
    categories: TaxCategory[] = [];
    displayedColumns: string[] = ['name', 'actions'];

    private taxService = inject(TaxService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories() {
        this.taxService.getAllCategories().subscribe({
            next: (data) => {
                this.categories = data;
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error al cargar categorías', 'Cerrar', { duration: 3000 });
            }
        });
    }

    openForm(category?: TaxCategory) {
        const dialogRef = this.dialog.open(TaxCategoryFormComponent, {
            width: '400px',
            data: category || null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadCategories();
            }
        });
    }

    deleteCategory(category: TaxCategory) {
        if (confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
            this.taxService.deleteCategory(category.id).subscribe({
                next: () => {
                    this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
                    this.loadCategories();
                },
                error: (err) => {
                    console.error(err);
                    let msg = 'Error al eliminar';
                    if (err.error && err.error.error) msg = err.error.error;
                    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                }
            });
        }
    }
}
