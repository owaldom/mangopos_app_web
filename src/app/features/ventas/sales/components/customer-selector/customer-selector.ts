import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerService, Customer } from '../../../../../core/services/customer.service';
import { PhoneFormatPipe } from '../../../../../shared/pipes/phone-format.pipe';
import { PhoneFormatDirective } from '../../../../../shared/directives/phone-format.directive';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-customer-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    PhoneFormatPipe,
    PhoneFormatDirective
  ],
  template: `
    
    <div>
      <h2 mat-dialog-title>{{ getTitle() }}</h2>
    </div>
    
    <mat-dialog-content class="customer-dialog-content">
      <!-- MODO BÚSQUEDA -->
      <ng-container *ngIf="!isRegistering">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Buscar por Nombre, Cédula o RIF</mat-label>
          <input matInput [(ngModel)]="searchText" (input)="onSearchChange()" placeholder="Ej: Perez o 20.123..." #searchInput>
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <div class="results-container">
          <mat-spinner *ngIf="loading" diameter="40" class="spinner"></mat-spinner>
          
          <mat-list *ngIf="!loading && customers.length > 0">
            <mat-list-item *ngFor="let c of customers" (click)="selectCustomer(c)" class="customer-item">
              <mat-icon matListItemIcon>person</mat-icon>
              <div matListItemTitle>{{ c.name }}</div>
              <div matListItemLine>{{ c.taxid || 'Sin Cédula' }} | {{ (c.phone | phoneFormat) || 'Sin teléfono' }}</div>
            </mat-list-item>
          </mat-list>

          <div class="no-results" *ngIf="!loading && customers.length === 0 && searchText.length > 2">
            <p>No se encontraron clientes que coincidan.</p>
            <button mat-stroked-button color="primary" (click)="isRegistering = true">
              <mat-icon>person_add</mat-icon> REGISTRAR NUEVO
            </button>
          </div>
        </div>
      </ng-container>

      <!-- MODO REGISTRO -->
      <ng-container *ngIf="isRegistering">
        <div class="registration-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre Completo / Razón Social</mat-label>
            <input matInput [(ngModel)]="newCustomer.name" required>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cédula / RIF</mat-label>
            <input matInput [(ngModel)]="newCustomer.taxid">
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Teléfono</mat-label>
              <input matInput [(ngModel)]="newCustomer.phone" appPhoneFormat>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Correo</mat-label>
              <input matInput [(ngModel)]="newCustomer.email" type="email">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Dirección</mat-label>
            <textarea matInput [(ngModel)]="newCustomer.address" rows="2"></textarea>
          </mat-form-field>
        </div>
      </ng-container>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" *ngIf="!isRegistering">CANCELAR</button>
      <button mat-button (click)="isRegistering = false" *ngIf="isRegistering">VOLVER A BUSCAR</button>
      
      <button mat-raised-button color="primary" (click)="saveNewCustomer()" *ngIf="isRegistering" [disabled]="!newCustomer.name || saving">
        {{ saving ? 'GUARDANDO...' : 'GUARDAR Y SELECCIONAR' }}
      </button>

      <button mat-stroked-button color="primary" (click)="isRegistering = true" *ngIf="!isRegistering">
        NUEVO CLIENTE
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .customer-dialog-content { min-width: 450px; min-height: 350px; }
    .full-width { width: 100%; }
    .results-container { height: 250px; overflow-y: auto; margin-top: 10px; border: 1px solid #eee; border-radius: 4px; }
    .spinner { margin: 50px auto; }
    .customer-item { cursor: pointer; transition: background 0.2s; }
    .customer-item:hover { background: #f5f5f5; }
    .no-results { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; gap: 10px; color: #666; }
    .registration-form { display: flex; flex-direction: column; gap: 5px; padding-top: 10px; }
    .form-row { display: flex; gap: 10px; }
    .form-row mat-form-field { flex: 1; }
  `]
})
export class CustomerSelectorComponent implements OnInit {
  private customerService = inject(CustomerService);
  private dialogRef = inject(MatDialogRef<CustomerSelectorComponent>);
  private snackBar = inject(MatSnackBar);

  data = inject(MAT_DIALOG_DATA, { optional: true });

  searchText: string = '';
  customers: Customer[] = [];
  loading: boolean = false;
  isRegistering: boolean = false;
  saving: boolean = false;

  newCustomer: Partial<Customer> = {
    name: '',
    taxid: '',
    phone: '',
    email: '',
    address: ''
  };

  private searchSubject = new Subject<string>();

  ngOnInit() {
    if (this.data?.customer) {
      this.isRegistering = true;
      this.newCustomer = { ...this.data.customer };
    }

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(text => {
        if (text.length < 2) {
          this.loading = false;
          return [{ data: [], total: 0, page: 1, totalPages: 0 }];
        }
        this.loading = true;
        return this.customerService.getAll(1, 100, text);
      })
    ).subscribe(res => {
      this.customers = res.data;
      this.loading = false;
    });

    // Carga inicial de algunos clientes
    this.loading = true;
    this.customerService.getAll(1, 20).subscribe(res => {
      this.customers = res.data;
      this.loading = false;
    });
  }

  getTitle(): string {
    if (this.isRegistering) {
      return this.newCustomer.id ? 'Editar Cliente' : 'Nuevo Cliente';
    }
    return 'Seleccionar Cliente';
  }

  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }

  selectCustomer(customer: Customer) {
    this.dialogRef.close(customer);
  }

  async saveNewCustomer() {
    if (!this.newCustomer.name) return;

    this.saving = true;
    try {
      let saved;
      if (this.newCustomer.id) {
        saved = await this.customerService.update(this.newCustomer.id, this.newCustomer).toPromise();
      } else {
        saved = await this.customerService.create(this.newCustomer).toPromise();
      }

      if (saved) {
        this.snackBar.open(this.newCustomer.id ? 'Cliente actualizado' : 'Cliente registrado', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(saved);
      }
    } catch (error: any) {
      this.snackBar.open('Error al guardar cliente: ' + (error.error?.error || 'Error desconocido'), 'Cerrar', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
