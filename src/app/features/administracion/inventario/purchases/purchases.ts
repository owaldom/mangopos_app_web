import { Component, OnInit, OnDestroy, ViewChild, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PurchaseService, PurchaseLine } from '../../../../core/services/purchase.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ProductService } from '../../../../core/services/product.service';
import { SalesService } from '../../../../core/services/sales.service';
import { AuthService } from '../../../../core/services/auth';
import { CashService } from '../../../../core/services/cash.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { CurrencyPipe } from '@angular/common';
import { MoneyInputDirective } from '../../../../shared/directives/money-input.directive';
import { TaxService, Tax } from '../../../../core/services/tax.service';

@Component({
    selector: 'app-purchases',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatDialogModule,
        MatSnackBarModule,
        MoneyInputDirective
    ],
    providers: [CurrencyPipe],
    templateUrl: './purchases.html',
    styleUrl: './purchases.css'
})
export class PurchasesComponent implements OnInit, OnDestroy {
    currentLines: PurchaseLine[] = [];
    selectedSupplier: any = null;
    selectedLineIndex: number = -1;

    total: number = 0; // Total in Bs
    subtotal: number = 0; // Subtotal in Bs
    taxes: number = 0; // Taxes in Bs

    totalUSD: number = 0;
    subtotalUSD: number = 0;
    taxesUSD: number = 0;
    globalDiscount: number = 0; // percentage (0-1)
    discountTotalUSD: number = 0;

    exchangeRate: number = 1;
    barcode: string = '';
    private barcodeSubject = new Subject<string>();

    taxesList: Tax[] = [];
    globalTaxId: number = 0;
    globalTaxRate: number = 0;
    private taxService = inject(TaxService);

    invoiceData = {
        numberInvoice: '',
        numberControl: '',
        dateInvoice: new Date(),
        notes: ''
    };

