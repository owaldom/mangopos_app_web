import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MoneyInputDirective } from '../../../../../shared/directives/money-input.directive';

@Component({
  selector: 'app-discount-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MoneyInputDirective
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ getIcon() }}</mat-icon>
      {{ getTitle() }}
    </h2>
    <mat-dialog-content>
      <div class="input-container">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Valor</mat-label>
          
          <input matInput 
                 *ngIf="type !== 'PERCENT'"
                 [(ngModel)]="value" 
                 appMoneyInput 
                 decimalType="price"
                 (keyup.enter)="onConfirm()"
                 placeholder="0.00"
                 cdkFocusInitial>

          <input matInput 
                 *ngIf="type === 'PERCENT'"
                 [(ngModel)]="value" 
                 appMoneyInput 
                 decimalType="percent"
                 (keyup.enter)="onConfirm()"
                 placeholder="0"
                 cdkFocusInitial>

           <span matSuffix *ngIf="type === 'PERCENT'">%</span>
           <span matSuffix *ngIf="type === 'FIXED'">$</span>
           <span matSuffix *ngIf="type === 'FIXED_VES'">Bs.</span>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">CANCELAR</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!isValid()">APLICAR</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-top: 10px;
    }
    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #3875D5;
    }
    .input-container {
        display: flex;
        justify-content: center;
        padding: 10px 0;
    }
    input {
        font-size: 1.5rem;
        text-align: center;
    }
  `]
})
export class DiscountDialogComponent {
  value: number | null = 0;
  type: 'PERCENT' | 'FIXED' | 'FIXED_VES' = 'PERCENT';

  constructor(
    public dialogRef: MatDialogRef<DiscountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: 'PERCENT' | 'FIXED' | 'FIXED_VES' }
  ) {
    this.type = data.type;
  }

  getIcon(): string {
    switch (this.type) {
      case 'PERCENT': return 'percent';
      case 'FIXED': return 'attach_money';
      case 'FIXED_VES': return 'payments';
      default: return 'local_offer';
    }
  }

  getTitle(): string {
    switch (this.type) {
      case 'PERCENT': return 'Descuento Porcentual';
      case 'FIXED': return 'Descuento Fijo ($)';
      case 'FIXED_VES': return 'Descuento Fijo (Bs.)';
      default: return 'Aplicar Descuento';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.isValid()) {
      this.dialogRef.close(this.value);
    }
  }

  isValid(): boolean {
    return this.value !== null && this.value >= 0;
  }
}
