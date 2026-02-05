import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SystemDatePipe } from '../../shared/pipes/system-date.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { DashboardService, DashboardStats, RecentSale } from '../../core/services/dashboard.service';
import { SettingsService } from '../../core/services/settings.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

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
        MatTooltipModule,
        MatChipsModule,
        SystemDatePipe,
        BaseChartDirective
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
    loading = true;

    // Stats
    stats: any[] = [];
    advancedStats: any = null;

    // Charts
    public salesChartData?: ChartData<'line'>;
    public salesChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            y: { beginAtZero: true, grid: { display: true, color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
        }
    };

    public paymentChartData?: ChartData<'doughnut'>;
    public paymentChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
        }
    };

    public stockChartData?: ChartData<'doughnut'>;
    public expensesChartData?: ChartData<'bar'>;
    public topProductsChartData?: ChartData<'bar'>;

    public expensesChartOptions: ChartConfiguration['options'] = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        }
    };

    public topProductsChartOptions: ChartConfiguration['options'] = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `Unidades: ${context.formattedValue}`
                }
            }
        },
        scales: {
            x: { beginAtZero: true, grid: { display: false } },
            y: { grid: { display: false } }
        }
    };

    recentSales = new MatTableDataSource<any>([]);
    displayedColumns: string[] = ['id', 'customer', 'total', 'time'];

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    ngOnInit(): void {
        this.totalFormat = this.settingsService.getDecimalFormat('total');
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.loading = true;

        // Load basic stats
        this.dashboardService.getStats().subscribe({
            next: (data: DashboardStats) => {
                this.updateStats(data);
            },
            error: (err) => console.error('Error loading stats:', err)
        });

        // Load recent sales
        this.dashboardService.getRecentSales().subscribe({
            next: (sales: RecentSale[]) => {
                this.recentSales.data = sales.map(sale => ({
                    id: `TKT-${sale.ticket_number}`,
                    customer: sale.customer_name || 'Público General',
                    total: `Bs. ${this.decimalPipe.transform(sale.total * (sale.exchange_rate || 1), this.totalFormat)}`,
                    time: sale.date,
                    status: sale.status === 0 ? 'COMPLETADO' : 'PENDIENTE'
                }));
                this.recentSales.paginator = this.paginator;
            }
        });

        // Load advanced stats
        this.dashboardService.getAdvancedStats().subscribe({
            next: (data) => {
                this.advancedStats = data;
                this.processAdvancedStats(data);
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading advanced stats:', err);
                this.loading = false;
            }
        });
    }

    updateStats(data: DashboardStats) {
        this.stats = [
            { label: 'Ventas de Hoy', value: `Bs. ${this.decimalPipe.transform(data.salesToday.bs, this.totalFormat)}`, icon: 'trending_up', color: '#4caf50', trend: 'Ingresos' },
            { label: 'Transacciones', value: data.transactionsToday.toString(), icon: 'receipt_long', color: '#2196f3', trend: 'Tickets' },
            { label: 'Cajas Abiertas', value: data.openRegisters.toString(), icon: 'account_balance_wallet', color: '#ff9800', trend: 'Estado' },
            { label: 'Stock Bajo', value: data.lowStock.toString(), icon: 'inventory_2', color: '#f44336', trend: 'Alertas' }
        ];
    }

    processAdvancedStats(data: any) {
        // Sales Trend
        if (data.sales && data.sales.daily) {
            this.salesChartData = {
                labels: data.sales.daily.map((d: any) => new Date(d.date).toLocaleDateString()),
                datasets: [
                    {
                        data: data.sales.daily.map((d: any) => d.total_bs),
                        label: 'Ventas (Bs)',
                        fill: true,
                        backgroundColor: 'rgba(63, 81, 181, 0.1)',
                        borderColor: '#3f51b5',
                        tension: 0.4,
                        pointBackgroundColor: '#3f51b5'
                    }
                ]
            };
        }

        // Payment Methods
        if (data.sales && data.sales.payments) {
            this.paymentChartData = {
                labels: data.sales.payments.map((p: any) => p.method),
                datasets: [{
                    data: data.sales.payments.map((p: any) => p.amount_bs),
                    backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#795548']
                }]
            };
        }

        // Stock Health
        if (data.inventory && data.inventory.stockHealth) {
            const h = data.inventory.stockHealth;
            this.stockChartData = {
                labels: ['Sin Stock', 'Stock Bajo', 'Óptimo'],
                datasets: [{
                    data: [h.outOfStock, h.lowStock, h.optimal],
                    backgroundColor: ['#f44336', '#ff9800', '#4caf50']
                }]
            };
        }

        // Expenses
        if (data.expenses && data.expenses.byCategory) {
            this.expensesChartData = {
                labels: data.expenses.byCategory.map((e: any) => e.category),
                datasets: [{
                    data: data.expenses.byCategory.map((e: any) => e.total_bs),
                    label: 'Gastos (Bs)',
                    backgroundColor: 'rgba(244, 67, 54, 0.6)',
                    borderColor: '#f44336',
                    borderWidth: 1
                }]
            };
        }

        // Top Products
        if (data.sales && data.sales.topProducts) {
            this.topProductsChartData = {
                labels: data.sales.topProducts.map((p: any) => p.name),
                datasets: [{
                    data: data.sales.topProducts.map((p: any) => p.total_units),
                    label: 'Unidades Vendidas',
                    backgroundColor: 'rgba(33, 150, 243, 0.7)',
                    borderColor: '#2196f3',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            };
        }
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }
}
