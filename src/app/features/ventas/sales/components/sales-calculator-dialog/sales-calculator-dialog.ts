import { Component, OnInit, ViewChild, ElementRef, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { ProductService, Product } from '../../../../../core/services/product.service';
import { SettingsService } from '../../../../../core/services/settings.service';
import { UnitService } from '../../../../../core/services/unit.service';
import { MoneyInputDirective } from '../../../../../shared/directives/money-input.directive';

@Component({
    selector: 'app-sales-calculator-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatAutocompleteModule,
        MatSnackBarModule,
        MoneyInputDirective
    ],
    templateUrl: './sales-calculator-dialog.html',
    styleUrls: ['./sales-calculator-dialog.css']
})
export class SalesCalculatorDialogComponent implements OnInit {
    searchControl = new FormControl('');
    barcode: string = '';
    currencyMode: 'Bs' | 'USD' = 'Bs';
    amountToBuy: number = 0;
    calculatedQuantity: number = 0;

    filteredProducts: Product[] = [];
    selectedProduct: any | null = null;
    exchangeRate: number = 1;

    @ViewChild('barcodeInput') barcodeInput!: ElementRef;

    private productService = inject(ProductService);
    private snackBar = inject(MatSnackBar);
    public settingsService = inject(SettingsService);
    private unitService = inject(UnitService);

    unitsMap: Map<string, string> = new Map();

    constructor(
        public dialogRef: MatDialogRef<SalesCalculatorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { exchangeRate: number }
    ) {
        this.exchangeRate = data.exchangeRate || 1;
    }

    ngOnInit(): void {
        this.unitService.getAll().subscribe(units => {
            units.forEach(u => this.unitsMap.set(u.code, u.name));
        });

        this.setupAutocomplete();
        setTimeout(() => this.focusBarcode(), 500);
    }

    getUnitName(code: string): string {
        return this.unitsMap.get(code) || code;
    }

    setupAutocomplete(): void {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(value => {
                if (typeof value === 'string' && value.length >= 2) {
                    return this.productService.getAll(1, 10, {
                        search: value,
                        marketable: true,
                        iscom: true,
                        isscale: true,
                        incatalog: true
                    });
                } else {
                    return of({ data: [] });
                }
            })
        ).subscribe((res: any) => {
            this.filteredProducts = res.data;
        });
    }

    displayProduct(product: Product): string {
        return product ? product.name : '';
    }

    onProductSelected(event: any): void {
        const product = event.option.value;
        this.selectProductInternal(product);
    }

    onBarcodeEnter(event: any): void {
        const code = event.target.value?.trim();
        if (!code) {
            this.barcode = '';
            return;
        }

        this.productService.getAll(1, 1, {
            search: code,
            marketable: true,
            iscom: true,
            isscale: true,
            incatalog: true
        }).subscribe((res: any) => {
            if (res.data && res.data.length > 0) {
                // Exact match check
                const product = res.data.find((p: any) => p.code === code || p.reference === code) || res.data[0];
                if (product.code === code || product.reference === code) {
                    this.selectProductInternal(product);
                    this.barcode = '';
                    this.searchControl.setValue(product, { emitEvent: false }); // Sync search box
                } else {
                    this.snackBar.open('Producto no encontrado (coincidencia exacta)', 'Cerrar', { duration: 2000 });
                    this.barcode = '';
                }
            } else {
                this.snackBar.open('Código no encontrado', 'Cerrar', { duration: 2000 });
                this.barcode = '';
            }
        });
    }

    selectProductInternal(product: any): void {
        this.selectedProduct = { ...product }; // Copy to avoid mutating original list item directly if needed
        // Map stock_current to stock if missing (handling discrepancies)
        if (this.selectedProduct.stock === undefined && this.selectedProduct.stock_current !== undefined) {
            this.selectedProduct.stock = this.selectedProduct.stock_current;
        }

        this.calculatedQuantity = 0;
        this.amountToBuy = 0;
    }

    clearSearch(): void {
        this.searchControl.setValue('');
        this.onClear();
    }

    onClear(): void {
        this.selectedProduct = null;
        this.calculatedQuantity = 0;
        this.amountToBuy = 0;
        this.searchControl.setValue('');
        this.barcode = '';
        this.focusBarcode();
    }

    focusBarcode(): void {
        if (this.barcodeInput) {
            this.barcodeInput.nativeElement.focus();
        }
    }

    setCurrency(mode: 'Bs' | 'USD'): void {
        this.currencyMode = mode;
        this.calculate(); // Recalculate if amount exists
    }

    calculate(): void {
        if (!this.selectedProduct || !this.amountToBuy || this.amountToBuy <= 0) {
            this.calculatedQuantity = 0;
            return;
        }

        const priceUSD = this.selectedProduct.pricesell;
        if (priceUSD <= 0) {
            this.snackBar.open('El producto no tiene precio válido.', 'Cerrar', { duration: 3000 });
            return;
        }

        if (this.currencyMode === 'Bs') {
            const priceBs = priceUSD * this.exchangeRate;
            this.calculatedQuantity = this.amountToBuy / priceBs;
        } else {
            this.calculatedQuantity = this.amountToBuy / priceUSD;
        }

        // Safety Rounding (3 decimals)
        // this.calculatedQuantity = Math.floor(this.calculatedQuantity * 1000) / 1000;
    }

    onSelect(): void {
        if (!this.selectedProduct || this.calculatedQuantity <= 0) {
            return;
        }

        // Validation
        const isService = !!(this.selectedProduct.servicio && this.selectedProduct.servicio !== '0' && this.selectedProduct.servicio !== false);
        const isCompound = this.selectedProduct.typeproduct === 'CO';
        const isKit = this.selectedProduct.typeproduct === 'KI';

        if (!isService && !isCompound && !isKit && this.selectedProduct.stock < this.calculatedQuantity) {
            const confirm = window.confirm(`Stock insuficiente (${this.selectedProduct.stock}). ¿Continuar con stock negativo?`);
            if (!confirm) return;
        }

        this.dialogRef.close({
            product: this.selectedProduct,
            quantity: this.calculatedQuantity
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
