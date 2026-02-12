import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SalesService } from '../../../../../core/services/sales.service';
import { SettingsService } from '../../../../../core/services/settings.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ScaleWeightDialogComponent } from '../scale-weight-dialog/scale-weight-dialog';
import { ProductImageDialogComponent } from '../product-image-dialog/product-image-dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css'
})
export class CatalogComponent implements OnInit {
  categories: any[] = [];
  products: any[] = [];
  selectedCategory: any = null;
  currentParentId: number | null = null;
  navigationHistory: any[] = [];
  displayedCategories: any[] = [];
  filteredProducts: any[] = [];
  exchangeRate: number = 1;
  searchText: string = '';
  @ViewChild('searchInput') searchInput!: ElementRef;
  @Output() productSelected = new EventEmitter<{ product: any, units?: number }>();
  private subscription = new Subscription();

  get topLevelCategories(): any[] {
    return this.categories.filter(c => c.parentid === null || c.parentid === undefined);
  }

  constructor(
    private salesService: SalesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this.salesService.currentLocationId$.subscribe(id => {
        if (id) {
          this.refresh();
        }
      })
    );
    this.subscription.add(
      this.salesService.exchangeRate$.subscribe(rate => {
        this.exchangeRate = rate;
      })
    );
  }

  refresh(): void {
    this.salesService.getCatalog().subscribe(data => {
      this.categories = data.categories;
      this.products = data.products;
      this.updateDisplay();
    });
  }

  updateDisplay(): void {
    if (this.searchText) {
      const search = this.searchText.toLowerCase();

      if (!this.selectedCategory) {
        // EN RAÍZ: Búsqueda global de categorías y PRODUCTOS
        this.displayedCategories = this.categories.filter(c =>
          c.name.toLowerCase().includes(search)
        );

        this.filteredProducts = this.products.filter(p =>
          p.incatalog && p.marketable && (
            p.name.toLowerCase().includes(search) ||
            p.code?.toLowerCase().includes(search) ||
            p.reference?.toLowerCase().includes(search)
          )
        );
      } else {
        // DENTRO DE CATEGORÍA: Búsqueda local (solo hijos directos de la categoría seleccionada)
        this.displayedCategories = this.categories.filter(c =>
          c.parentid === this.currentParentId &&
          c.name.toLowerCase().includes(search)
        );

        this.filteredProducts = this.products.filter(p =>
          p.category === this.selectedCategory.id && (
            p.name.toLowerCase().includes(search) ||
            p.code?.toLowerCase().includes(search) ||
            p.reference?.toLowerCase().includes(search)
          )
        ).filter(p => p.incatalog && p.marketable);
      }
    } else {
      // NAVEGACIÓN NORMAL (Sin búsqueda)
      this.displayedCategories = this.categories.filter(c => c.parentid === this.currentParentId);

      if (this.selectedCategory) {
        this.filteredProducts = this.products.filter(p =>
          p.category === this.selectedCategory.id && p.incatalog && p.marketable
        );
      } else {
        // MOSTRAR TODOS los productos cuando no hay categoría seleccionada
        this.filteredProducts = this.products.filter(p => p.incatalog && p.marketable);
      }
    }
  }

  onSearch(text: any): void {
    this.searchText = text?.toString() || '';
    this.updateDisplay();
  }

  focusSearch(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  selectCategory(category: any): void {
    this.searchText = '';
    this.buildCategoryPath(category);
    this.currentParentId = category.id;
    this.selectedCategory = category;
    this.updateDisplay();
  }

  private buildCategoryPath(category: any): void {
    const path = [];
    let current = category;

    while (current) {
      path.unshift(current);
      if (current.parentid) {
        current = this.categories.find(c => c.id === current.parentid);
      } else {
        current = null;
      }
    }

    this.navigationHistory = path;
  }

  back(): void {
    this.searchText = '';
    if (this.navigationHistory.length > 0) {
      this.navigationHistory.pop();
      const previous = this.navigationHistory[this.navigationHistory.length - 1];
      this.currentParentId = previous ? previous.id : null;
      this.selectedCategory = previous || null;
      this.updateDisplay();
    }
  }

  navigateTo(category: any): void {
    this.searchText = '';
    this.buildCategoryPath(category);
    this.currentParentId = category.id;
    this.selectedCategory = category;
    this.updateDisplay();
  }

  addToTicket(product: any): void {
    // El componente padre (SalesComponent) se encargará de la validación de stock,
    // del manejo de balanzas (si aplica) y de la lógica de Kits (Combos).
    this.productSelected.emit({ product });
  }

  openImagePopup(event: MouseEvent, product: any): void {
    event.stopPropagation();
    this.dialog.open(ProductImageDialogComponent, {
      width: 'auto',
      maxWidth: '90vw',
      data: {
        image: product.image,
        productName: product.name
      }
    });
  }

  private executeAdd(product: any, units: number): void {
    const customer = this.salesService.getSelectedCustomer();
    this.salesService.addLineWithDiscount(product, units, customer?.id);
  }
}
