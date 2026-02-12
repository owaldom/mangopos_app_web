import { Injectable } from '@angular/core';

export type InstallationType = 'factory' | 'pos';

export interface AppConfig {
    installation_type: InstallationType;
    location_name: string;
    factory_warehouse_id?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {
    private readonly CONFIG_KEY = 'mangopos_app_config';
    private config: AppConfig | null = null;

    constructor() {
        this.loadConfig();
    }

    // Load configuration from localStorage
    private loadConfig(): void {
        const stored = localStorage.getItem(this.CONFIG_KEY);
        if (stored) {
            try {
                this.config = JSON.parse(stored);
            } catch (error) {
                console.error('Error loading app config:', error);
                this.config = null;
            }
        }
    }

    // Get current configuration
    getConfig(): AppConfig | null {
        return this.config;
    }

    // Set configuration
    setConfig(config: AppConfig): void {
        this.config = config;
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    }

    // Get installation type
    getInstallationType(): InstallationType | null {
        return this.config?.installation_type || null;
    }

    // Check if this is a factory installation
    isFactory(): boolean {
        return this.config?.installation_type === 'factory';
    }

    // Check if this is a POS installation
    isPOS(): boolean {
        return this.config?.installation_type === 'pos';
    }

    // Get location name
    getLocationName(): string | null {
        return this.config?.location_name || null;
    }

    // Get factory warehouse ID (only for factory installations)
    getFactoryWarehouseId(): number | null {
        return this.config?.factory_warehouse_id || null;
    }

    // Clear configuration
    clearConfig(): void {
        this.config = null;
        localStorage.removeItem(this.CONFIG_KEY);
    }
}
