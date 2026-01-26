import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';

import {
    PriceChangeService,
    PriceChangeFilter,
    ProductForPriceChange,
    ProductPricePreview
} from '../../../core/services/price-change.service';
import { CategoryService } from '../../../core/services/category.service';
import { SettingsService } from '../../../core/services/settings.service';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';

@Component({
    selector: 'app-bulk-price-change',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatSnackBarModule,
        MatDividerModule,
        MatProgressSpinnerModule,
        MoneyInputDirective
    ],
    templateUrl: './bulk-price-change.component.html',
    styleUrl: './bulk-price-change.component.css'
})
export class BulkPriceChangeComponent implements OnInit {
    private priceChangeService = inject(PriceChangeService);
    private categoryService = inject(CategoryService);
    public settingsService = inject(SettingsService);
    private snackBar = inject(MatSnackBar);

    // Filtros
    filters: PriceChangeFilter = { categoryId: 'all' };
    categories: any[] = [];

    // Configuración de cambio
    changeType: 'percentage' | 'amount' = 'percentage';
    changeAction: 'increase' | 'decrease' = 'increase';
    changeValue: number = 0;

    // Productos
    products: ProductForPriceChange[] = [];
    previewProducts: ProductPricePreview[] = [];
    selection = new SelectionModel<ProductForPriceChange>(true, []);

    // Estados
    loading = false;
    showPreview = false;
    @ViewChild('barcodeInput') barcodeInput!: any;

    // Columnas de la tabla
    displayedColumns: string[] = ['select', 'name', 'code', 'reference', 'category', 'pricebuy', 'pricesell'];
    previewColumns: string[] = ['name', 'code', 'currentPrice', 'newPrice', 'difference', 'percentage'];

    ngOnInit() {
        this.loadCategories();
        // Focus barcode on start
        setTimeout(() => this.focusBarcode(), 500);
    }

    focusBarcode() {
        if (this.barcodeInput) {
            this.barcodeInput.nativeElement.focus();
        }
    }

    loadCategories() {
        this.categoryService.getAll(1, 1000).subscribe({
            next: (response) => {
                this.categories = response.data;
            },
            error: (err) => {
                console.error('Error loading categories:', err);
            }
        });
    }

    searchProducts() {
        if (!this.hasFilters()) {
            this.snackBar.open('Debe aplicar al menos un filtro', 'Cerrar', { duration: 3000 });
            return;
        }

        this.loading = true;
        this.showPreview = false;
        this.selection.clear();

        // Limpiar filtros para el servicio (evitar enviar 'all' al backend)
        const activeFilters = { ...this.filters };
        if (activeFilters.categoryId === 'all') {
            activeFilters.categoryId = undefined;
        }

        this.priceChangeService.filterProducts(activeFilters).subscribe({
            next: (products) => {
                this.products = products;
                this.loading = false;

                if (products.length === 0) {
                    this.snackBar.open('No se encontraron productos con los filtros aplicados', 'Cerrar', { duration: 3000 });
                } else {
                    this.snackBar.open(`Se encontraron ${products.length} productos`, 'Cerrar', { duration: 2000 });
                }
                this.focusBarcode();
            },
            error: (err) => {
                console.error('Error filtering products:', err);
                this.loading = false;
                this.snackBar.open('Error al buscar productos', 'Cerrar', { duration: 3000 });
                this.focusBarcode();
            }
        });
    }

    hasFilters(): boolean {
        return !!(
            this.filters.barcode ||
            this.filters.name ||
            this.filters.categoryId || // Incluye 'all' como valor válido
            this.filters.priceBuyMin ||
            this.filters.priceBuyMax ||
            this.filters.priceSellMin ||
            this.filters.priceSellMax
        );
    }

    clearFilters() {
        this.filters = { categoryId: 'all' };
        this.products = [];
        this.previewProducts = [];
        this.selection.clear();
        this.showPreview = false;
        this.focusBarcode();
    }

    generatePreview() {
        if (this.selection.selected.length === 0) {
            this.snackBar.open('Debe seleccionar al menos un producto', 'Cerrar', { duration: 3000 });
            return;
        }

        if (!this.changeValue || this.changeValue <= 0) {
            this.snackBar.open('El valor de cambio debe ser mayor a 0', 'Cerrar', { duration: 3000 });
            return;
        }

        this.previewProducts = this.priceChangeService.calculatePreview(
            this.selection.selected,
            {
                changeType: this.changeType,
                changeAction: this.changeAction,
                changeValue: this.changeValue
            }
        );

        this.showPreview = true;
    }

    applyChanges() {
        if (this.previewProducts.length === 0) {
            return;
        }

        // Verificar si hay productos con precio 0 o negativo
        const invalidProducts = this.previewProducts.filter(p => p.newPrice <= 0);
        if (invalidProducts.length > 0) {
            this.snackBar.open(
                `${invalidProducts.length} producto(s) quedarían con precio 0 o negativo. Ajuste el valor de cambio.`,
                'Cerrar',
                { duration: 5000 }
            );
            return;
        }

        this.loading = true;

        const config = {
            productIds: this.selection.selected.map(p => p.id),
            changeType: this.changeType,
            changeAction: this.changeAction,
            changeValue: this.changeValue
        };

        this.priceChangeService.applyBulkPriceChange(config).subscribe({
            next: (response) => {
                this.loading = false;
                this.snackBar.open(
                    `${response.updatedCount} productos actualizados correctamente`,
                    'Cerrar',
                    { duration: 3000 }
                );

                // Limpiar y recargar
                this.clearFilters();
            },
            error: (err) => {
                console.error('Error applying price changes:', err);
                this.loading = false;
                this.snackBar.open('Error al aplicar cambios de precios', 'Cerrar', { duration: 3000 });
            }
        });
    }

    // Métodos de selección
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.products.length;
        return numSelected === numRows;
    }

    toggleAllRows() {
        if (this.isAllSelected()) {
            this.selection.clear();
            return;
        }

        this.selection.select(...this.products);
    }

    checkboxLabel(row?: ProductForPriceChange): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
    }
}
