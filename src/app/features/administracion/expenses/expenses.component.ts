import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

// Import child components (to be created)
import { ExpenseDefinitionListComponent } from './components/expense-definition-list/expense-definition-list.component';
import { DailyExpenseFormComponent } from './components/daily-expense-form/daily-expense-form.component';
import { DailyExpenseListComponent } from './components/daily-expense-list/daily-expense-list.component';

@Component({
    selector: 'app-expenses',
    standalone: true,
    imports: [
        CommonModule,
        MatTabsModule,
        MatCardModule,
        MatIconModule,
        ExpenseDefinitionListComponent,
        DailyExpenseFormComponent,
        DailyExpenseListComponent
    ],
    template: `
        <div class="container">
            <mat-card class="main-card">
                <mat-card-header>
                    <mat-card-title>
                        <mat-icon>receipt_long</mat-icon>
                        Gestión de Gastos
                    </mat-card-title>
                    <mat-card-subtitle>Administre tipos de gastos y registre gastos diarios</mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <mat-tab-group animationDuration="300ms">
                        <mat-tab>
                            <ng-template mat-tab-label>
                                <mat-icon class="tab-icon">category</mat-icon>
                                Definir Gastos
                            </ng-template>
                            <div class="tab-content">
                                <app-expense-definition-list></app-expense-definition-list>
                            </div>
                        </mat-tab>

                        <mat-tab>
                            <ng-template mat-tab-label>
                                <mat-icon class="tab-icon">add_circle</mat-icon>
                                Registrar Gasto
                            </ng-template>
                            <div class="tab-content">
                                <app-daily-expense-form></app-daily-expense-form>
                            </div>
                        </mat-tab>

                        <mat-tab>
                            <ng-template mat-tab-label>
                                <mat-icon class="tab-icon">list_alt</mat-icon>
                                Consultar Gastos
                            </ng-template>
                            <div class="tab-content">
                                <app-daily-expense-list></app-daily-expense-list>
                            </div>
                        </mat-tab>
                    </mat-tab-group>
                </mat-card-content>
            </mat-card>
        </div>
    `,
    styles: [`
        .container {
            padding: 20px;
        }

        .main-card {
            padding: 10px;
        }

        mat-card-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        mat-card-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 24px;
        }

        .tab-icon {
            margin-right: 8px;
        }

        .tab-content {
            padding: 20px 0;
        }

        ::ng-deep .mat-mdc-tab-labels {
            justify-content: flex-start;
        }

        ::ng-deep .mat-mdc-tab-label {
            min-width: 160px;
        }
    `]
})
export class ExpensesComponent implements OnInit {
    ngOnInit(): void {
        // Initialization logic loaded components..
    }
}
