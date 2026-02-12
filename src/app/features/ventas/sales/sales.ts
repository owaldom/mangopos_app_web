import { Component, OnInit, OnDestroy, HostListener, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TicketLinesComponent } from './components/ticket-lines/ticket-lines';
import { CatalogComponent } from './components/catalog/catalog';
import { MatMenuModule } from '@angular/material/menu';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { Warehouse } from '../../../core/models/warehouse.model';

import { SalesService, TicketLine, Currency, SaleRequest } from '../../../core/services/sales.service';
import { KitComponent } from '../../../core/services/product-kit.model';
import { AuthService } from '../../../core/services/auth';
import { SettingsService } from '../../../core/services/settings.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { ProductKitService } from '../../../core/services/product-kit.service';
import { KitSelectionDialogComponent } from './components/kit-selection-dialog/kit-selection-dialog.component';
import { CashService } from '../../../core/services/cash.service';
import { Subscription, firstValueFrom, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PaymentDialogComponent } from './components/payment-dialog/payment-dialog';
import { ProductSearchDialogComponent } from './components/product-search-dialog/product-search-dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PrintService } from '../../../core/services/print.service';
import { SalesHistoryService } from '../../../core/services/sales-history.service';
import { TicketNotesDialogComponent } from './components/ticket-notes-dialog/ticket-notes-dialog';
import { ProductService } from '../../../core/services/product.service';
import { ScaleWeightDialogComponent } from './components/scale-weight-dialog/scale-weight-dialog';
import { SalesCalculatorDialogComponent } from './components/sales-calculator-dialog/sales-calculator-dialog';
import { CompoundProductsService } from '../../administracion/inventario/compound-products/compound-products.service';
import { StockValidation } from '../../administracion/inventario/compound-products/compound-products.model';
import { DiscountDialogComponent } from './components/discount-dialog/discount-dialog';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    TicketLinesComponent,

    CatalogComponent,
    MoneyInputDirective,
    MatMenuModule
  ],
  templateUrl: './sales.html',
  styleUrl: './sales.css'
})
export class SalesComponent implements OnInit, OnDestroy {
  selectedCustomer: any = null;
  total: number = 0;
  subtotal: number = 0;
  taxes: number = 0;
  linesCount: number = 0;
  currentLines: TicketLine[] = [];
  currentLocationName: string = '';
  warehouses: Warehouse[] = [];
  private snackBar = inject(MatSnackBar);
  private productService = inject(ProductService);
  private productKitService = inject(ProductKitService);
  private compoundProductsService = inject(CompoundProductsService);

  currencies: Currency[] = [];
  selectedCurrency: Currency | null = null;
  usdCurrency: Currency | null = null;
  exchangeRate: number = 1;
  totalAlt: number = 0;
  tickets: any[] = [];
  activeTicketIndex: number = 0;
  selectedLineIndex: number = -1;
  Math = Math;

  get isModernLayout(): boolean {
    return this.settingsService.getSettings()?.pos_layout === 'modern';
  }

  get globalDiscountAmount(): number {
    const discount = this.salesService.getGlobalDiscount();
    const type = this.salesService.getGlobalDiscountType();

    if (type === 'FIXED') {
      return discount * this.exchangeRate;
    } else if (type === 'FIXED_VES') {
      return discount;
    } else {
      // Porcentual
      return this.subtotal * discount;
    }
  }

  barcode: string = '';
  private barcodeSubject = new Subject<string>();



  @ViewChild(CatalogComponent) catalog!: CatalogComponent;
  @ViewChild('barcodeInput') barcodeInput!: any;

  private subscription = new Subscription();

  constructor(
    public salesService: SalesService,
    private authService: AuthService,
    private dialog: MatDialog,
    public settingsService: SettingsService,
    private router: Router,
    private printService: PrintService,
    private salesHistoryService: SalesHistoryService,
    private cashService: CashService,
    private warehouseService: WarehouseService,
    private appConfigService: AppConfigService
  ) { }

