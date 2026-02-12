import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DistributionOrdersService } from '../../../../core/services/distribution-orders.service';
import { DistributionOrder, DistributionLine } from '../../../../core/models/distribution-orders.model';
import { WarehouseService } from '../../../../core/services/warehouse.service';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService, Category } from '../../../../core/services/category.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

interface ProductLine extends DistributionLine {
    available_stock?: number;
}

@Component({
    selector: 'app-distribution-order-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './distribution-order-form.component.html',
    styleUrls: ['./distribution-order-form.component.css'],
    styles: [`
        .relative { position: relative; }
        .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .search-item {
            padding: 8px 12px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eee;
        }
        .search-item:hover { background-color: #f5f5f5; }
        .search-item .name { font-weight: 500; flex: 1; }
        .search-item .code { color: #666; font-size: 12px; margin: 0 10px; }
        .search-item .price { color: #2e7d32; font-weight: bold; }
        .selected-product-info {
            font-size: 12px;
            color: #1976d2;
            margin-top: 4px;
        }
    `]
})
export class DistributionOrderFormComponent implements OnInit {
    order: Partial<DistributionOrder> = {
        origin_location_id: 0,
        origin_location_name: '',
        destination_location_name: '',
        notes: '',
        lines: []
    };

    locations: any[] = [];
    categories: Category[] = [];
    categoryProducts: any[] = [];
    selectedCategoryId: number | null = null;
    searchResults: any[] = [];
    selectedProduct: any = null;
    quantity: number = 0;

    loading = false;
    error: string | null = null;

    private searchSubject = new Subject<string>();

    constructor(
        private distributionService: DistributionOrdersService,
        private warehouseService: WarehouseService,
        private productService: ProductService,
        private categoryService: CategoryService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadLocations();
        this.loadCategories();
        this.setupSearch();
    }

    setupSearch(): void {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                if (term.trim().length < 2) {
                    this.searchResults = [];
                    return [];
                }
                const filters: any = { search: term };
                if (this.order.origin_location_id) {
                    filters.locationId = this.order.origin_location_id;
                }
                return this.productService.getAll(1, 10, filters);
            })
        ).subscribe({
            next: (response: any) => {
                this.searchResults = response.data;
            },
            error: (err) => console.error('Error in product search', err)
        });
    }

    loadLocations(): void {
        this.warehouseService.getAll().subscribe({
            next: (data) => {
                // Filter to show only factory/warehouse type for origin
                this.locations = data.filter(l => l.type === 'factory');

                // If there's only one location, select it automatically
                if (this.locations.length === 1) {
                    this.order.origin_location_id = this.locations[0].id;
                }
            },
            error: (err) => console.error('Error loading locations', err)
        });
    }

    onOriginLocationChange(): void {
        // Clear current selections when origin changes
        this.selectedCategoryId = null;
        this.categoryProducts = [];
        this.selectedProduct = null;
        this.searchResults = [];
    }

    loadCategories(): void {
        this.categoryService.getAll(1, 100).subscribe({
            next: (response) => this.categories = response.data,
            error: (err) => console.error('Error loading categories', err)
        });
    }

    onCategoryChange(categoryId: number): void {
        this.selectedCategoryId = categoryId;
        this.categoryProducts = [];
        this.selectedProduct = null;

        if (categoryId) {
            const filters: any = { category: categoryId };
            if (this.order.origin_location_id) {
                filters.locationId = this.order.origin_location_id;
            }

            this.productService.getAll(1, 100, filters).subscribe({
                next: (response) => {
                    this.categoryProducts = response.data;
                },
                error: (err) => console.error('Error loading products for category', err)
            });
        }
    }

    searchProducts(term: string): void {
        this.searchSubject.next(term);
    }

    selectProduct(product: any): void {
        this.selectedProduct = product;
        this.searchResults = [];
        // Optional: clear the input field if needed via template binding
    }

    addProduct(): void {
        if (!this.selectedProduct || this.quantity <= 0) {
            alert('Seleccione un producto y cantidad válida');
            return;
        }

        // Check if product already exists in lines
        const existingLine = this.order.lines?.find(
            (line: DistributionLine) => line.product_id === this.selectedProduct.id
        );

        if (existingLine) {
            existingLine.quantity_sent += this.quantity;
        } else {
            const newLine: DistributionLine = {
                product_id: this.selectedProduct.id,
                product_name: this.selectedProduct.name,
                product_code: this.selectedProduct.code || this.selectedProduct.reference,
                quantity_sent: this.quantity,
                unit_cost: this.selectedProduct.pricebuy || 0
            };
            this.order.lines = [...(this.order.lines || []), newLine];
        }

        // Reset selection
        this.selectedProduct = null;
        this.quantity = 0;
    }

    removeLine(index: number): void {
        this.order.lines = this.order.lines?.filter((_: any, i: number) => i !== index) || [];
    }

    updateQuantity(line: DistributionLine, newQuantity: number): void {
        if (newQuantity > 0) {
            line.quantity_sent = newQuantity;
        }
    }

    getTotalItems(): number {
        return this.order.lines?.reduce((sum: number, line: DistributionLine) => sum + line.quantity_sent, 0) || 0;
    }

    canSubmit(): boolean {
        return !!(
            this.order.origin_location_id &&
            this.order.destination_location_name &&
            this.order.lines &&
            this.order.lines.length > 0
        );
    }

    submit(): void {
        if (!this.canSubmit()) {
            alert('Complete todos los campos requeridos');
            return;
        }

        this.loading = true;
        this.error = null;

        this.distributionService.createOrder(this.order).subscribe({
            next: (response: any) => {
                alert('Orden de distribución creada exitosamente');
                this.router.navigate(['/dashboard/inventario/distribution-orders']);
            },
            error: (err: any) => {
                this.error = err.error?.error || 'Error al crear la orden';
                alert(this.error);
                this.loading = false;
            }
        });
    }

    cancel(): void {
        this.router.navigate(['/dashboard/inventario/distribution-orders']);
    }
}
