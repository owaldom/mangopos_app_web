import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { CategoryService, Category, PaginatedResponse } from '../../../../core/services/category.service';
import { CategoryFormComponent } from './components/category-form/category-form';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatPaginatorModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Categorías de Productos</h1>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nueva Categoría
        </button>
      </div>

      <mat-card>
        <div class="table-container">
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

            <!-- Parent Column -->
            <ng-container matColumnDef="parent">
              <th mat-header-cell *matHeaderCellDef> Categoría Padre </th>
              <td mat-cell *matCellDef="let element"> 
                {{ getParentName(element.parentid) }} 
              </td>
            </ng-container>

            <!-- Visibility Column -->
            <ng-container matColumnDef="visible_in_pos">
              <th mat-header-cell *matHeaderCellDef> Visible en POS </th>
              <td mat-cell *matCellDef="let element">
                <mat-icon [color]="element.visible_in_pos !== false ? 'primary' : 'warn'">
                  {{ element.visible_in_pos !== false ? 'visibility' : 'visibility_off' }}
                </mat-icon>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> Acciones </th>
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
              <td class="mat-cell" colspan="5">No hay categorías registradas</td>
            </tr>
          </table>
        </div>

        <mat-paginator 
          [length]="totalCategories"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50, 100]"
          (page)="onPageChange($event)"
          aria-label="Seleccionar página de categorías">
        </mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      h1 { margin: 0; }
    }
    .full-width {
      width: 100%;
    }
    .mat-column-id {
      width: 60px;
    }
    .mat-column-visible_in_pos {
      width: 120px;
      text-align: center;
    }
    .mat-column-actions {
      width: 100px;
      text-align: right;
    }
  `]
})
export class CategoriasComponent implements OnInit {
  categories: Category[] = [];
  allCategoriesForParents: Category[] = [];
  displayedColumns: string[] = ['id', 'name', 'parent', 'visible_in_pos', 'actions'];

  // Paginación
  totalCategories = 0;
  pageSize = 50;
  currentPage = 0;

  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    // Backend espera pagina 1-indexed
    const page = this.currentPage + 1;

    this.categoryService.getAll(page, this.pageSize).subscribe({
      next: (response) => {
        this.categories = response.data;
        this.totalCategories = response.total;

        // Optimización simple para nombres de padres: 
        // Si la lista es pequeña o necesitamos resolver nombres, podríamos necesitar cargar más datos.
        // Por ahora, usamos los datos cargados. Si un padre no está en la página actual, saldrá como ID.
        // Para solución completa se requeriría endpoint separado de "lista simple para selects"
        if (this.allCategoriesForParents.length === 0) {
          this.allCategoriesForParents = [...this.categories];
        }
      },
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCategories();
  }

  getParentName(parentId: number | undefined): string {
    if (!parentId) return '-';
    // Buscar primero en la página actual
    let parent = this.categories.find(c => c.id === parentId);

    // Si no está, buscar en caché de padres (si tuviéramos)
    // De lo contrario devolver ID
    return parent ? parent.name : `ID: ${parentId}`;
  }

  openForm(category?: Category): void {
    const dialogRef = this.dialog.open(CategoryFormComponent, {
      width: '400px',
      data: {
        category,
        categories: this.categories // Nota: Solo muestra categorías de la página actual como padres
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (category) {
          this.categoryService.update(category.id, result).subscribe({
            next: () => {
              this.showSuccess('Categoría actualizada');
              this.loadCategories();
            },
            error: (err) => this.showError('Error al actualizar: ' + err.error?.error)
          });
        } else {
          this.categoryService.create(result).subscribe({
            next: () => {
              this.showSuccess('Categoría creada');
              this.loadCategories();
            },
            error: (err) => this.showError('Error al crear: ' + err.error?.error)
          });
        }
      }
    });
  }

  deleteCategory(category: Category): void {
    if (confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      this.categoryService.delete(category.id).subscribe({
        next: () => {
          this.showSuccess('Categoría eliminada');
          this.loadCategories();
        },
        error: (err) => this.showError('Error al eliminar: ' + err.error?.error)
      });
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
