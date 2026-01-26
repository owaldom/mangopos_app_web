import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Discount, DiscountService } from '../../../../../core/services/discount.service';
import { DiscountFormComponent } from '../discount-form/discount-form';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-discount-list',
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
      <header>
        <h1>Descuentos</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nuevo Descuento
        </button>
      </header>
      
      <div class="table-container mat-elevation-z8">
        <table mat-table [dataSource]="discounts">
          
          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Nombre </th>
            <td mat-cell *matCellDef="let element"> {{element.name}} </td>
          </ng-container>

          <!-- Value Column -->
          <ng-container matColumnDef="value">
            <th mat-header-cell *matHeaderCellDef> Valor </th>
            <td mat-cell *matCellDef="let element"> 
              {{element.quantity}} {{ element.percentage ? '%' : '' }}
            </td>
          </ng-container>

          <!-- Type Column -->
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef> Tipo </th>
            <td mat-cell *matCellDef="let element"> 
              {{ element.percentage ? 'Porcentaje' : 'Importe Fijo' }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button color="primary" (click)="openForm(element)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteDiscount(element)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
  `]
})
export class DiscountListComponent implements OnInit {
  discounts: Discount[] = [];
  displayedColumns: string[] = ['name', 'value', 'type', 'actions'];

  private discountService = inject(DiscountService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadDiscounts();
  }

  loadDiscounts(): void {
    this.discountService.getAll().subscribe({
      next: (data) => this.discounts = data,
      error: (err) => console.error('Error loading discounts', err)
    });
  }

  openForm(discount?: Discount): void {
    const dialogRef = this.dialog.open(DiscountFormComponent, {
      width: '500px',
      data: { discount }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (discount) {
          this.updateDiscount(discount.id, result);
        } else {
          this.createDiscount(result);
        }
      }
    });
  }

  createDiscount(data: any): void {
    this.discountService.create(data).subscribe({
      next: () => {
        this.snackBar.open('Descuento creado', 'Cerrar', { duration: 3000 });
        this.loadDiscounts();
      },
      error: () => this.snackBar.open('Error al crear descuento', 'Cerrar', { duration: 3000 })
    });
  }

  updateDiscount(id: string, data: any): void {
    this.discountService.update(id, data).subscribe({
      next: () => {
        this.snackBar.open('Descuento actualizado', 'Cerrar', { duration: 3000 });
        this.loadDiscounts();
      },
      error: () => this.snackBar.open('Error al actualizar descuento', 'Cerrar', { duration: 3000 })
    });
  }

  deleteDiscount(discount: Discount): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro de eliminar el descuento "${discount.name}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.discountService.deleteDiscount(discount.id).subscribe({
          next: () => {
            this.snackBar.open('Descuento eliminado', 'Cerrar', { duration: 3000 });
            this.loadDiscounts();
          },
          error: () => this.snackBar.open('Error al eliminar descuento', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