  async ngOnInit(): Promise<void> {
    // Verificar estado de caja
    const isOpened = await this.cashService.checkStatus();
    if (!isOpened) {
      this.promptCashOpening();
    }

    this.loadCurrencies();
    this.loadWarehouses();
    this.activeTicketIndex = this.salesService.getActiveTicketIndex();

    this.subscription.add(
      this.salesService.currentLines$.subscribe(lines => {
        this.currentLines = lines;
        this.linesCount = lines.length;
        this.calculateTotals(lines);

        // Auto-seleccionar la última línea si no hay selección
        if (this.selectedLineIndex === -1 && lines.length > 0) {
          this.salesService.setSelectedLineIndex(lines.length - 1);
        } else if (lines.length === 0) {
          this.salesService.setSelectedLineIndex(-1);
        }
      })
    );

    this.subscription.add(
      this.salesService.selectedLineIndex$.subscribe(idx => {
        this.selectedLineIndex = idx;
      })
    );

    this.subscription.add(
      this.salesService.tickets$.subscribe(tickets => {
        this.tickets = tickets;
      })
    );

    this.subscription.add(
      this.salesService.activeTicketIndex$.subscribe(index => {
        this.activeTicketIndex = index;
      })
    );

    this.subscription.add(
      this.salesService.selectedCustomer$.subscribe(customer => {
        this.selectedCustomer = customer;
      })
    );

    // Focus barcode input on start
    setTimeout(() => this.focusBarcode(), 500);

    // Auto-search logic (Debounced)
    this.subscription.add(
      this.barcodeSubject.pipe(
        debounceTime(400)
      ).subscribe(code => {
        if (code && code.length >= 3) {
          this.processBarcode(code);
        }
      })
    );
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcuts(event: KeyboardEvent) {
    // Si estamos en un input, solo dejar pasar F10 y F2 si no hay conflicto
    const activeElement = document.activeElement;
    const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

    if (event.key === 'F10' || (event.key === '+' && !isInput)) {
      event.preventDefault();
      this.onPay();
    } else if (event.key === 'F2') {
      event.preventDefault();
      // this.catalog.focusSearch(); // Override old behavior
      this.openProductSearch();
    } else if (event.key === 'F4') {
      event.preventDefault();
      this.openCalculator();
    } else if (!isInput) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigateSelection(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.navigateSelection(1);
      } else if (event.key === 'Delete') {
        event.preventDefault();
        this.removeSelectedLine();
      }
    }
  }

