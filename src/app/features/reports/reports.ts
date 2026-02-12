import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ReportsService } from '../../core/services/reports.service';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatTableModule,
        MatExpansionModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        BaseChartDirective
    ],
    providers: [provideCharts(withDefaultRegisterables())],
    templateUrl: './reports.html',
    styleUrls: ['./reports.scss']
})
export class ReportsComponent implements OnInit {
    modules = [
        {
            name: 'Ventas',
            icon: 'point_of_sale',
            reports: [
                { id: 'sales-user', name: 'Ventas por Usuario', hasDates: true },
                { id: 'sales-product', name: 'Ventas por Producto', hasDates: true },
                { id: 'sales-tax', name: 'Impuestos en Ventas', hasDates: true },
                { id: 'sales-book', name: 'Libro de Ventas', hasDates: true },
                { id: 'sales-utility', name: 'Utilidad en Ventas', hasDates: true },
                { id: 'sales-discounts', name: 'Descuentos en Ventas', hasDates: true },
                { id: 'sales-chart', name: 'Gráfico de Ventas', hasDates: true },
                { id: 'sales-igtf', name: 'Facturas con Divisas (IGTF)', hasDates: true }
            ]
        },
        {
            name: 'Inventario',
            icon: 'inventory_2',
            reports: [
                { id: 'inventory-current', name: 'Existencias (Local 0)', hasDates: false },
                { id: 'inventory-general', name: 'Inventario General', hasDates: false },
                { id: 'inventory-low-stock', name: 'Stock Bajo (Alertas)', hasDates: false },
                { id: 'inventory-movements', name: 'Movimientos de Stock', hasDates: true },
                { id: 'inventory-price-list', name: 'Lista de Precios', hasDates: false },
                { id: 'inventory-intake', name: 'Registro de Entradas', hasDates: true }
            ]
        },
        {
            name: 'Compras',
            icon: 'shopping_cart',
            reports: [
                { id: 'purchases-supplier', name: 'Compras por Proveedor', hasDates: true },
                { id: 'purchases-book', name: 'Libro de Compras', hasDates: true },
                { id: 'purchases-cxp', name: 'Cuentas por Pagar (CXP)', hasDates: false }
            ]
        },
        {
            name: 'Caja',
            icon: 'point_of_sale',
            reports: [
                { id: 'cash-closed-pos', name: 'Cierre de Caja', hasDates: true },
                { id: 'cash-closed-pos-detail', name: 'Detalle Cierre Caja', hasDates: true }
            ]
        },
        {
            name: 'Clientes',
            icon: 'people',
            reports: [
                { id: 'customers-list', name: 'Lista de Clientes', hasDates: false },
                { id: 'customers-statement', name: 'Estado de Cuenta', hasDates: true },
                { id: 'customers-balance', name: 'Saldo de Clientes', hasDates: false },
                { id: 'customers-payments', name: 'Abonos de Clientes', hasDates: true },
                { id: 'customers-diary', name: 'Diario de Clientes', hasDates: true }
            ]
        },
        {
            name: 'Productos',
            icon: 'inventory',
            reports: [
                { id: 'products-list', name: 'Lista de Productos', hasDates: false },
                { id: 'products-catalog', name: 'Catálogo de Productos', hasDates: false }
            ]
        },
        {
            name: 'Otros',
            icon: 'more_horiz',
            reports: [
                { id: 'people-list', name: 'Personal/Empleados', hasDates: false }
            ]
        }
    ];

    selectedReport: any = null;
    startDate: Date = new Date();
    endDate: Date = new Date();

    reportData: any[] = [];
    columns: string[] = [];
    loading = false;
    reportSummary: any = null; // For IGTF report summary

