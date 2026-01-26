import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PriceChangeService } from '../../../core/services/price-change.service';
import { SettingsService } from '../../../core/services/settings.service';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';

export interface PriceChangeDialogData {
  productId: string;
  productName: string;
  currentPrice: number;
}

@Component({
  selector: 'app-price-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MoneyInputDirective
  ],
  template: `
    <h2 mat-dialog-title>Cambiar Precio</h2>
    <mat-dialog-content>
      <div class="product-info">
        <p><strong>Producto:</strong> {{ data.productName }}</p>
        <p><strong>Precio Actual:</strong> {{ data.currentPrice | currency:'USD':'$':settingsService.getDecimalFormat('total') }}</p>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nuevo Precio</mat-label>
        <input matInput type="text" [(ngModel)]="newPrice" (ngModelChange)="calculateDifference()" placeholder="0.00" appMoneyInput decimalType="price" autofocus>
        <span matPrefix>$&nbsp;</span>
        <mat-icon matSuffix>attach_money</mat-icon>
      </mat-form-field>

      <div class="price-summary" *ngIf="newPrice && newPrice > 0">
        <div class="summary-row">
          <span>Diferencia:</span>
          <span [class.positive]="difference > 0" [class.negative]="difference < 0">
            {{ difference | currency:'USD':'$':settingsService.getDecimalFormat('total') }}
          </span>
        </div>
        <div class="summary-row">
          <span>Cambio Porcentual:</span>
          <span [class.positive]="percentageChange > 0" [class.negative]="percentageChange < 0">
            {{ percentageChange | number:'1.2-2' }}%
          </span>
        </div>
      </div>

      <div class="warning" *ngIf="newPrice && newPrice <= 0">
        <mat-icon>warning</mat-icon>
        <span>El precio debe ser mayor a 0</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!isValid() || saving">
        <mat-icon *ngIf="!saving">save</mat-icon>
        <mat-icon *ngIf="saving" class="spinner">sync</mat-icon>
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .product-info {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .product-info p {
      margin: 5px 0;
      color: #333;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .price-summary {
      background-color: #e3f2fd;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .summary-row:last-child {
      margin-bottom: 0;
    }

    .positive {
      color: #2e7d32;
      font-weight: 600;
    }

    .negative {
      color: #c62828;
      font-weight: 600;
    }

    .warning {
      display: flex;
      align-items: center;
      gap: 10px;
      background-color: #fff3e0;
      padding: 12px;
      border-radius: 4px;
      color: #e65100;
    }

    .warning mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    mat-dialog-content {
      min-width: 400px;
      max-width: 500px;
    }
  `]
})
export class PriceChangeDialogComponent {
  private priceChangeService = inject(PriceChangeService);
  public settingsService = inject(SettingsService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<PriceChangeDialogComponent>);

  newPrice: number = 0;
  difference: number = 0;
  percentageChange: number = 0;
  saving: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PriceChangeDialogData) {
    this.newPrice = data.currentPrice;
    this.calculateDifference();
  }

  calculateDifference() {
    const price = Number(this.newPrice);
    const currentPrice = Number(this.data.currentPrice) || 0;

    if (price && price > 0) {
      this.difference = price - currentPrice;
      this.percentageChange = currentPrice > 0
        ? (this.difference / currentPrice) * 100
        : 0;
    } else {
      this.difference = 0;
      this.percentageChange = 0;
    }
  }

  isValid(): boolean {
    const price = Number(this.newPrice);
    const currentPrice = Number(this.data.currentPrice) || 0;
    return price > 0 && price !== currentPrice;
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (!this.isValid()) {
      return;
    }

    this.saving = true;

    this.priceChangeService.updateProductPrice(this.data.productId, Number(this.newPrice)).subscribe({
      next: (response) => {
        this.saving = false;
        this.snackBar.open('Precio actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(response.product);
      },
      error: (err) => {
        console.error('Error updating price:', err);
        this.saving = false;
        this.snackBar.open('Error al actualizar el precio', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
