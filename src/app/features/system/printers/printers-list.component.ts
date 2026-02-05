import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ThermalPrinterService } from '../../../core/services/thermal-printer.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-printers-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDividerModule
    ],
    templateUrl: './printers-list.component.html',
    styleUrl: './printers-list.component.css'
})
export class PrintersListComponent implements OnInit {
    private printerService = inject(ThermalPrinterService);
    private snackBar = inject(MatSnackBar);

    printers: any[] = [];
    settings: any = {
        roles: {
            TICKET: { name: '', width: 80 },
            FISCAL: { name: '', width: 80 },
            REPORT: { name: '', width: 80 }
        }
    };
    loading = true;
    saving = false;
    displayedColumns: string[] = ['name', 'driver', 'status', 'actions'];

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading = true;

        // Cargar impresoras y configuración en paralelo
        this.printerService.getPrinters().subscribe({
            next: (printers) => {
                this.printers = printers;
                this.loadSettings();
            },
            error: (err) => {
                console.error('Error loading printers:', err);
                this.loading = false;
                if (err.error) this.snackBar.open(err.error, 'Cerrar', { duration: 3000 });
            }
        });
    }

    loadSettings() {
        this.printerService.getPrinterSettings().subscribe({
            next: (settings) => {
                if (settings && settings.roles) {
                    // Normalizar para asegurar el nuevo formato de objetos
                    const roles = ['TICKET', 'FISCAL', 'REPORT'];
                    roles.forEach(role => {
                        const val = settings.roles[role];
                        if (typeof val === 'string') {
                            settings.roles[role] = { name: val, width: 80 };
                        } else if (!val) {
                            settings.roles[role] = { name: '', width: 80 };
                        } else if (!val.width) {
                            val.width = 80;
                        }
                    });
                    this.settings = settings;
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading settings:', err);
                this.loading = false;
            }
        });
    }

    saveSettings() {
        this.saving = true;
        this.printerService.savePrinterSettings(this.settings).subscribe({
            next: () => {
                this.snackBar.open('Configuración guardada correctamente', 'OK', { duration: 3000 });
                this.saving = false;
            },
            error: (err) => {
                console.error('Error saving settings:', err);
                this.snackBar.open('Error al guardar configuración', 'Cerrar', { duration: 3000 });
                this.saving = false;
            }
        });
    }

    testPrinter(printerName: string) {
        this.snackBar.open(`Enviando prueba a ${printerName}...`, 'OK', { duration: 2000 });

        // Buscar si esta impresora tiene un ancho asignado en algún rol
        let width = 80;
        const roles = Object.values(this.settings.roles) as any[];
        const mapping = roles.find(r => r.name === printerName);
        if (mapping) width = mapping.width;

        this.printerService.testPrinter(printerName, width).subscribe({
            next: (res) => {
                if (res.success) {
                    this.snackBar.open(`Prueba enviada con éxito a ${printerName}`, 'OK', { duration: 3000 });
                } else {
                    this.snackBar.open(`Error en prueba: ${res.error}`, 'Cerrar', { duration: 5000 });
                }
            },
            error: (err) => {
                console.error('Error in test print:', err);
                const msg = err.error?.error || 'Error de conexión con el servidor de impresión';
                this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
