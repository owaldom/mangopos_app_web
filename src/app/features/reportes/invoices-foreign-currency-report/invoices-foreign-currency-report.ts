import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsService } from '../../../core/services/reports.service';
import { CustomerService } from '../../../core/services/customer.service';
import { SettingsService } from '../../../core/services/settings.service';
import { SystemDatePipe } from '../../../shared/pipes/system-date.pipe';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-invoices-foreign-currency-report',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatAutocompleteModule,
        MatProgressSpinnerModule,
        SystemDatePipe
    ],
    providers: [DatePipe, DecimalPipe, provideNativeDateAdapter()],
    templateUrl: './invoices-foreign-currency-report.html',
    styleUrls: ['./invoices-foreign-currency-report.css']
})
export class InvoicesForeignCurrencyReportComponent {
    private reportsService = inject(ReportsService);
    private customerService = inject(CustomerService);
    private settingsService = inject(SettingsService);
    public datePipe = inject(DatePipe);
    public decimalPipe = inject(DecimalPipe);

    startDate: Date = new Date();
    endDate: Date = new Date();
    customerControl = new FormControl('');
    selectedCustomer: any = null;
    filteredCustomers: any[] = [];

    loading = false;
    data: any[] = [];
    summary: any = {};

    displayedColumns: string[] = ['ticket_number', 'date', 'customer', 'total_usd', 'total_bs', 'igtf_usd', 'igtf_bs', 'payments'];

    constructor() {
        this.startDate.setDate(1); // First day of current month

        this.customerControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((value: string | null) => {
                const term = value || '';
                if (term.length > 2) {
                    return this.customerService.getAll(1, 20, term);
                } else {
                    return of({ data: [] });
                }
            })
        ).subscribe((response: any) => {
            this.filteredCustomers = response.data || [];
        });
    }

    displayCustomer(customer: any): string {
        return customer ? customer.name : '';
    }

    onCustomerSelected(event: any) {
        this.selectedCustomer = event.option.value;
    }

    clearCustomer() {
        this.customerControl.setValue('');
        this.selectedCustomer = null;
    }

    generateReport() {
        this.loading = true;
        const start = this.datePipe.transform(this.startDate, 'yyyy-MM-dd') || '';
        const end = this.datePipe.transform(this.endDate, 'yyyy-MM-dd') || '';
        const customerId = this.selectedCustomer?.id;

        this.reportsService.getInvoicesWithForeignCurrency(start, end, customerId).subscribe({
            next: (response: any) => {
                this.data = response.invoices;
                this.summary = response.summary;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error generating report:', err);
                this.loading = false;
            }
        });
    }

    exportToExcel() {
        // CSV Export fallback since xlsx is not available
        const headers = ['Nro. Ticket', 'Fecha', 'Cliente', 'RIF/CI', 'Total USD', 'Total Bs', 'IGTF USD', 'IGTF Bs', 'Métodos de Pago'];

        const rows = this.data.map(item => [
            item.ticket_number,
            this.datePipe.transform(item.date, 'dd/MM/yyyy HH:mm'),
            item.customer_name,
            item.customer_taxid,
            Number(item.total_usd).toFixed(2),
            Number(item.total_bs).toFixed(2),
            Number(item.igtf_usd).toFixed(2),
            Number(item.igtf_bs).toFixed(2),
            this.getPaymentMethods(item.payment_methods)
        ]);

        // Summary row
        rows.push([
            'TOTALES',
            '',
            '',
            '',
            (this.summary.total_sales_usd || 0).toFixed(2),
            (this.summary.total_sales_bs || 0).toFixed(2),
            (this.summary.total_igtf_usd || 0).toFixed(2),
            (this.summary.total_igtf_bs || 0).toFixed(2),
            ''
        ]);

        const csvContent = [
            headers.join(';'), // Use ; for better Excel compatibility in some regions
            ...rows.map(r => r.map(c => `"${c}"`).join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `Reporte_Facturas_Divisas_${this.datePipe.transform(new Date(), 'yyyyMMdd')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    getPaymentMethods(methods: string[]): string {
        const map: any = {
            'cash': 'Efectivo',
            'card': 'Tarjeta',
            'transfer': 'Transferencia',
            'paper': 'Pago Móvil',
            'debt': 'Crédito'
        };
        return methods.map(m => map[m] || m).join(', ');
    }
}
