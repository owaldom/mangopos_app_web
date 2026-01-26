import { Component, inject, Optional, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CashService } from '../../../core/services/cash.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MoneyInputDirective } from '../../../shared/directives/money-input.directive';
import { PrintService } from '../../../core/services/print.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-cash-opening',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MoneyInputDirective
  ],
  template: `
    <div [class.page-container]="isPage">
      <mat-card [class.opening-card]="isPage">
        <mat-card-header *ngIf="isPage">
          <mat-card-title>Apertura de Caja</mat-card-title>
        </mat-card-header>
        
        <h2 mat-dialog-title *ngIf="!isPage">Apertura de Caja</h2>
        
        <mat-card-content [class.dialog-content]="!isPage">
          <div class="opening-info">
            <p>Equipo: <strong>{{ cashService.hostName }}</strong></p>
            <p>Fecha: {{ today | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>

          <div class="status-box" *ngIf="cashService.isOpened()">
             <mat-icon color="primary">check_circle</mat-icon>
             <p>Ya existe una sesión de caja abierta en este equipo.</p>
          </div>

            <div class="balance-inputs" *ngIf="!cashService.isOpened()">
              <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Fondo Inicial (Bs.)</mat-label>
                  <input matInput type="text" [(ngModel)]="initialBalance" placeholder="0.00" appMoneyInput decimalType="total">
                  <span matPrefix>Bs. &nbsp;</span>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Fondo Inicial ($ USD)</mat-label>
                  <input matInput type="text" [(ngModel)]="initialBalanceAlt" placeholder="0.00" appMoneyInput decimalType="total">
                  <span matPrefix>$ &nbsp;</span>
              </mat-form-field>
            </div>

            <div class="rates-section" *ngIf="!cashService.isOpened() && currencies.length > 0">
              <p class="section-title">Actualizar Tasas de Cambio</p>
              <div class="rates-inputs">
                <ng-container *ngFor="let curr of currencies">
                  <mat-form-field appearance="outline" class="half-width" *ngIf="!curr.is_base">
                    <mat-label>Tasa {{ curr.name }} ({{ curr.symbol }})</mat-label>
                    <input matInput type="text" [(ngModel)]="curr.exchange_rate" placeholder="0.00" appMoneyInput decimalType="price">
                    <span matPrefix>{{ curr.symbol }} &nbsp;</span>
                  </mat-form-field>
                </ng-container>
              </div>
            </div>
          
          <p class="hint" *ngIf="!cashService.isOpened()">Al abrir la caja, podrás comenzar a registrar ventas.</p>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button (click)="onCancel()" *ngIf="!cashService.isOpened() || !isPage">
            {{ cashService.isOpened() ? 'VOLVER' : 'CANCELAR' }}
          </button>
          <button mat-raised-button color="accent" (click)="printOpening()" *ngIf="cashService.isOpened()">
            <mat-icon>print</mat-icon> RE-IMPRIMIR
          </button>
          <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="loading || cashService.isOpened()">
             {{ loading ? 'ABRIENDO...' : (cashService.isOpened() ? 'CAJA YA ABIERTA' : 'ABRIR CAJA') }}
          </button>
          <button mat-raised-button color="primary" (click)="goToPos()" *ngIf="cashService.isOpened() && isPage">
            IR AL PUNTO DE VENTA
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .full-width { width: 100%; margin-top: 10px; }
    .balance-inputs { display: flex; gap: 15px; margin-top: 10px; }
    .half-width { flex: 1; }
    .opening-info { margin-bottom: 20px; color: #666; }
    .hint { font-size: 0.9rem; color: #888; font-style: italic; }
    .page-container { padding: 40px; display: flex; justify-content: center; align-items: flex-start; min-height: 80vh; }
    .opening-card { width: 100%; max-width: 500px; }
    .dialog-content { padding: 0 24px; }
    .status-box { display: flex; align-items: center; gap: 10px; padding: 20px; background: #e8f5e9; border-radius: 8px; margin-bottom: 20px; }
    .status-box p { margin: 0; color: #2e7d32; font-weight: 500; }
    .rates-section { margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
    .section-title { font-weight: 500; color: #555; margin-bottom: 10px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .rates-inputs { display: flex; gap: 15px; flex-wrap: wrap; }
  `]
})
export class CashOpeningComponent implements OnInit {
  public cashService = inject(CashService);
  public settingsService = inject(SettingsService);
  private printService = inject(PrintService);
  private dialogRef = inject(MatDialogRef<CashOpeningComponent>, { optional: true });
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  initialBalance: number = 0;
  initialBalanceAlt: number = 0;
  currencies: any[] = [];
  today = new Date();
  loading = false;
  isPage = false;

  constructor() {
    this.isPage = !this.dialogRef;
  }

  ngOnInit() {
    this.loadCurrencies();
  }

  loadCurrencies() {
    this.settingsService.getCurrencies().subscribe({
      next: (data) => {
        this.currencies = data;
      },
      error: (err) => console.error('Error loading currencies', err)
    });
  }

  onCancel() {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  async onConfirm() {
    this.loading = true;
    try {
      // 1. Actualizar tasas de cambio antes de abrir caja
      for (const curr of this.currencies) {
        if (!curr.is_base) {
          await this.settingsService.updateCurrency(curr.id, {
            ...curr,
            exchange_rate: Number(curr.exchange_rate)
          });
        }
      }

      // 2. Abrir caja
      const session = await this.cashService.openCash({
        initial_balance: Number(this.initialBalance),
        initial_balance_alt: Number(this.initialBalanceAlt)
      });
      this.snackBar.open('Caja abierta exitosamente', 'Cerrar', { duration: 3000 });

      // Emitir ticket
      await this.printService.printCashOpening(session);

      if (this.dialogRef) {
        this.dialogRef.close(true);
      } else {
        this.router.navigate(['/dashboard/ventas/pos']);
      }
    } catch (error: any) {
      this.snackBar.open('Error al abrir la caja', 'Cerrar', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  printOpening() {
    if (this.cashService.currentSession$) {
      this.cashService.currentSession$.subscribe(session => {
        if (session) this.printService.printCashOpening(session);
      }).unsubscribe();
    }
  }

  goToPos() {
    this.router.navigate(['/dashboard/ventas/pos']);
  }
}
