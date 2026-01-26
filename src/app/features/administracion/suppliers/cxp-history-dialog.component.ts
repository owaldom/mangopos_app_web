import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SupplierService } from '../../../core/services/supplier.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
    selector: 'app-cxp-history-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule
    ],
    templateUrl: './cxp-history-dialog.html',
    styleUrl: './cxp-history-dialog.css',
    providers: [DatePipe, DecimalPipe]
})
export class CxPHistoryDialogComponent implements OnInit {
    private supplierService = inject(SupplierService);
    public settingsService = inject(SettingsService);
    private datePipe = inject(DatePipe);
    private decimalPipe = inject(DecimalPipe);

    payments: any[] = [];
    displayedColumns: string[] = ['date', 'ticketNumber', 'invoicePaid', 'method', 'details', 'amount', 'actions'];

    constructor(
        public dialogRef: MatDialogRef<CxPHistoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { supplier: any }
    ) { }

    ngOnInit(): void {
        this.loadHistory();
    }

    loadHistory(): void {
        this.supplierService.getPaymentHistory(this.data.supplier.id).subscribe(res => {
            this.payments = res;
        });
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
                    <div class="bold title">COMPROBANTE DE PAGO (PROVEEDOR)</div>
                    <div>${this.data.supplier.name}</div>
                    <div>RIF/CIF: ${this.data.supplier.cif || 'N/A'}</div>
                </div>
                
                <div class="row"><span class="bold">Nro. Pago:</span> <span>#${p.ticketNumber}</span></div>
                <div class="row"><span class="bold">Fecha:</span> <span>${this.datePipe.transform(p.date, 'dd/MM/yyyy HH:mm')}</span></div>
                <div class="row"><span class="bold">Metodo:</span> <span>${this.getMethodLabel(p.method)}</span></div>
                ${p.invoicePaid ? `<div class="row"><span class="bold">Abono a Factura:</span> <span>#${p.invoicePaid}</span></div>` : ''}
                
                <div style="margin: 15px 0; border-top: 1px solid #000; padding-top: 5px;">
                    ${p.bank ? `<div class="row"><span>Banco:</span> <span>${p.bank}</span></div>` : ''}
                    ${p.reference ? `<div class="row"><span>Ref:</span> <span>${p.reference}</span></div>` : ''}
                    ${p.cedula ? `<div class="row"><span>Dato:</span> <span>${p.cedula}</span></div>` : ''}
                </div>

                <div class="row" style="font-size: 14px;">
                    <span class="bold">MONTO PAGADO:</span>
                    <span class="bold">${this.decimalPipe.transform(p.amountBs, this.settingsService.getDecimalFormat('total'))} Bs.</span>
                </div>
                <div class="row" style="font-size: 12px; font-style: italic; color: #555;">
                    <span>Equivalente:</span>
                    <span>$ ${this.decimalPipe.transform(p.amountUSD, this.settingsService.getDecimalFormat('total'))}</span>
                </div>

                <div class="footer">
                    Pago registrado en sistema.<br>
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
                    ${p.cedula ? `<br><strong>Cédula:</strong> ${p.cedula}` : ''}
                </td>
                <td style="text-align: right; font-weight: bold;">
                    ${this.decimalPipe.transform(p.amountBs, this.settingsService.getDecimalFormat('total'))} Bs.
                    <br><small style="color: #666;">$ ${this.decimalPipe.transform(p.amountUSD, this.settingsService.getDecimalFormat('total'))}</small>
                </td>
            </tr>
        `).join('');

        const html = `
            <html>
            <head>
                <title>Historial de CxP - ${this.data.supplier.name}</title>
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
                <h1>Historial de Cuentas por Pagar (Pagos)</h1>
                <div class="meta">
                    <strong>Proveedor:</strong> ${this.data.supplier.name} | 
                    <strong>RIF/CIF:</strong> ${this.data.supplier.cif || 'N/A'}<br>
                    <strong>Generado:</strong> ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Nro. Pago</th>
                            <th>Factura Compra</th>
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
