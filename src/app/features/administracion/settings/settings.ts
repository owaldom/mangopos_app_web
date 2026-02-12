import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { SettingsService, AppSettings } from '../../../core/services/settings.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { Warehouse } from '../../../core/models/warehouse.model';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatSlideToggleModule,
        MatSelectModule,
        MoneyInputDirective
    ],
    templateUrl: './settings.html',
    styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
    settings: AppSettings = {
        price_decimals: 2,
        total_decimals: 2,
        quantity_decimals: 3,
        currency_symbol: 'Bs.',
        currency_code: 'VES',
        company_name: '',
        company_address: '',
        enable_pdf_ticket: false,
        percentage_decimals: 0,
        pos_layout: 'classic',
        print_server_url: 'http://localhost:3001/api',
        igtf_enabled: false,
        igtf_percentage: 3
    };

    currencies: any[] = [];
    loading = true;

    currInstallationType: 'factory' | 'pos' = 'pos';
    warehouses: Warehouse[] = [];
    selectedWarehouseId: number | null = null;

    constructor(
        private settingsService: SettingsService,
        private appConfigService: AppConfigService,
        private warehouseService: WarehouseService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadSettings();
        const config = this.appConfigService.getConfig();
        this.currInstallationType = config?.installation_type || 'pos';
        this.selectedWarehouseId = config?.warehouse_id || null;
        this.loadWarehouses();
    }

    async loadSettings() {
        try {
            const data = await this.settingsService.loadSettings();
            if (data) {
                this.settings = { ...data };
            }
            this.loadCurrencies();
        } catch (error) {
            this.snackBar.open('Error al cargar configuración', 'Cerrar', { duration: 3000 });
        } finally {
            this.loading = false;
        }
    }

    loadCurrencies() {
        this.settingsService.getCurrencies().subscribe(res => {
            this.currencies = res;
        });
    }

    loadWarehouses() {
        this.warehouseService.getAll().subscribe(res => {
            this.warehouses = res;
        });
    }

    async saveCurrency(currency: any) {
        try {
            await this.settingsService.updateCurrency(currency.id, {
                exchange_rate: currency.exchange_rate,
                symbol: currency.symbol,
                name: currency.name,
                active: currency.active
            });
            this.snackBar.open(`Moneda ${currency.code} actualizada`, 'Cerrar', { duration: 2000 });
        } catch (error) {
            this.snackBar.open('Error al actualizar moneda', 'Cerrar', { duration: 3000 });
        }
    }

    async saveSettings() {
        try {
            await this.settingsService.updateSettings(this.settings);
            this.appConfigService.setConfig({
                ...this.appConfigService.getConfig(),
                installation_type: this.currInstallationType,
                location_name: this.settings.company_name || 'Generic Location',
                warehouse_id: this.selectedWarehouseId || undefined
            } as any);
            this.snackBar.open('Configuración guardada exitosamente', 'Cerrar', { duration: 3000 });
            // Recargar para aplicar cambios en el menú si es necesario
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            this.snackBar.open('Error al guardar configuración', 'Cerrar', { duration: 3000 });
        }
    }
}
