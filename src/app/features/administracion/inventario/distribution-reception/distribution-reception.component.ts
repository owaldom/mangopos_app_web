import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DistributionOrdersService } from '../../../../core/services/distribution-orders.service';
import { DistributionExportData, DistributionImportRequest } from '../../../../core/models/distribution-orders.model';

@Component({
    selector: 'app-distribution-reception',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './distribution-reception.component.html',
    styleUrls: ['./distribution-reception.component.css']
})
export class DistributionReceptionComponent implements OnInit {
    importedData: DistributionExportData | null = null;
    dispatchDocumentNumber: string = '';
    locationId: number = 0;
    receivedBy: string = '';
    receptionNotes: string = '';

    locations: any[] = [];
    loading = false;
    error: string | null = null;
    fileError: string | null = null;

    constructor(
        private distributionService: DistributionOrdersService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadLocations();
    }

    loadLocations(): void {
        // TODO: Load locations from stock service
        // For now, this is a placeholder
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];

        if (!file) {
            return;
        }

        if (!file.name.endsWith('.json')) {
            this.fileError = 'El archivo debe ser un JSON';
            return;
        }

        this.fileError = null;
        this.loading = true;

        this.distributionService.readJSONFile(file).then(
            (data: DistributionExportData) => {
                this.importedData = data;
                this.loading = false;

                // Pre-fill dispatch document number if available
                if (data.distribution_order.dispatch_document_number) {
                    this.dispatchDocumentNumber = data.distribution_order.dispatch_document_number;
                }
            },
            (error: Error) => {
                this.fileError = error.message || 'Error al leer el archivo';
                this.loading = false;
            }
        );
    }

    getTotalItems(): number {
        if (!this.importedData) return 0;
        return this.importedData.distribution_order.lines.reduce(
            (sum: number, line: any) => sum + line.quantity,
            0
        );
    }

    canSubmit(): boolean {
        return !!(
            this.importedData &&
            this.locationId &&
            this.receivedBy
        );
    }

    submit(): void {
        if (!this.canSubmit() || !this.importedData) {
            alert('Complete todos los campos requeridos');
            return;
        }

        const importRequest: DistributionImportRequest = {
            distribution_data: this.importedData,
            dispatch_document_number: this.dispatchDocumentNumber,
            location_id: this.locationId,
            received_by: this.receivedBy,
            reception_notes: this.receptionNotes
        };

        this.loading = true;
        this.error = null;

        this.distributionService.importOrder(importRequest).subscribe({
            next: (response: any) => {
                alert(`Distribución recibida exitosamente: ${response.order_number}`);
                this.reset();
            },
            error: (err: any) => {
                this.error = err.error?.error || 'Error al recibir la distribución';
                alert(this.error);
                this.loading = false;
            }
        });
    }

    reset(): void {
        this.importedData = null;
        this.dispatchDocumentNumber = '';
        this.locationId = 0;
        this.receivedBy = '';
        this.receptionNotes = '';
        this.error = null;
        this.fileError = null;
    }

    cancel(): void {
        this.router.navigate(['/dashboard/inventario/distribution-reception']); // Changed to distribution-reception for consistency
    }
}
