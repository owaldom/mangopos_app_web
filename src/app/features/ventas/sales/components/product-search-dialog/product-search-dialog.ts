import { Component, OnInit, Inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../../../../../core/services/sales.service';
import { SettingsService } from '../../../../../core/services/settings.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ScaleWeightDialogComponent } from '../scale-weight-dialog/scale-weight-dialog';
import { ProductKitService } from '../../../../../core/services/product-kit.service';
import { CompoundProductsService } from '../../../../administracion/inventario/compound-products/compound-products.service';
import { firstValueFrom } from 'rxjs';
import { StockValidation } from '../../../../administracion/inventario/compound-products/compound-products.model';

@Component({
    selector: 'app-product-search-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatSnackBarModule],
    templateUrl: './product-search-dialog.html',
    styleUrl: './product-search-dialog.css'
})
export class ProductSearchDialogComponent implements OnInit {
    products: any[] = [];
    filteredProducts: any[] = [];
    searchText: string = '';
    selectedIndex: number = 0;
    exchangeRate: number = 1;

    @ViewChild('searchInput') searchInput!: ElementRef;

    constructor(
        private dialogRef: MatDialogRef<ProductSearchDialogComponent>,
        private salesService: SalesService,
        public settingsService: SettingsService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private productKitService: ProductKitService,
        private compoundProductsService: CompoundProductsService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    ngOnInit(): void {
        // Load data directly from service cached if available, or fetch
        // Use the SalesService to get catalog data. 
        // Optimization: SalesComponent usually already loaded catalog in CatalogComponent, 
        // but SalesService keeps a cache or we can refetch.

        // To ensure fresh data, we fetch. It's fast enough usually.
        this.salesService.getCatalog().subscribe((res: any) => {
            this.products = this.deduplicate(res.products);
            // Initially show nothing or popular?
            // Let's show nothing or recent? User request: "busqueda".
            this.filteredProducts = [];
        });

        this.salesService.exchangeRate$.subscribe((rate: number) => {
            this.exchangeRate = rate;
        });
    }

    private deduplicate(arr: any[]): any[] {
        if (!arr) return [];
        const seen = new Set();
        return arr.filter(item => {
            if (!item.id) return true;
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }

    ngAfterViewInit() {
        // Focus input
        setTimeout(() => this.searchInput.nativeElement.focus());
    }

    onSearch(text: string): void {
        if (!text) {
            this.filteredProducts = [];
            this.selectedIndex = -1;
            return;
        }
        const term = text.toLowerCase();
        let results = this.products.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term) ||
            p.reference.toLowerCase().includes(term)
        );

        // Filtrar por comprables si se solicita
        if (this.data?.purchasableOnly) {
            results = results.filter(p => p.iscom);
        }

        this.filteredProducts = results.slice(0, 50); // Limit to 50 results for performance
        this.selectedIndex = this.filteredProducts.length > 0 ? 0 : -1;
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (this.selectedIndex < this.filteredProducts.length - 1) {
                this.selectedIndex++;
                this.scrollToSelected();
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (this.selectedIndex > 0) {
                this.selectedIndex--;
                this.scrollToSelected();
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (this.selectedIndex >= 0 && this.filteredProducts[this.selectedIndex]) {
                this.selectProduct(this.filteredProducts[this.selectedIndex]);
            }
        } else if (event.key === 'Escape') {
            this.dialogRef.close();
        }
    }

    scrollToSelected() {
        // Logic to scroll view if needed. 
        // Simplified: Material usually handles focus, but here we manage selection index.
        const el = document.querySelector('.product-item.selected');
        if (el) {
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    async selectProduct(product: any): Promise<void> {
        const allowZeroStock = this.data?.allowZeroStock || false;

        // Detectar si es un producto de servicio o compuesto
        const isService = !!(product.servicio && product.servicio !== '0' && product.servicio !== false);
        const isCompound = product.typeproduct === 'CO';
        const isKit = product.typeproduct === 'KI';

        // 1. Validar Stock para productos Simples (SI)
        if (!allowZeroStock && !isService && !isCompound && !isKit && product.stock <= 0) {
            this.snackBar.open(`No hay stock disponible para ${product.name}`, 'Cerrar', { duration: 3000 });
            return;
        }

        // 2. Validar Stock para Producto Compuesto (CO)
        if (!allowZeroStock && isCompound) {
            try {
                const validation = await firstValueFrom(this.compoundProductsService.validateStock(product.id, 1)) as StockValidation;
                if (!validation.hasStock) {
                    this.snackBar.open(`Faltan insumos para "${product.name}": ${validation.message}`, 'Cerrar', { duration: 5000 });
                    return;
                }
            } catch (err) {
                console.error('Error validating compound stock:', err);
            }
        }

        // 3. Validar Stock para KIT (Combo) - KI
        if (!allowZeroStock && isKit) {
            try {
                const validation = await firstValueFrom(this.productKitService.validateStock(product.id, 1)) as any;
                if (!validation.hasStock) {
                    this.snackBar.open(`Stock insuficiente de componentes para el combo "${product.name}".`, 'Cerrar', { duration: 5000 });
                    return;
                }
            } catch (err) {
                console.error('Error validating kit stock:', err);
            }
        }

        if (product.isscale) {
            const dialogRef = this.dialog.open(ScaleWeightDialogComponent, {
                width: '400px',
                data: { product }
            });

            dialogRef.afterClosed().subscribe(weight => {
                if (weight) {
                    if (!isService && !isCompound && !isKit && weight > product.stock) {
                        this.snackBar.open(`Cantidad pedida (${weight}) excede el stock (${product.stock})`, 'Cerrar', { duration: 3000 });
                        return; // Don't close or add if invalid
                    }
                    // Return the product and quantity to parent
                    this.dialogRef.close({ product, units: weight });
                }
            });
        } else {
            // Return the product and quantity 1
            this.dialogRef.close({ product, units: 1 });
        }
    }
}
