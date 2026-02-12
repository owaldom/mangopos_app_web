import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { SharedPaginatorComponent } from '../../../shared/components/shared-paginator/shared-paginator.component';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SupplierService, Supplier } from '../../../core/services/supplier.service';
import { SettingsService } from '../../../core/services/settings.service';
import { SupplierDialogComponent } from './supplier-dialog/supplier-dialog.component';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';

@Component({
    selector: 'app-suppliers',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatDialogModule,
        MatSnackBarModule,
        MatPaginatorModule,
        SharedPaginatorComponent,
        MatSortModule,
        MatTooltipModule,
        PhoneFormatPipe
    ],
    templateUrl: './suppliers.component.html',
    styleUrls: ['./suppliers.component.css']
})
export class SuppliersComponent implements OnInit {
    private supplierService = inject(SupplierService);
    public settingsService = inject(SettingsService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    suppliers: Supplier[] = [];
    displayedColumns: string[] = ['cif', 'name', 'phone', 'email', 'total_paid', 'balance', 'actions'];
    searchText = '';
    loading = false;

    totalElements = 0;
    pageSize = 50;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    ngOnInit(): void {
        this.loadSuppliers();
    }

    loadSuppliers(page: number = 1) {
        this.loading = true;
        this.supplierService.getAll(page, this.pageSize, this.searchText).subscribe({
            next: (res) => {
                this.suppliers = res.data;
                this.totalElements = res.total;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading suppliers', err);
                this.loading = false;
                this.snackBar.open('Error al cargar proveedores', 'Cerrar', { duration: 3000 });
            }
        });
    }

    onPageChange(event: any) {
        this.loadSuppliers(event.pageIndex + 1);
    }

    search() {
        this.loadSuppliers();
    }

    clearSearch() {
        this.searchText = '';
        this.loadSuppliers();
    }

    openDialog(supplier?: Supplier) {
        const dialogRef = this.dialog.open(SupplierDialogComponent, {
            width: '900px',
            maxWidth: '95vw',
            data: supplier || null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadSuppliers();
                this.snackBar.open(
                    supplier ? 'Proveedor actualizado' : 'Proveedor creado',
                    'Cerrar',
                    { duration: 3000 }
                );
            }
        });
    }

    openViewDialog(supplier: Supplier) {
        this.dialog.open(SupplierDialogComponent, {
            width: '900px',
            maxWidth: '95vw',
            data: { supplier, viewOnly: true }
        });
    }

    delete(supplier: Supplier) {
        if (confirm(`¿Está seguro de eliminar al proveedor "${supplier.name}"?`)) {
            this.supplierService.delete(supplier.id).subscribe({
                next: () => {
                    this.loadSuppliers();
                    this.snackBar.open('Proveedor eliminado', 'Cerrar', { duration: 3000 });
                },
                error: (err) => {
                    console.error('Error removing supplier', err);
                    this.snackBar.open('Error al eliminar proveedor', 'Cerrar', { duration: 3000 });
                }
            });
        }
    }
}
