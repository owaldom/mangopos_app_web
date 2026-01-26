import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SupplierService } from '../../../../../../core/services/supplier.service';

@Component({
  selector: 'app-supplier-selector-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Seleccionar Proveedor</h2>
    <mat-dialog-content>
      <div class="search-box">
        <input type="text" [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Buscar por nombre o RIF..." autofocus>
        <mat-icon>search</mat-icon>
      </div>
      <div class="supplier-list">
        <div *ngFor="let s of suppliers" class="supplier-item" (click)="select(s)">
          <div class="info">
            <span class="name">{{ s.name }}</span>
            <span class="rif">{{ s.rif || s.cif }}</span>
          </div>
          <mat-icon>chevron_right</mat-icon>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .search-box {
      display: flex;
      align-items: center;
      background: #f4f6f8;
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .search-box input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 16px;
    }
    .supplier-list {
      max-height: 400px;
      overflow-y: auto;
    }
    .supplier-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background 0.2s;
    }
    .supplier-item:hover { background: #f0f7ff; }
    .info { display: flex; flex-direction: column; }
    .name { font-weight: 600; font-size: 15px; }
    .rif { font-size: 12px; color: #777; }
  `]
})
export class SupplierSelectorDialogComponent implements OnInit {
  search: string = '';
  suppliers: any[] = [];
  public dialogRef = inject(MatDialogRef<SupplierSelectorDialogComponent>);
  private supplierService = inject(SupplierService);

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.supplierService.getAll(1, 100, this.search).subscribe((res: any) => {
      this.suppliers = res.data;
    });
  }

  onSearch() {
    this.loadSuppliers();
  }

  select(supplier: any) {
    this.dialogRef.close(supplier);
  }
}
