import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { CustomerService } from '../../../core/services/customer.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
    selector: 'app-cx-c-history-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './cx-c-history-dialog.html',
    styleUrl: './cx-c-history-dialog.css',
    providers: [DatePipe, DecimalPipe, provideNativeDateAdapter()]
})
export class CxCHistoryDialogComponent implements OnInit {
    private customerService = inject(CustomerService);
    public settingsService = inject(SettingsService);
    private datePipe = inject(DatePipe);
    private decimalPipe = inject(DecimalPipe);

    payments: any[] = [];
    displayedColumns: string[] = ['date', 'ticketNumber', 'invoicePaid', 'method', 'details', 'amount', 'actions'];

    // Filters
    filterInvoice: string = '';
    filterMethod: string = 'all';
    filterDate: Date | null = null;

    paymentMethods = [
        { value: 'all', label: 'Todos' },
        { value: 'cash', label: 'Efectivo' },
        { value: 'card', label: 'Tarjeta' },
        { value: 'paper', label: 'Pago Móvil' },
        { value: 'transfer', label: 'Transferencia' }
    ];

    constructor(
        public dialogRef: MatDialogRef<CxCHistoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { customer: any }
    ) { }

    ngOnInit(): void {
        this.loadHistory();
    }

    loadHistory(): void {
        const filters: any = {};
        if (this.filterInvoice) filters.invoice = this.filterInvoice;
        if (this.filterMethod && this.filterMethod !== 'all') filters.method = this.filterMethod;
        if (this.filterDate) filters.date = this.datePipe.transform(this.filterDate, 'yyyy-MM-dd');

        this.customerService.getPaymentHistory(this.data.customer.id, filters).subscribe(res => {
            this.payments = res;
        });
    }

    clearFilters(): void {
        this.filterInvoice = '';
        this.filterMethod = 'all';
        this.filterDate = null;
        this.loadHistory();
    }

    getMethodLabel(method: string): string {
        const labels: any = {
            'cash': 'Efectivo',
            'card': 'Tarjeta',
            'paper': 'Pago Móvil',
            'Vale': 'Pago Móvil',
            'vale': 'Pago Móvil',
            'transfer': 'Transferencia',
            'debt': 'Crédito',
            'Credito': 'Crédito'
        };
        return labels[method] || method;
    }

    printPayment(p: any): void {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        const html = `
            <html>
            <head>
                <title>Comprobante de Pago #${p.ticketNumber}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 10px; }
                    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
                    .bold { font-weight: bold; }
                    .title { font-size: 14px; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="bold title">COMPROBANTE DE PAGO</div>
                    <div>${this.data.customer.name}</div>
                    <div>RIF/CI: ${this.data.customer.taxid || 'N/A'}</div>
                </div>
                
                <div class="row"><span class="bold">Nro. Pago:</span> <span>#${p.ticketNumber}</span></div>
                <div class="row"><span class="bold">Fecha:</span> <span>${this.datePipe.transform(p.date, 'dd/MM/yyyy HH:mm')}</span></div>
                <div class="row"><span class="bold">Metodo:</span> <span>${this.getMethodLabel(p.method)}</span></div>
                ${p.invoicePaid ? `<div class="row"><span class="bold">Abono a Factura:</span> <span>#${p.invoicePaid}</span></div>` : ''}
                
                <div style="margin: 15px 0; border-top: 1px solid #000; padding-top: 5px;">
                    ${p.bank ? `<div class="row"><span>Banco:</span> <span>${p.bank}</span></div>` : ''}
                    ${p.reference ? `<div class="row"><span>Ref:</span> <span>${p.reference}</span></div>` : ''}
                    ${p.cedula ? `<div class="row"><span>Cédula:</span> <span>${p.cedula}</span></div>` : ''}
                </div>

                    <div class="row" style="font-size: 14px;">
                    <span class="bold">MONTO PAGADO:</span>
                    <span class="bold">${this.decimalPipe.transform(p.amountBs, this.settingsService.getDecimalFormat('total'))} Bs.</span>
                </div>
                ${p.amount !== p.amountBs ? `
                    <div class="row" style="font-size: 12px; font-style: italic; color: #555;">
                        <span>Equivalente:</span>
                        <span>$ ${this.decimalPipe.transform(p.amount, this.settingsService.getDecimalFormat('total'))}</span>
                    </div>
                ` : ''}
                ${p.igtfAmount > 0 ? `
                    <div class="row" style="font-size: 12px; color: #d32f2f;">
                        <span>I.G.T.F. (3%):</span>
                        <span>${this.decimalPipe.transform(p.igtfAmount, this.settingsService.getDecimalFormat('total'))} Bs.</span>
                    </div>
                ` : ''}

                <div class="footer">
                    Gracias por su pago.<br>
                    ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}
                </div>
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }

    exportHistory(): void {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        const rows = this.payments.map(p => `
            <tr>
                <td>${this.datePipe.transform(p.date, 'dd/MM/yyyy HH:mm')}</td>
                <td>#${p.ticketNumber}</td>
                <td>${p.invoicePaid ? '#' + p.invoicePaid : '-'}</td>
                <td>${this.getMethodLabel(p.method)}</td>
                <td style="font-size: 10px;">
                    ${p.bank ? `<strong>Ban:</strong> ${p.bank}` : ''}
                    ${p.reference ? `<br><strong>Ref:</strong> ${p.reference}` : ''}
                </td>
                <td style="text-align: right; font-weight: bold;">
                    ${this.decimalPipe.transform(p.amountBs, this.settingsService.getDecimalFormat('total'))} Bs.
                    ${p.amount !== p.amountBs ? `<br><small style="color: #666;">$ ${this.decimalPipe.transform(p.amount, this.settingsService.getDecimalFormat('total'))}</small>` : ''}
                    ${p.igtfAmount > 0 ? `<br><small style="color: #d32f2f;">IGTF: ${this.decimalPipe.transform(p.igtfAmount, this.settingsService.getDecimalFormat('total'))} Bs.</small>` : ''}
                </td>
            </tr>
        `).join('');

        const html = `
            <html>
            <head>
                <title>Historial de Pagos - ${this.data.customer.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; }
                    h1 { text-align: center; color: #333; margin-bottom: 5px; }
                    .meta { text-align: center; color: #666; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; }
                </style>
            </head>
            <body>
                <h1>Historial de Pagos</h1>
                <div class="meta">
                    <strong>Cliente:</strong> ${this.data.customer.name} | 
                    <strong>Cédula/RIF:</strong> ${this.data.customer.taxid || 'N/A'}<br>
                    <strong>Generado:</strong> ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Nro. Pago</th>
                            <th>Factura</th>
                            <th>Método</th>
                            <th>Detalles</th>
                            <th style="text-align: right;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }
}