    private subscription = new Subscription();
    private snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog);
    private authService = inject(AuthService);
    private cashService = inject(CashService);
    private settingsService = inject(SettingsService);
    private supplierService = inject(SupplierService);
    private productService = inject(ProductService);
    private salesService = inject(SalesService); // To reuse catalog/currencies if needed

    @ViewChild('barcodeInput') barcodeInput!: ElementRef;

    constructor(public purchaseService: PurchaseService) { }

    ngOnInit(): void {
        this.subscription.add(
            this.purchaseService.currentLines$.subscribe(lines => {
                this.currentLines = lines;
                this.calculateTotals();
            })
        );

        this.subscription.add(
            this.purchaseService.selectedSupplier$.subscribe(supplier => {
                this.selectedSupplier = supplier;
            })
        );

        this.subscription.add(
            this.purchaseService.selectedLineIndex$.subscribe(index => {
                this.selectedLineIndex = index;
            })
        );

        this.subscription.add(
            this.purchaseService.globalDiscount$.subscribe(discount => {
                this.globalDiscount = discount;
                this.calculateTotals();
            })
        );

        this.subscription.add(
            this.purchaseService.purchaseState$.subscribe(state => {
                this.globalTaxId = state.globalTaxId || 0;
                this.globalTaxRate = state.globalTaxRate || 0;
                this.calculateTotals();
            })
        );

        this.subscription.add(
            this.purchaseService.exchangeRate$.subscribe(rate => {
                this.exchangeRate = rate;
                this.calculateTotals();
            })
        );

        this.loadExchangeRate();
        this.loadTaxes();

        // Auto-search logic (Debounced)
        this.subscription.add(
            this.barcodeSubject.pipe(debounceTime(400)).subscribe(code => {
                if (code && code.length >= 3) {
                    this.processBarcode(code);
                }
            })
        );
    }

    @HostListener('window:keydown', ['$event'])
    handleGlobalShortcuts(event: KeyboardEvent) {
        const activeElement = document.activeElement;
        const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

        if (event.key === 'F2') {
            event.preventDefault();
            this.openProductSearch();
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
        this.purchaseService.setSelectedLineIndex(newIndex);
    }

    removeSelectedLine(): void {
        if (this.selectedLineIndex >= 0 && this.selectedLineIndex < this.currentLines.length) {
            this.purchaseService.removeLine(this.selectedLineIndex);
        }
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    async loadExchangeRate() {
        this.salesService.getCurrencies().subscribe(currencies => {
            const usd = currencies.find(c => c.code === 'USD');
            if (usd) {
                this.purchaseService.setExchangeRate(usd.exchange_rate);
            }
        });
    }

    loadTaxes() {
        this.taxService.getAll().subscribe(taxes => {
            this.taxesList = taxes;
        });
    }

    calculateTotals() {
        const s = this.settingsService.getSettings();
        const totalDecimals = s?.total_decimals || 2;

        // Prices are in USD
        this.subtotalUSD = this.currentLines.reduce((acc, line) => {
            const lineSubtotal = line.units * line.price;
            const lineDiscount = lineSubtotal * (line.discount || 0);
            return acc + (lineSubtotal - lineDiscount);
        }, 0);

        this.discountTotalUSD = this.subtotalUSD * this.globalDiscount;
        const subtotalAfterGlobalDiscount = this.subtotalUSD - this.discountTotalUSD;

        this.taxesUSD = this.currentLines.reduce((acc, line) => {
            if (line.regulated) return acc; // No tax for regulated products

            const lineSubtotal = line.units * line.price;
            const lineDiscount = lineSubtotal * (line.discount || 0);
            const lineBase = lineSubtotal - lineDiscount;
            // Proportion of global discount for this line
            const lineBaseAfterGlobal = lineBase * (1 - this.globalDiscount);
            return acc + (lineBaseAfterGlobal * this.globalTaxRate);
        }, 0);

        this.totalUSD = parseFloat((subtotalAfterGlobalDiscount + this.taxesUSD).toFixed(totalDecimals));

        // Derived Bs. totals
        this.total = parseFloat((this.totalUSD * this.exchangeRate).toFixed(totalDecimals));
        this.subtotal = parseFloat((this.subtotalUSD * this.exchangeRate).toFixed(totalDecimals));
        this.taxes = parseFloat((this.taxesUSD * this.exchangeRate).toFixed(totalDecimals));
    }

    focusBarcode(): void {
        if (this.barcodeInput) {
            this.barcodeInput.nativeElement.focus();
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
        const isButton = target.closest('button');

        if (!isInput && !isButton) {
            this.focusBarcode();
        }
    }

    onBarcodeChange(value: string) {
        this.barcodeSubject.next(value.trim());
    }

    processBarcode(code: string) {
        this.productService.getAll(1, 1, { search: code }).subscribe((res: any) => {
            if (res.data && res.data.length > 0) {
                const product = res.data.find((p: any) => p.code === code || p.reference === code) || res.data[0];

                // VALIDACIÓN: Solo comprables
                if (!product.iscom) {
                    this.snackBar.open(`El producto "${product.name}" no está marcado como comprable.`, 'Cerrar', { duration: 4000 });
                    this.barcode = '';
                    return;
                }

                this.addToPurchase(product);
                this.barcode = '';
            }
        });
    }

    addToPurchase(product: any, units: number = 1) {
        // Doble validación por seguridad
        if (!product.iscom) {
            this.snackBar.open(`No se puede agregar "${product.name}" (No es comprable)`, 'Cerrar', { duration: 3000 });
            return;
        }

        this.purchaseService.addLine({
            product_id: product.id,
            product_name: product.name,
            units: units,
            price: product.pricebuy || 0,
            taxid: product.taxcat,
            tax_rate: product.tax_rate || 0.16,
            regulated: product.regulated || false
        });
        this.snackBar.open(`Agregado: ${product.name}`, 'OK', { duration: 1500 });
    }

    removeLine(index: number) {
        this.purchaseService.removeLine(index);
    }

    selectLine(index: number) {
        this.purchaseService.setSelectedLineIndex(index);
    }

    updateQuantity(index: number, qty: any) {
        this.purchaseService.updateLineQuantity(index, parseFloat(qty));
    }

    updatePrice(index: number, price: any) {
        this.purchaseService.updateLinePrice(index, parseFloat(price));
    }

    updateDiscount(index: number, discount: any) {
        this.purchaseService.updateLineDiscount(index, parseFloat(discount));
    }

    updateGlobalDiscount(discount: any) {
        this.purchaseService.setGlobalDiscount(parseFloat(discount));
    }

    allowOnlyNumbers(event: KeyboardEvent) {
        const allowed = /[0-9]/;
        if (!allowed.test(event.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(event.key)) {
            event.preventDefault();
        }
    }

    filterInvoiceInput(event: any, field: 'numberInvoice' | 'numberControl') {
        const value = event.target.value;
        this.invoiceData[field] = value.replace(/[^0-9]/g, '');
    }

    updateGlobalTax(taxId: any) {
        const selectedTax = this.taxesList.find(t => t.id == taxId);
        if (selectedTax) {
            this.purchaseService.setGlobalTax(selectedTax.id, selectedTax.rate);
        } else {
            this.purchaseService.setGlobalTax(0, 0);
        }
    }

    async openProductSearch() {
        const { ProductSearchDialogComponent } = await import('../../../ventas/sales/components/product-search-dialog/product-search-dialog');
        const dialogRef = this.dialog.open(ProductSearchDialogComponent, {
            width: '800px',
            height: '600px',
            data: {
                allowZeroStock: true,
                purchasableOnly: true // Nuevo flag
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.product) {
                this.addToPurchase(result.product, result.units);
            }
        });
    }

    async openSupplierSelector() {
        // We can reuse a dialog or create a quick one
        // For now, I'll assume we can use a similar one to CustomerSelector or just a list
        const { SupplierSelectorDialogComponent } = await import('./components/supplier-selector-dialog/supplier-selector-dialog');
        const dialogRef = this.dialog.open(SupplierSelectorDialogComponent, { width: '500px' });
        dialogRef.afterClosed().subscribe(supplier => {
            if (supplier) {
                this.purchaseService.setSelectedSupplier(supplier);
            }
        });
    }

    async onSave() {
        if (!this.selectedSupplier) {
            this.snackBar.open('Debe seleccionar un proveedor', 'Cerrar', { duration: 3000 });
            return;
        }
        if (this.currentLines.length === 0) {
            this.snackBar.open('No hay productos en la compra', 'Cerrar', { duration: 3000 });
            return;
        }
        if (!this.invoiceData.numberInvoice?.trim() || !this.invoiceData.numberControl?.trim()) {
            this.snackBar.open('Debe ingresar el Número de Factura y el Número de Control', 'Cerrar', { duration: 5000 });
            return;
        }

        const { PurchasePaymentDialogComponent } = await import('./components/purchase-payment-dialog/purchase-payment-dialog');
        const dialogRef = this.dialog.open(PurchasePaymentDialogComponent, {
            width: '1000px',
            maxWidth: '95vw',
            data: {
                total: this.total,
                subtotal: this.subtotal,
                taxes: this.taxes,
                exchangeRate: this.exchangeRate,
                totalUSD: this.totalUSD,
                supplier: this.selectedSupplier
            }
        });

        dialogRef.afterClosed().subscribe(paymentData => {
            if (paymentData) {
                this.processSave(paymentData);
            }
        });
    }

    async processSave(paymentData: any) {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) {
                this.snackBar.open('Sesión expirada o usuario no encontrado', 'Cerrar');
                return;
            }

            // Prepare payments array for backend
            let payments: any[] = [];
            if (paymentData.method === 'mixed') {
                for (const method in paymentData.multiparams.payments) {
                    const amountBs = paymentData.multiparams.payments[method];
                    if (amountBs > 0) {
                        payments.push({
                            method: method,
                            total: amountBs,
                            amount_base: amountBs,
                            currency_id: 1, // Bs
                            exchange_rate: this.exchangeRate,
                            bank: paymentData.paymentDetails[method]?.bank,
                            bank_id: paymentData.paymentDetails[method]?.bank_id || null,
                            numdocument: paymentData.paymentDetails[method]?.cedula || null,
                            reference: paymentData.paymentDetails[method]?.reference || null,
                            account_number: paymentData.paymentDetails[method]?.account || null,
                            is_pago_movil: paymentData.paymentDetails[method]?.is_pago_movil || false
                        });
                    }
                }
                for (const method in paymentData.multiparams.paymentsAlt) {
                    const amountUsd = paymentData.multiparams.paymentsAlt[method];
                    if (amountUsd > 0) {
                        payments.push({
                            method: method,
                            total: amountUsd,
                            amount_base: amountUsd * this.exchangeRate,
                            currency_id: 2, // USD
                            exchange_rate: this.exchangeRate,
                            bank: paymentData.paymentDetails[method]?.bank,
                            bank_id: paymentData.paymentDetails[method]?.bank_id || null,
                            numdocument: paymentData.paymentDetails[method]?.cedula || null,
                            reference: paymentData.paymentDetails[method]?.reference || null,
                            account_number: paymentData.paymentDetails[method]?.account || null,
                            is_pago_movil: paymentData.paymentDetails[method]?.is_pago_movil || false
                        });
                    }
                }
            } else {
                payments.push({
                    method: paymentData.method,
                    total: paymentData.amount,
                    amount_base: paymentData.amount,
                    currency_id: paymentData.currency_id,
                    exchange_rate: this.exchangeRate,
                    bank: paymentData.paymentDetails ? paymentData.paymentDetails[paymentData.method]?.bank : null,
                    bank_id: paymentData.bank_id || (paymentData.paymentDetails ? paymentData.paymentDetails[paymentData.method]?.bank_id : null),
                    numdocument: paymentData.paymentDetails ? paymentData.paymentDetails[paymentData.method]?.cedula : null,
                    reference: paymentData.paymentDetails ? (paymentData.paymentDetails[paymentData.method]?.reference || null) : null,
                    account_number: paymentData.paymentDetails ? paymentData.paymentDetails[paymentData.method]?.account : null,
                    is_pago_movil: paymentData.paymentDetails ? paymentData.paymentDetails[paymentData.method]?.is_pago_movil : false
                });
            }

            const purchaseRequest: any = {
                supplier_id: this.selectedSupplier.id,
                person_id: user.id,
                lines: this.currentLines.map(line => ({
                    ...line,
                    taxid: (this.globalTaxId > 0 && !line.regulated) ? this.globalTaxId : line.taxid,
                    tax_rate: (this.globalTaxId > 0 && !line.regulated) ? this.globalTaxRate : line.tax_rate
                })),
                payments: payments,
                total: this.total,
                cash_register_id: this.cashService.getCashRegisterId() || 1,
                currency_id: 1, // Bs
                exchange_rate: this.exchangeRate,
                number_invoice: this.invoiceData.numberInvoice,
                number_control: this.invoiceData.numberControl,
                date_invoice: this.invoiceData.dateInvoice,
                notes: this.invoiceData.notes,
                global_discount: this.globalDiscount
            };

            await this.purchaseService.createPurchase(purchaseRequest).toPromise();
            this.snackBar.open('Compra registrada con éxito', 'OK', { duration: 3000 });
            this.invoiceData = { numberInvoice: '', numberControl: '', dateInvoice: new Date(), notes: '' };
        } catch (error: any) {
            this.snackBar.open('Error al registrar compra: ' + (error.error?.error || error.message), 'Cerrar');
        }
    }
}
