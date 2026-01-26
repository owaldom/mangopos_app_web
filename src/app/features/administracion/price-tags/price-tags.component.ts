import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common'; // Added DatePipe just in case, though I used new Date()
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProductService, Product } from '../../../core/services/product.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

interface TagItem {
  product: Product;
  copies: number;
}

@Component({
  selector: 'app-price-tags',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  providers: [DecimalPipe],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Generador de Habladores de Precio</mat-card-title>
          <mat-card-subtitle>Seleccione los productos, configure la moneda y descargue el PDF.</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Configuration -->
          <div class="config-row" style="margin-top: 20px;">
            <mat-form-field appearance="outline" class="currency-select">
              <mat-label>Moneda a Mostrar</mat-label>
              <mat-select [(ngModel)]="selectedCurrencyMode">
                <mat-option value="BS">Solo Bolívares (Bs.)</mat-option>
                <mat-option value="USD">Solo Dólares (USD)</mat-option>
                <mat-option value="BOTH">Ambas Monedas</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="generatePDF()" [disabled]="queue.length === 0">
              <mat-icon>picture_as_pdf</mat-icon> DESCARGAR PDF (REPORTE)
            </button>
            
            <button mat-stroked-button color="warn" (click)="clearQueue()" [disabled]="queue.length === 0">
              <mat-icon>delete_sweep</mat-icon> Limpiar Lista
            </button>
          </div>

          <!-- Filters & Search -->
          <div class="filters-row">
            <mat-form-field appearance="outline" class="category-select">
                <mat-label>Filtrar por Categoría</mat-label>
                <mat-select [(ngModel)]="selectedCategory" (selectionChange)="onCategoryChange()">
                    <mat-option [value]="null">Todas las Categorías</mat-option>
                    <mat-option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</mat-option>
                </mat-select>
            </mat-form-field>

            <button mat-flat-button color="accent" (click)="loadAllProducts()" matTooltip="Cargar todos los productos de la categoría seleccionada">
                <mat-icon>sync</mat-icon> Cargar Todos
            </button>
          </div>

          <!-- Product Search Inputs -->
          <div class="search-row">
            <div class="barcode-container">
              <mat-icon class="barcode-icon">qr_code_scanner</mat-icon>
              <input #barcodeInput type="text" [(ngModel)]="barcode" (keyup.enter)="onBarcodeEnter($event)"
                  placeholder="Escanea Código de Barras..." class="barcode-input">
            </div>

            <mat-form-field appearance="outline" class="flex-grow">
              <mat-label>Buscar por Nombre</mat-label>
              <input matInput [matAutocomplete]="auto" [(ngModel)]="searchText" (input)="onSearchChange()">
              <mat-icon matSuffix>search</mat-icon>
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="addProductToQueue($event.option.value)">
                <mat-option *ngFor="let p of searchResults" [value]="p">
                  <span>{{ p.name }}</span> <small>({{ p.code }})</small>
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>
          </div>

          <!-- Queue Table -->
          <div class="table-container" *ngIf="queue.length > 0">
            <table mat-table [dataSource]="queue" class="mat-elevation-z0">
              
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef> Código </th>
                <td mat-cell *matCellDef="let element"> {{element.product.code}} </td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef> Producto </th>
                <td mat-cell *matCellDef="let element"> {{element.product.name}} </td>
              </ng-container>

              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef> Precio (Base) </th>
                <td mat-cell *matCellDef="let element"> $ {{element.product.pricesell | number:'1.2-2'}} </td>
              </ng-container>

              <ng-container matColumnDef="copies">
                <th mat-header-cell *matHeaderCellDef> Cantidad Etiquetas </th>
                <td mat-cell *matCellDef="let element"> 
                  <input type="number" min="1" [(ngModel)]="element.copies" class="copies-input">
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let element; let i = index">
                  <button mat-icon-button color="warn" (click)="remove(i)">
                    <mat-icon>close</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <div class="empty-state" *ngIf="queue.length === 0">
            <mat-icon>label_off</mat-icon>
            <p>Agregue productos a la lista para generar el PDF.</p>
          </div>

        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .config-row { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
    .filters-row { display: flex; gap: 15px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
    .search-row { display: flex; gap: 15px; align-items: center; margin-bottom: 10px; }
    .full-width { width: 100%; }
    .flex-grow { flex-grow: 1; }
    .currency-select { width: 200px; }
    .category-select { width: 250px; }
    .copies-input { width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; }
    .empty-state { text-align: center; padding: 40px; color: #888; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    
    .barcode-container {
      display: flex;
      align-items: center;
      background: #f0f2f5;
      border-radius: 8px;
      padding: 4px 12px;
      border: 1px solid #ddd;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      width: 250px;
      height: 50px;
    }
    .barcode-container:focus-within {
      border-color: #6200ee;
      background: #fff;
      box-shadow: 0 0 0 2px rgba(98, 0, 238, 0.1);
    }
    .barcode-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #666;
      margin-right: 12px;
    }
    .barcode-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 1rem;
      color: #333;
    }
  `]
})
export class PriceTagsComponent implements OnInit {
  private productService = inject(ProductService);
  public settingsService = inject(SettingsService);
  private categoryService = inject(CategoryService);
  private decimalPipe = inject(DecimalPipe);

  searchText = '';
  searchSubject = new Subject<string>();
  searchResults: Product[] = [];

  queue: TagItem[] = [];
  displayedColumns = ['code', 'name', 'price', 'copies', 'actions'];

  selectedCurrencyMode: 'BS' | 'USD' | 'BOTH' = 'BOTH';

  categories: Category[] = [];
  selectedCategory: number | null = null;

  barcode = '';
  @ViewChild('barcodeInput') barcodeInput!: any;

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      if (term.length > 2) {
        this.performSearch(term);
      } else {
        this.searchResults = [];
      }
    });
  }

  ngOnInit() {
    this.settingsService.loadExchangeRate();
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
      next: (res) => {
        this.categories = res.data;
      },
      error: (err) => console.error('Error loading categories', err)
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }

  onCategoryChange() {
    if (this.searchText.length > 2) {
      this.performSearch(this.searchText);
    }
    this.focusBarcode();
  }

  onBarcodeEnter(event: any) {
    const code = this.barcode?.trim();
    if (!code) return;

    this.productService.getAll(1, 1, { search: code }).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          // Exact match preferred
          const product = res.data.find(p => p.code === code || p.reference === code) || res.data[0];
          if (product.code === code || product.reference === code) {
            this.addProductToQueue(product);
          }
        }
        this.barcode = '';
        this.focusBarcode();
      },
      error: () => {
        this.barcode = '';
        this.focusBarcode();
      }
    });
  }

  performSearch(term: string) {
    this.productService.getAll(1, 10, { search: term, category: this.selectedCategory }).subscribe((res: any) => {
      this.searchResults = res.data;
    });
  }

  loadAllProducts() {
    this.productService.getAll(1, 500, { category: this.selectedCategory }).subscribe({
      next: (res) => {
        res.data.forEach((p: Product) => this.addProductToQueue(p));
      },
      error: (err) => console.error('Error loading all products', err)
    });
  }

  addProductToQueue(product: Product) {
    const existing = this.queue.find(i => i.product.id === product.id);
    if (!existing) {
      this.queue.push({ product, copies: 1 });
      this.refreshTable();
    }
    this.searchText = '';
    this.searchResults = [];
  }

  remove(index: number) {
    this.queue.splice(index, 1);
    this.refreshTable();
  }

  clearQueue() {
    this.queue = [];
    this.refreshTable();
  }

  refreshTable() {
    this.queue = [...this.queue];
  }

  // PDF GENERATION LOGIC
  generatePDF() {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    // Tag dimensions (6cm x 4cm)
    const tagWidth = 60;
    const tagHeight = 40;
    const gap = 3;

    // Grid calculation
    const cols = Math.floor((pageWidth - (margin * 2)) / (tagWidth + gap));
    const rows = Math.floor((pageHeight - (margin * 2)) / (tagHeight + gap));

    let currentX = margin;
    let currentY = margin;
    let colCount = 0;
    let rowCount = 0;

    // Flatten queue based on copies
    const itemsToPrint: Product[] = [];
    this.queue.forEach(item => {
      for (let i = 0; i < item.copies; i++) {
        itemsToPrint.push(item.product);
      }
    });

    itemsToPrint.forEach((product, index) => {
      // New page check
      if (rowCount >= rows) {
        doc.addPage();
        currentX = margin;
        currentY = margin;
        colCount = 0;
        rowCount = 0;
      }

      this.drawTag(doc, product, currentX, currentY, tagWidth, tagHeight);

      // Move position
      colCount++;
      currentX += tagWidth + gap;

      if (colCount >= cols) {
        colCount = 0;
        currentX = margin;
        rowCount++;
        currentY += tagHeight + gap;
      }
    });

    doc.save(`habladores_${new Date().getTime()}.pdf`);
  }

  drawTag(doc: jsPDF, product: Product, x: number, y: number, w: number, h: number) {
    const centerX = x + (w / 2);

    // Border
    doc.setDrawColor(200);
    (doc as any).setLineDash([1, 1], 0); // Dashed for cutting guide
    doc.rect(x, y, w, h);
    (doc as any).setLineDash([], 0); // Reset

    // Product Name (Truncate if too long)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const splitTitle = doc.splitTextToSize(product.name, w - 4);
    // Take max 2 lines
    const titleLines = splitTitle.length > 2 ? splitTitle.slice(0, 2) : splitTitle;
    // Vertically center title in top area
    doc.text(titleLines, centerX, y + 5, { align: 'center' });

    // Prices
    let currentY = y + 16;
    const rate = this.settingsService.getExchangeRate();
    const priceUSD = product.pricesell;
    const priceBS = priceUSD * rate;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');

    if (this.selectedCurrencyMode === 'USD' || this.selectedCurrencyMode === 'BOTH') {
      const txt = `$ ${this.decimalPipe.transform(priceUSD, '1.2-2')}`;
      doc.text(txt, centerX, currentY, { align: 'center' });
      currentY += 6;
    }

    if (this.selectedCurrencyMode === 'BS' || this.selectedCurrencyMode === 'BOTH') {
      const txt = `Bs. ${this.decimalPipe.transform(priceBS, '1.2-2')}`;
      doc.text(txt, centerX, currentY, { align: 'center' });
      currentY += 6;
    }

    // Barcode
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, product.code, {
        format: "CODE128",
        displayValue: false, // We'll print the code manually below
        width: 2,
        height: 30,
        margin: 0
      });
      const barcodeData = canvas.toDataURL("image/png");

      // Calc barcode dims to fit
      const bcWidth = w - 10;
      const bcHeight = 10;
      doc.addImage(barcodeData, 'PNG', x + 5, y + h - 14, bcWidth, bcHeight);

      // Text code
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(product.code, centerX, y + h - 2, { align: 'center' });

    } catch (e) {
      console.error('Error rendering barcode PDF', e);
    }
  }
}