  navigateSelection(delta: number): void {
    if (this.currentLines.length === 0) return;
    let newIndex = this.selectedLineIndex + delta;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= this.currentLines.length) newIndex = this.currentLines.length - 1;
    this.salesService.setSelectedLineIndex(newIndex);
  }

  removeSelectedLine(): void {
    if (this.selectedLineIndex >= 0 && this.selectedLineIndex < this.currentLines.length) {
      this.salesService.removeLine(this.selectedLineIndex);
      // La selección se actualiza vía el observable currentLines$
    }
  }

  async promptCashOpening() {
    const { CashOpeningComponent } = await import('../cash-opening/cash-opening');
    const dialogRef = this.dialog.open(CashOpeningComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(opened => {
      if (!opened) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  async openCustomerSelector() {
    const { CustomerSelectorComponent } = await import('./components/customer-selector/customer-selector');
    const dialogRef = this.dialog.open(CustomerSelectorComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(customer => {
      if (customer) {
        this.salesService.setSelectedCustomer(customer);
        this.snackBar.open(`Cliente seleccionado: ${customer.name}`, 'Cerrar', { duration: 3000 });
        this.salesService.refreshAllLineDiscounts(customer.id);
      }
    });
  }

  loadCurrencies(refreshPrices: boolean = false): void {
    this.salesService.getCurrencies().subscribe(currencies => {
      this.currencies = currencies;
      // Encontrar USD para la tasa alternativa
      this.usdCurrency = currencies.find(c => c.code === 'USD') || null;
      if (this.usdCurrency) {
        const decimals = this.settingsService.getSettings()?.price_decimals || 2;
        // Ensure it's a number before calling toFixed
        const rateValue = Number(this.usdCurrency.exchange_rate);
        this.exchangeRate = parseFloat(rateValue.toFixed(decimals));
        this.salesService.setExchangeRate(this.exchangeRate);
      }

      if (refreshPrices) {
        this.salesService.getCatalog().subscribe(catalog => {
          const updated = this.salesService.refreshCartPrices(catalog.products);
          if (updated) {
            this.snackBar.open('Precios y tasas actualizados', 'Cerrar', { duration: 3000 });
          } else {
            this.snackBar.open('Tasas de cambio actualizadas', 'Cerrar', { duration: 2000 });
          }
          this.calculateTotals(this.currentLines);
        });
      } else {
        this.calculateTotals(this.currentLines);
      }
    });
  }

  loadWarehouses(): void {
    const type = this.appConfigService.getInstallationType();
    this.warehouseService.getAll().subscribe(res => {
      // Filtrar por tipo de instalación (vendedor vs fabrica)
      this.warehouses = res.filter(w => w.type === type);
    });
  }

  switchWarehouse(warehouse: Warehouse): void {
    if (warehouse.id === this.salesService.currentLocationId) return;

    this.salesService.setCurrentLocation(warehouse.id, warehouse.name);
    this.snackBar.open(`Cambiado a almacén: ${warehouse.name}`, 'Cerrar', { duration: 2000 });
  }

  get currentLocationName$() {
    return this.salesService.currentLocationName$;
  }

  syncAll(): void {
    this.snackBar.open('Sincronizando datos...', 'Cerrar', { duration: 1000 });
    this.loadCurrencies(true);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  calculateTotals(lines: any[]): void {
    const s = this.settingsService.getSettings();
    const totalDecimals = s?.total_decimals || 2;

    // Los precios en DB están en USD
    const subtotalUSD = lines.reduce((acc, line) => {
      let unitPrice = line.price;
      if (line.discount) {
        if (line.discount_type === 'FIXED') {
          unitPrice = Math.max(0, line.price - line.discount);
        } else if (line.discount_type === 'FIXED_VES') {
          const discountUSD = line.discount / this.exchangeRate;
          unitPrice = Math.max(0, line.price - discountUSD);
        } else {
          unitPrice = line.price * (1 - line.discount);
        }
      }
      return acc + (line.units * unitPrice);

    }, 0);

    const taxesUSD = lines.reduce((acc, line) => {
      let unitPrice = line.price;
      if (line.discount) {
        if (line.discount_type === 'FIXED') {
          unitPrice = Math.max(0, line.price - line.discount);
        } else if (line.discount_type === 'FIXED_VES') {
          const discountUSD = line.discount / this.exchangeRate;
          unitPrice = Math.max(0, line.price - discountUSD);
        } else {
          unitPrice = line.price * (1 - line.discount || 0);
        }
      }
      return acc + (line.units * unitPrice * (line.tax_rate || 0));
    }, 0);

    const globalDiscount = this.salesService.getGlobalDiscount();
    const globalDiscountType = this.salesService.getGlobalDiscountType();

    let subtotalWithLineDiscounts = subtotalUSD + taxesUSD;
    if (globalDiscount) {
      if (globalDiscountType === 'FIXED') {
        this.totalAlt = Math.max(0, subtotalWithLineDiscounts - globalDiscount);
      } else if (globalDiscountType === 'FIXED_VES') {
        const discountUSD = globalDiscount / this.exchangeRate;
        this.totalAlt = Math.max(0, subtotalWithLineDiscounts - discountUSD);
      } else {
        this.totalAlt = subtotalWithLineDiscounts * (1 - globalDiscount);
      }
    } else {
      this.totalAlt = subtotalWithLineDiscounts;
    }

    // Redondear total en USD
    this.totalAlt = parseFloat(this.totalAlt.toFixed(totalDecimals));
    //console.log('Total Alt:', this.totalAlt);

    this.total = this.totalAlt * this.exchangeRate; // Total en Bolívares
    this.total = parseFloat(this.total.toFixed(totalDecimals));

    // Para visualización de desglose en Bolívares
    let factor = 1;
    if (globalDiscount && subtotalWithLineDiscounts > 0) {
      factor = this.totalAlt / subtotalWithLineDiscounts;
    }
    this.subtotal = parseFloat((subtotalUSD * this.exchangeRate * factor).toFixed(totalDecimals));
    this.taxes = parseFloat((taxesUSD * this.exchangeRate * factor).toFixed(totalDecimals));
  }

  updateRate(newRate: any): void {
    const rate = parseFloat(newRate);
    if (!isNaN(rate) && rate > 0) {
      const decimals = this.settingsService.getSettings()?.price_decimals || 2;
      this.exchangeRate = parseFloat(rate.toFixed(decimals));
      this.salesService.setExchangeRate(this.exchangeRate);
      this.calculateTotals(this.currentLines);
    }
  }



  onPay(): void {
    if (this.linesCount === 0) return;

    if (!this.cashService.isOpened()) {
      this.snackBar.open('Debe abrir la caja antes de vender', 'Cerrar', { duration: 3000 });
      this.promptCashOpening();
      return;
    }

    const total = this.salesService.getTotal();
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      height: '95vh',
      data: {
        total,
        subtotal: this.subtotal,
        taxes: this.taxes,
        exchangeRate: this.exchangeRate,
        totalAlt: this.totalAlt,
        money_id: this.cashService.getMoneyId(),
        customer: this.selectedCustomer
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.processPayment(result);
      }
    });
  }

  async processPayment(paymentData: any): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.snackBar.open('Error: Sesión no válida', 'Cerrar', { duration: 3000 });
        return;
      }

      const payments: any[] = [];
      const details = paymentData.paymentDetails || {};

      if (paymentData.method === 'mixed' && paymentData.multiparams) {
        // Process Base Currency
        if (paymentData.multiparams.payments) {
          for (const [key, val] of Object.entries(paymentData.multiparams.payments)) {
            const amount = Number(val);
            if (amount > 0) {
              payments.push({
                method: key,
                total: amount,
                amount_base: amount,
                currency_id: 1, // Base
                exchange_rate: 1,
                bank: details[key]?.bank,
                reference: details[key]?.reference,
                cedula: details[key]?.cedula,
                bank_id: details[key]?.bank_id,
                account_number: details[key]?.account,
                is_pago_movil: details[key]?.is_pago_movil
              });
            }
          }
        }
        // Process Alt Currency
        if (paymentData.multiparams.paymentsAlt) {
          for (const [key, val] of Object.entries(paymentData.multiparams.paymentsAlt)) {
            const amount = Number(val);
            if (amount > 0) {
              payments.push({
                method: key,
                total: amount,
                amount_base: amount * this.exchangeRate,
                currency_id: 2, // USD
                exchange_rate: this.exchangeRate,
                bank: details[key]?.bank,
                reference: details[key]?.reference,
                cedula: details[key]?.cedula,
                bank_id: details[key]?.bank_id,
                account_number: details[key]?.account,
                is_pago_movil: details[key]?.is_pago_movil
              });
            }
          }
        }
      } else {
        // Single Payment
        const d = details[paymentData.method];
        payments.push({
          method: paymentData.method,
          total: paymentData.amount,
          amount_base: paymentData.currency_id === 1 ? paymentData.amount : (paymentData.amount * paymentData.exchange_rate),
          currency_id: paymentData.currency_id,
          exchange_rate: paymentData.exchange_rate,
          bank: d?.bank,
          reference: d?.reference,
          cedula: d?.cedula,
          bank_id: paymentData.bank_id || d?.bank_id,
          account_number: d?.account,
          is_pago_movil: d?.is_pago_movil
        });
      }

      const saleRequest: SaleRequest = {
        person_id: user.id,
        lines: this.currentLines,
        payments: payments,
        total: this.total,
        currency_id: 1, // Bs
        exchange_rate: this.exchangeRate,
        money_id: paymentData.money_id,
        customer_id: this.selectedCustomer?.id || null,
        cash_register_id: this.cashService.getCashRegisterId() || 1,
        notes: this.salesService.getNotes(),
        location_id: this.salesService.currentLocationId || 1,
        igtf_amount: paymentData.igtf_amount || 0,
        igtf_amount_alt: paymentData.igtf_amount_alt || 0,
        change: paymentData.change || 0
      };

      const result = await firstValueFrom(this.salesService.createSale(saleRequest));

      this.snackBar.open(`Venta realizada con éxito. Ticket #${result.ticketNumber}`, 'Cerrar', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });

      // Refrescar catálogo para actualizar stock
      if (this.catalog) {
        this.catalog.refresh();
      }

      // Imprimir ticket con impresora térmica
      if (result.ticketId) {
        this.salesHistoryService.getTicketById(result.ticketId).subscribe(async fullTicket => {
          const printResult = await this.printService.printTicket(fullTicket);

          if (printResult.success && printResult.usedThermal) {
            this.snackBar.open('✅ Ticket impreso correctamente', 'OK', { duration: 2000 });
          } else {
            // Error en impresión - mostrar mensaje claro
            const errorMsg = printResult.error || 'Error desconocido';
            this.snackBar.open(`❌ Error al imprimir: ${errorMsg}`, 'Cerrar', {
              duration: 8000,
              panelClass: ['error-snackbar']
            });
            console.error('Error de impresión:', printResult);
          }
        });
      }

      // Reiniciar estado
      this.salesService.clearTicket();
      this.selectedCustomer = null;

    } catch (error: any) {
      console.error('Error al procesar pago:', error);
      this.snackBar.open('Error al procesar venta: ' + (error.error?.error || error.message), 'Cerrar', {
        duration: 5000
      });
    }
  }

  openProductSearch(): void {
    const dialogRef = this.dialog.open(ProductSearchDialogComponent, {
      width: '800px',
      height: '600px',
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.product) {
        this.addToTicket(result.product, result.units);
      }
    });
  }

  openCalculator(): void {
    const dialogRef = this.dialog.open(SalesCalculatorDialogComponent, {
      width: '600px',
      data: { exchangeRate: this.exchangeRate },
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.product && result.quantity > 0) {
        this.addToTicket(result.product, result.quantity);
      }
    });
  }

  openNotesDialog(): void {
    const dialogRef = this.dialog.open(TicketNotesDialogComponent, {
      width: '500px',
      data: { notes: this.salesService.getNotes() }
    });

    dialogRef.afterClosed().subscribe(notes => {
      if (notes !== undefined) {
        this.salesService.setNotes(notes);
      }
    });
  }

  onBarcodeEnter(event: any): void {
    const code = event.target.value?.trim();
    if (!code) {
      this.barcode = '';
      return;
    }
    this.processBarcode(code);
  }

  onBarcodeChange(value: string): void {
    const code = value?.trim();
    if (code) {
      this.barcodeSubject.next(code);
    }
  }

  processBarcode(code: string): void {
    this.productService.getAll(1, 1, { search: code }).subscribe((res: any) => {
      if (res.data && res.data.length > 0) {
        // Encontrar coincidencia exacta por código o referencia
        const product = res.data.find((p: any) => p.code === code || p.reference === code) || res.data[0];
        if (product.code === code || product.reference === code) {
          this.addToTicket(product);
          this.barcode = '';
          this.snackBar.open(`Agregado: ${product.name}`, 'OK', { duration: 1500 });
        } else {
          this.barcode = '';
          this.snackBar.open('Producto no encontrado por código exacto', 'Cerrar', { duration: 2000 });
        }
      } else {
        this.barcode = '';
        this.snackBar.open('Código no encontrado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  focusBarcode(): void {
    if (this.barcodeInput) {
      this.barcodeInput.nativeElement.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Si no se hizo click en un input o botón, re-enfocar el código de barras
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    const isButton = target.closest('button');

    if (!isInput && !isButton) {
      this.focusBarcode();
    }
  }

  async addToTicket(product: any, units?: number): Promise<void> {
    const quantity = units || 1;
    const currentStock = product.stock !== undefined ? product.stock : (product.stock_current || 0);

    // Detectar si es un producto de servicio o compuesto
    const isService = !!(product.servicio && product.servicio !== '0' && product.servicio !== false);
    const isCompound = product.typeproduct === 'CO';
    const isKit = product.typeproduct === 'KI';

    console.log('Validating Add:', product.name, 'isService:', isService, 'isCompound:', isCompound, 'isKit:', isKit, 'stock:', currentStock);

    // 1. Validar Stock para productos Simples (SI) o Insumos (IN)
    // "Standard" products are usually SI or IN. We validate them directly with the stock in catalog.
    if (!isService && !isCompound && !isKit) {
      if (quantity > currentStock) {
        this.snackBar.open(`Stock insuficiente para ${product.name}. Disponible: ${currentStock}`, 'Cerrar', { duration: 3000 });
        return;
      }
    }

    // 2. Validar Stock para Producto Compuesto (CO)
    if (isCompound) {
      try {
        const validation = await firstValueFrom(this.compoundProductsService.validateStock(product.id, quantity)) as StockValidation;
        if (!validation.hasStock) {
          this.snackBar.open(`Faltan insumos para preparar "${product.name}": ${validation.message}`, 'Cerrar', { duration: 5000 });
          return;
        }
      } catch (err) {
        console.error('Error validating compound stock:', err);
      }
    }

    // 3. Validar Stock para KIT (Combo) - KI
    if (isKit) {
      try {
        const validation = await firstValueFrom(this.productKitService.validateStock(product.id, quantity)) as any;
        if (!validation.hasStock) {
          this.snackBar.open(`Stock insuficiente de componentes para el combo "${product.name}".`, 'Cerrar', { duration: 5000 });
          return;
        }
      } catch (err) {
        console.error('Error validating kit stock:', err);
      }
    }

    // Manejo de KIT (Selección de componentes si es flexible)
    if (isKit) {
      this.productKitService.getKitComponents(product.id).subscribe((components: KitComponent[]) => {
        if (!components || components.length === 0) {
          this.snackBar.open('Este kit no tiene componentes configurados.', 'Cerrar', { duration: 3000 });
          return;
        }

        const isFlexible = components.some((c: KitComponent) => c.group_id);

        if (isFlexible) {
          const dialogRef = this.dialog.open(KitSelectionDialogComponent, {
            width: '500px',
            data: { productName: product.name, components: components }
          });

          dialogRef.afterClosed().subscribe((selectedComponents: any) => {
            if (selectedComponents) {
              this.executeAdd(product, units || 1, selectedComponents);
            }
          });
        } else {
          // Kit Fijo
          this.executeAdd(product, units || 1, components);
        }
      });
      return;
    }

    // Manejo de Balanza
    if (product.isscale && units === undefined) {
      const dialogRef = this.dialog.open(ScaleWeightDialogComponent, {
        width: '400px',
        data: { product }
      });

      dialogRef.afterClosed().subscribe(weight => {
        if (weight) {
          // Re-validar si es balaaanza y simple
          if (!isService && !isCompound && !isKit && weight > currentStock) {
            this.snackBar.open(`Cantidad pedida (${weight}) excede el stock (${currentStock})`, 'Cerrar', { duration: 3000 });
            return;
          }
          this.executeAdd(product, weight);
        }
      });
    } else {
      this.executeAdd(product, quantity);
    }
  }

  private executeAdd(product: any, units: number, selectedComponents?: any[]): void {
    const customerId = this.selectedCustomer?.id;
    this.salesService.addLineWithDiscount(product, units, customerId, selectedComponents);
  }

  requestDiscount(type: 'PERCENT' | 'FIXED' | 'FIXED_VES'): void {
    const dialogRef = this.dialog.open(DiscountDialogComponent, {
      width: '350px',
      data: { type }
    });

    dialogRef.afterClosed().subscribe(value => {
      if (value !== undefined && value !== null) {
        this.applyDiscount(type, value);
      }
    });
  }

  applyDiscount(type: string, value: number): void {
    if (this.selectedLineIndex >= 0 && this.selectedLineIndex < this.currentLines.length) {
      if (type === 'PERCENT') {
        this.salesService.updateLineDiscount(this.selectedLineIndex, value, 'PERCENT');
      } else if (type === 'FIXED') {
        this.salesService.updateLineDiscount(this.selectedLineIndex, value, 'FIXED');
      } else if (type === 'FIXED_VES') {
        this.salesService.updateLineDiscount(this.selectedLineIndex, value, 'FIXED_VES');
      }
    } else {
      if (type === 'PERCENT') {
        this.salesService.setGlobalDiscount(value, 'PERCENT');
        this.snackBar.open(`Descuento global del ${value}% aplicado`, 'Cerrar', { duration: 2000 });
      } else if (type === 'FIXED') {
        this.salesService.setGlobalDiscount(value, 'FIXED');
        this.snackBar.open(`Descuento global de $${value} aplicado`, 'Cerrar', { duration: 2000 });
      } else if (type === 'FIXED_VES') {
        this.salesService.setGlobalDiscount(value, 'FIXED_VES');
        this.snackBar.open(`Descuento global de Bs. ${value} aplicado`, 'Cerrar', { duration: 2000 });
      }
    }
  }

  removeDiscount(): void {
    if (this.selectedLineIndex >= 0 && this.selectedLineIndex < this.currentLines.length) {
      const line = this.currentLines[this.selectedLineIndex];
      this.salesService.updateLineDiscount(this.selectedLineIndex, 0, 'PERCENT');
      this.snackBar.open(`Descuento de línea eliminado`, 'Cerrar', { duration: 2000 });
    } else {
      this.salesService.setGlobalDiscount(0, 'PERCENT');
      this.snackBar.open(`Descuento global eliminado`, 'Cerrar', { duration: 2000 });
    }
  }

  // Multi-ticket actions
  addTicket(): void {
    this.salesService.addTicket();
  }

  selectTicket(index: number): void {
    this.salesService.setActiveTicket(index);
  }

  removeTicket(event: MouseEvent, index: number): void {
    event.stopPropagation();
    this.salesService.removeTicket(index);
  }
}
