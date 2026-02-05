import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BanksService } from '../../../core/services/banks.service';

@Component({
    selector: 'app-bank-summary',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './bank-summary.html',
    styleUrls: ['./bank-summary.scss']
})
export class BankSummaryComponent implements OnInit {
    private banksService = inject(BanksService);

    loading = true;
    summaryData: any = null;

    ngOnInit(): void {
        this.loadSummary();
    }

    loadSummary(): void {
        this.loading = true;
        this.banksService.getBanksSummary().subscribe({
            next: (data) => {
                this.summaryData = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading summary:', err);
                this.loading = false;
            }
        });
    }

    getCurrencyTotal(currency: 'VES' | 'USD'): number {
        if (!this.summaryData) return 0;
        const total = this.summaryData.totals.find((t: any) => t.currency === currency);
        return total ? Number(total.total_balance) : 0;
    }

    getAccountCount(currency: 'VES' | 'USD'): number {
        if (!this.summaryData) return 0;
        const total = this.summaryData.totals.find((t: any) => t.currency === currency);
        return total ? Number(total.account_count) : 0;
    }

    formatCurrency(amount: number, currency: string): string {
        const symbol = currency === 'USD' ? '$' : 'Bs.';
        return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}
