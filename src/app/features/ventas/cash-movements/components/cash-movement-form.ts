import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { SettingsService } from '../../../../core/services/settings.service';
import { CashService, CashSession } from '../../../../core/services/cash.service';
import { MoneyInputDirective } from '../../../../shared/directives/money-input.directive';
import { AuthService } from '../../../../core/services/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate: number;
    is_base: boolean;
}

@Component({
    selector: 'app-cash-movement-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MoneyInputDirective
    ],
    template: `
        <h2 mat-dialog-title>Nuevo Movimiento de Caja</h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-dialog-content class="dialog-content">
                
                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Fecha</mat-label>
                    <input matInput [matDatepicker]="picker" formControlName="date" required>
                    <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Tipo de Movimiento</mat-label>
                    <mat-select formControlName="movementType" required>
                        <mat-option value="IN">Entrada de Efectivo</mat-option>
                        <mat-option value="OUT">Salida de Efectivo</mat-option>
                    </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Monto</mat-label>
                    <input matInput type="text" formControlName="amount" required appMoneyInput decimalType="total">
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Moneda</mat-label>
                    <mat-select formControlName="currencyId" required>
                        <mat-option *ngFor="let currency of currencies" [value]="currency.id">
                            {{ currency.name }} ({{ currency.symbol }})
                        </mat-option>
                    </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Concepto / Descripción</mat-label>
                    <textarea matInput formControlName="concept" rows="3" required></textarea>
                </mat-form-field>

                <div class="info-box" *ngIf="!cashSession">
                    <mat-icon>info</mat-icon>
                    <span>No hay una sesión de caja abierta. El movimiento se registrará sin asociar a una sesión.</span>
                </div>

                <div class="info-box success" *ngIf="cashSession">
                    <mat-icon>check_circle</mat-icon>
                    <span>Sesión activa: {{ cashSession.host }} #{{ cashSession.hostsequence }}</span>
                </div>

            </mat-dialog-content>
            <mat-dialog-actions align="end">
                <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Registrar</button>
            </mat-dialog-actions>
        </form>
    `,
    styles: [`
        .dialog-content { 
            min-width: 500px; 
            display: flex; 
            flex-direction: column; 
            gap: 16px; 
            padding-top: 10px; 
        }
        .full-width { width: 100%; }
        .info-box {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 4px;
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
        }
        .info-box.success {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        .info-box mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
        }
    `]
})
export class CashMovementFormComponent implements OnInit {
    form: FormGroup;
    cashSession: CashSession | null = null;
    currencies: Currency[] = [];

    private fb = inject(FormBuilder);
    private cashService = inject(CashService);
    private authService = inject(AuthService);
    private http = inject(HttpClient);
    public dialogRef = inject(MatDialogRef<CashMovementFormComponent>);
    public settingsService = inject(SettingsService);

    constructor() {
        this.form = this.fb.group({
            date: [new Date(), Validators.required],
            movementType: ['IN', Validators.required],
            amount: [0, [Validators.required, Validators.min(0.01)]],
            currencyId: [1, Validators.required],
            concept: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        // Load currencies
        this.http.get<Currency[]>(`${environment.apiUrl}/sales/currencies`).subscribe(currencies => {
            this.currencies = currencies;
            // Set default currency from session or first currency
            if (this.cashSession?.currency_id) {
                this.form.patchValue({ currencyId: this.cashSession.currency_id });
            } else if (currencies.length > 0) {
                const baseCurrency = currencies.find(c => c.is_base) || currencies[0];
                this.form.patchValue({ currencyId: baseCurrency.id });
            }
        });

        // Get current cash session
        this.cashService.currentSession$.subscribe((session: CashSession | null) => {
            this.cashSession = session;
            if (session?.currency_id && this.currencies.length > 0) {
                this.form.patchValue({ currencyId: session.currency_id });
            }
        });
    }

    onSubmit(): void {
        if (this.form.valid) {
            const formVal = this.form.value;
            const currentUser: any = this.authService.getCurrentUser();

            const movementPayload = {
                date: formVal.date,
                movementType: formVal.movementType,
                amount: formVal.amount,
                concept: formVal.concept,
                moneyId: this.cashSession?.money || null,
                currencyId: formVal.currencyId,
                person: currentUser?.id || null
            };

            this.dialogRef.close(movementPayload);
        }
    }
}
