import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DiscountService } from '../../../../../core/services/discount.service';
import { DiscountCategoryFormComponent } from './discount-category-form';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-discount-category-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Categorías de Descuento (Productos)</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nueva Categoría
        </button>
      </div>

      <table mat-table [dataSource]="categories" class="mat-elevation-z8">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef> Nombre </th>
          <td mat-cell *matCellDef="let category"> {{category.name}} </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> Acciones </th>
          <td mat-cell *matCellDef="let category">
            <button mat-icon-button color="primary" (click)="openForm(category)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteCategory(category)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    table { width: 100%; }
  `]
})
export class DiscountCategoryListComponent implements OnInit {
  categories: any[] = [];
  displayedColumns: string[] = ['name', 'actions'];

  constructor(
    private discountService: DiscountService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(): void {
    this.discountService.getDiscountCategories().subscribe((data: any[]) => {
      this.categories = data;
    });
  }

  openForm(category?: any): void {
    const dialogRef = this.dialog.open(DiscountCategoryFormComponent, {
      width: '400px',
      data: { category }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        if (category) {
          this.discountService.updateDiscountCategory(category.id, result).subscribe(() => {
            this.snackBar.open('Categoría actualizada', 'Cerrar', { duration: 3000 });
            this.getCategories();
          });
        } else {
          this.discountService.createDiscountCategory(result).subscribe(() => {
            this.snackBar.open('Categoría creada', 'Cerrar', { duration: 3000 });
            this.getCategories();
          });
        }
      }
    });
  }

  deleteCategory(category: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro de eliminar la categoría "${category.name}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.discountService.deleteDiscountCategory(category.id).subscribe(() => {
          this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
          this.getCategories();
        }, (error: any) => {
          this.snackBar.open('No se puede eliminar: tiene descuentos asociados', 'Cerrar', { duration: 4000 });
        });
      }
    });
  }
}
