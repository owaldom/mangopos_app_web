import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-product-image-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    template: `
    <div class="image-dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>{{ data.productName }}</h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div mat-dialog-content class="image-content">
        <img [src]="'data:image/png;base64,' + data.image" [alt]="data.productName">
      </div>
    </div>
  `,
    styles: [`
    .image-dialog-container {
      display: flex;
      flex-direction: column;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid #eee;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }
    .image-content {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      overflow: auto;
    }
    img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
  `]
})
export class ProductImageDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ProductImageDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { image: string, productName: string }
    ) { }

    onClose(): void {
        this.dialogRef.close();
    }
}
