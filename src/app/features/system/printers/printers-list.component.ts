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
    settings: any = { roles: { TICKET: '', FISCAL: '', REPORT: '' } };
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
        this.snackBar.open(`Enviando prueba a ${printerName}... (Funcionalidad Simulada)`, 'OK', { duration: 2000 });
    }
}
