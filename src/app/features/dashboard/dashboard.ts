import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SystemDatePipe } from '../../shared/pipes/system-date.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { DashboardService, DashboardStats, RecentSale } from '../../core/services/dashboard.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatTableModule,
        MatPaginatorModule,
        SystemDatePipe
    ],
    templateUrl: './dashboard.html',
    styleUrls: ['./dashboard.scss'],
    providers: [DecimalPipe]
})
export class DashboardComponent implements OnInit {
    private router = inject(Router);
    private dashboardService = inject(DashboardService);
    private settingsService = inject(SettingsService);
    private decimalPipe = inject(DecimalPipe);

    today = new Date();
    totalFormat = '1.2-2';

    // Default/Loading stats
    stats = [
        { label: 'Ventas de Hoy', value: 'Bs. 0.00', icon: 'trending_up', color: '#4caf50', trend: 'Hoy' },
        { label: 'Transacciones', value: '0', icon: 'shopping_cart', color: '#2196f3', trend: 'Hoy' },
        { label: 'Cajas Abiertas', value: '0', icon: 'account_balance_wallet', color: '#ff9800', trend: 'Activas' },
        { label: 'Stock Bajo', value: '0', icon: 'inventory_2', color: '#f44336', trend: 'Productos' }
    ];

    recentSales = new MatTableDataSource<any>([]);
    displayedColumns: string[] = ['id', 'customer', 'total', 'time', 'status'];

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    ngOnInit(): void {
        this.totalFormat = this.settingsService.getDecimalFormat('total');
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.dashboardService.getStats().subscribe({
            next: (data: DashboardStats) => {
                this.updateStats(data);
            },
            error: (err) => console.error('Error loading stats:', err)
        });

        this.dashboardService.getRecentSales().subscribe({
            next: (sales: RecentSale[]) => {
                const formattedSales = sales.map(sale => {
                    // Ensure date is treated as UTC if no timezone is present
                    let dateStr = sale.date;
                    if (dateStr && !dateStr.includes('Z') && !dateStr.includes('+')) {
                        dateStr = dateStr.replace(' ', 'T') + 'Z';
                    }

                    return {
                        id: `TKT-${sale.ticket_number}`,
                        customer: sale.customer_name || 'Público General',
                        total: `Bs. ${this.decimalPipe.transform(sale.total * (sale.exchange_rate || 1), this.totalFormat)}`,
                        time: dateStr,
                        status: sale.status === 0 ? 'COMPLETADO' : 'PENDIENTE',
                        raw_date: dateStr
                    };
                });
                this.recentSales.data = formattedSales;
                this.recentSales.paginator = this.paginator;
            },
            error: (err) => console.error('Error loading recent sales:', err)
        });
    }

    updateStats(data: DashboardStats) {
        this.stats = [
            {
                label: 'Ventas de Hoy',
                value: `Bs. ${this.decimalPipe.transform(data.salesToday.bs, this.totalFormat)}`,
                icon: 'trending_up',
                color: '#4caf50',
                trend: 'Hoy'
            },
            {
                label: 'Transacciones',
                value: data.transactionsToday.toString(),
                icon: 'shopping_cart',
                color: '#2196f3',
                trend: 'Hoy'
            },
            {
                label: 'Cajas Abiertas',
                value: data.openRegisters.toString(),
                icon: 'account_balance_wallet',
                color: '#ff9800',
                trend: 'Activas'
            },
            {
                label: 'Stock Bajo',
                value: data.lowStock.toString(),
                icon: 'inventory_2',
                color: '#f44336',
                trend: 'Productos'
            }
        ];
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }
}
