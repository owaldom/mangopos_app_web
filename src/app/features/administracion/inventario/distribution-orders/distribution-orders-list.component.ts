import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DistributionOrdersService } from '../../../../core/services/distribution-orders.service';
import { DistributionOrder } from '../../../../core/models/distribution-orders.model';

@Component({
    selector: 'app-distribution-orders-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './distribution-orders-list.component.html',
    styleUrls: ['./distribution-orders-list.component.css']
})
export class DistributionOrdersListComponent implements OnInit {
    orders: DistributionOrder[] = [];
    loading = false;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    pageSize = 50;
    totalItems = 0;
    totalPages = 0;

    // Filters
    statusFilter: string = '';
    searchFilter: string = '';

    displayedColumns: string[] = [
        'order_number',
        'destination',
        'date_created',
        'status',
        'actions'
    ];

    constructor(
        private distributionService: DistributionOrdersService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(): void {
        this.loading = true;
        this.error = null;

        this.distributionService
            .getAllOrders(this.currentPage, this.pageSize, this.statusFilter, this.searchFilter)
            .subscribe({
                next: (response: any) => {
                    this.orders = response.data;
                    this.totalItems = response.total;
                    this.totalPages = response.totalPages;
                    this.loading = false;
                },
                error: (err: any) => {
                    this.error = 'Error al cargar las órdenes de distribución';
                    console.error(err);
                    this.loading = false;
                }
            });
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadOrders();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadOrders();
    }

    createNewOrder(): void {
        this.router.navigate(['/dashboard/inventario/distribution-orders/new']);
    }

    viewOrder(order: DistributionOrder): void {
        this.router.navigate(['/dashboard/inventario/distribution-orders', order.id]);
    }

    exportOrder(order: DistributionOrder): void {
        if (!order.id) return;

        this.distributionService.exportOrder(order.id).subscribe({
            next: (data: any) => {
                const filename = `${order.order_number}.json`;
                this.distributionService.downloadJSON(data, filename);
                alert(`Archivo ${filename} descargado exitosamente`);
                this.loadOrders(); // Reload to update status
            },
            error: (err: any) => {
                alert('Error al exportar la orden');
                console.error(err);
            }
        });
    }

    getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            pending: 'Pendiente',
            exported: 'Exportada',
            received: 'Recibida',
            cancelled: 'Cancelada'
        };
        return labels[status] || status;
    }

    getStatusClass(status: string): string {
        const classes: { [key: string]: string } = {
            pending: 'status-pending',
            exported: 'status-exported',
            received: 'status-received',
            cancelled: 'status-cancelled'
        };
        return classes[status] || '';
    }
}