    // Chart properties
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        scales: {
            x: {},
            y: {
                min: 0
            }
        },
        plugins: {
            legend: {
                display: true,
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> | undefined = undefined;

    constructor(private reportsService: ReportsService) {
        // Set default dates to start and end of current month
        const now = new Date();
        this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    ngOnInit(): void { }

    selectReport(report: any) {
        this.selectedReport = report;
        this.reportData = [];
        this.columns = [];

        // If report doesn't need dates, fetch immediately
        if (!report.hasDates) {
            this.generateReport();
        }
    }

    generateReport() {
        if (!this.selectedReport) return;

        this.loading = true;
        const startStr = this.startDate.toISOString().split('T')[0];
        const endStr = this.endDate.toISOString().split('T')[0];

        let obs;
        switch (this.selectedReport.id) {
            case 'sales-user':
                obs = this.reportsService.getSalesByUser(startStr, endStr);
                break;
            case 'sales-product':
                obs = this.reportsService.getSalesByProduct(startStr, endStr);
                break;
            case 'sales-tax':
                obs = this.reportsService.getSalesByTax(startStr, endStr);
                break;
            case 'sales-book':
                obs = this.reportsService.getSalesBook(startStr, endStr);
                break;
            case 'sales-utility':
                obs = this.reportsService.getSalesUtility(startStr, endStr);
                break;
            case 'sales-discounts':
                obs = this.reportsService.getSalesDiscounts(startStr, endStr);
                break;
            case 'sales-chart':
                obs = this.reportsService.getSalesChart(startStr, endStr);
                break;
            case 'sales-igtf':
                obs = this.reportsService.getInvoicesWithForeignCurrency(startStr, endStr);
                break;
            case 'inventory-current':
                obs = this.reportsService.getInventoryCurrent();
                break;
            case 'inventory-general':
                obs = this.reportsService.getInventoryGeneral();
                break;
            case 'inventory-low-stock':
                obs = this.reportsService.getInventoryLowStock();
                break;
            case 'inventory-movements':
                obs = this.reportsService.getInventoryMovements(startStr, endStr);
                break;
            case 'inventory-price-list':
                obs = this.reportsService.getInventoryPriceList();
                break;
            case 'inventory-intake':
                obs = this.reportsService.getInventoryIntake(startStr, endStr);
                break;
            case 'purchases-supplier':
                obs = this.reportsService.getPurchasesBySupplier(startStr, endStr);
                break;
            case 'purchases-book':
                obs = this.reportsService.getPurchasesBook(startStr, endStr);
                break;
            case 'purchases-cxp':
                obs = this.reportsService.getPurchasesCXP();
                break;
            case 'cash-closed-pos':
                obs = this.reportsService.getClosedPOS(startStr, endStr);
                break;
            case 'cash-closed-pos-detail':
                obs = this.reportsService.getClosedPOSDetail(startStr, endStr);
                break;
            case 'customers-list':
                obs = this.reportsService.getCustomersList();
                break;
            case 'customers-statement':
                obs = this.reportsService.getCustomerStatement(startStr, endStr);
                break;
            case 'customers-balance':
                obs = this.reportsService.getCustomersBalance();
                break;
            case 'customers-payments':
                obs = this.reportsService.getCustomersPayments(startStr, endStr);
                break;
            case 'customers-diary':
                obs = this.reportsService.getCustomersDiary(startStr, endStr);
                break;
            case 'products-list':
                obs = this.reportsService.getProductsList();
                break;
            case 'products-catalog':
                obs = this.reportsService.getProductsCatalog();
                break;
            case 'people-list':
                obs = this.reportsService.getPeopleList();
                break;
        }

        if (obs) {
            obs.subscribe({
                next: (data) => {
                    this.reportData = data;
                    if (this.selectedReport.id === 'sales-chart') {
                        const labels = data.map((d: any) => d.date);
                        const values = data.map((d: any) => parseFloat(d.total));
                        this.barChartData = {
                            labels: labels,
                            datasets: [
                                { data: values, label: 'Ventas Totales (Bs.)', backgroundColor: '#673ab7' }
                            ]
                        };
                    } else if (data.length > 0) {
                        this.columns = Object.keys(data[0]);
                    }
                    // Handle IGTF report with summary
                    if (this.selectedReport.id === 'sales-igtf' && data.invoices) {
                        this.reportData = data.invoices;
                        this.reportSummary = data.summary;
                        if (data.invoices.length > 0) {
                            this.columns = Object.keys(data.invoices[0]);
                        }
                    }
                    this.loading = false;
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                    alert('Error al generar el reporte');
                }
            });
        }
    }

    formatHeader(key: string): string {
        const map: any = {
            'user_name': 'Usuario',
            'first_sale': 'Primera Venta',
            'last_sale': 'Última Venta',
            'total_base': 'Base',
            'total_tax': 'Impuesto',
            'total_with_tax': 'Total',
            'reference': 'Referencia',
            'product_name': 'Producto',
            'units_sold': 'Unidades',
            'tax_name': 'Impuesto',
            'tax_rate': 'Tasa',
            'base_amount': 'Base',
            'tax_amount': 'Monto Imp.',
            'category_name': 'Categoría',
            'stock': 'Stock',
            'supplier_name': 'Proveedor',
            'invoice_count': 'Facturas',
            'total_purchased': 'Total Comprado',
            'dateinvoice': 'Fecha Fact.',
            'rif': 'RIF',
            'razonsocial': 'Razón Social',
            'numerofactura': 'Nro. Factura',
            'numerocontrol': 'Nro. Control',
            'totalventasconiva': 'Total c/IVA',
            'totalventasnogravadas': 'Exento',
            'baseimponible': 'Base Imp.',
            'alicuota': 'Alicuota',
            'impuestoiva': 'Monto IVA',
            'units_out': 'Unidades',
            'utility': 'Utilidad',
            'ticketid': 'Ticket',
            'referencia': 'Referencia',
            'codigo': 'Código',
            'nombre': 'Nombre',
            'categoria': 'Categoría',
            'precio': 'Precio',
            'cantidad': 'Cantidad',
            'locationname': 'Local/Almacén',
            'productname': 'Producto',
            'unitmetric': 'Unidad',
            'stockvolume': 'Volumen',
            'stockcost': 'Costo Stock',
            'stocksecurity': 'Mínimo',
            'stockmaximum': 'Máximo',
            'units': 'Unidades',
            'averagecost': 'Costo Prom.',
            'unitsout': 'Salidas',
            'totalout': 'Total Salida',
            'unitsin': 'Entradas',
            'totalin': 'Total Entrada',
            'unitsdiff': 'Diferencia',
            'totaldiff': 'Total Dif.',
            'taxcatname': 'Impuesto',
            'rate': 'Tasa',
            'discountcatname': 'Descuento',
            'discount_qty': '% Desc.',
            'pricesell_with_discount': 'P.V. con Desc.',
            'fecha': 'Fecha',
            // Compras
            'dateinvoicef': 'Fecha Fact. F',
            'tipoproveedor': 'Tipo Proveedor',
            'nrocompretiva': 'Nro. Comp. IVA',
            'nronotacredito': 'Nro. Nota Crédito',
            'nrofacturaafectada': 'Nro. Fact. Afectada',
            'tipotransaccion': 'Tipo Transacción',
            'totalcomprasconiva': 'Total c/IVA',
            'comprasexentas': 'Compras Exentas',
            'ivaretenido': 'IVA Retenido',
            'cif': 'CIF/RIF',
            'name': 'Nombre',
            'address': 'Dirección',
            'contactcomm': 'Contacto Com.',
            'contactfact': 'Contacto Fact.',
            'payrule': 'Regla Pago',
            'faxnumber': 'Fax',
            'phonecomm': 'Teléfono Com.',
            'phonefact': 'Teléfono Fact.',
            'email': 'Email',
            'notes': 'Notas',
            'creditdays': 'Días Crédito',
            'creditlimit': 'Límite Crédito',
            'persontype': 'Tipo Persona',
            'typesupplier': 'Tipo Proveedor',
            'balance': 'Saldo',
            'curdate': 'Fecha Actual',
            // Caja
            'host': 'Terminal',
            'hostsequence': 'Secuencia',
            'money': 'Caja',
            'datestart': 'Fecha Inicio',
            'dateend': 'Fecha Cierre',
            'payment': 'Forma de Pago',
            'total': 'Total',
            'datenew': 'Fecha',
            'payment_type': 'Tipo Pago',
            'concepto': 'Concepto',
            // Clientes
            'id': 'ID',
            'taxid': 'RIF/CI',
            'card': 'Tarjeta',
            'maxdebt': 'Deuda Máx.',
            'curdebt': 'Deuda Actual',
            'phone': 'Teléfono',
            'phone2': 'Teléfono 2',
            'totalf': 'Total Factura',
            'totalp': 'Total Pagado',
            'pendiente': 'Pendiente',
            // Productos
            'taxcat': 'Cat. Impuesto',
            'discountcat': 'Cat. Descuento',
            'discount_quantity': '% Descuento',
            'pv': 'P.V. Final',
            // IGTF Report
            'ticket_number': 'Nro. Ticket',
            'date': 'Fecha',
            'customer_name': 'Cliente',
            'customer_taxid': 'RIF/CI',
            'total_invoice': 'Total Factura',
            'total_usd_payments': 'Pagos USD',
            'total_bs_payments': 'Pagos Bs.',
            'igtf_usd': 'IGTF USD',
            'igtf_bs': 'IGTF Bs.',
            'payment_methods': 'Métodos de Pago',
            'status': 'Estado',
            // Otros
            'role': 'Rol',
            'visible': 'Visible'
        };
        return map[key] || key;
    }
}
