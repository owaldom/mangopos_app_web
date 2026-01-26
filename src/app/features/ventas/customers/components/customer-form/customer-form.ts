import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MoneyInputDirective } from '../../../../../shared/directives/money-input.directive';
import { LoadingButtonDirective } from '../../../../../shared/directives/loading-button.directive';
import { PhoneFormatDirective } from '../../../../../shared/directives/phone-format.directive';
import { CustomerService, Customer } from '../../../../../core/services/customer.service';
import { DiscountService } from '../../../../../core/services/discount.service';
import { SettingsService } from '../../../../../core/services/settings.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSelectModule,
    MoneyInputDirective,
    LoadingButtonDirective,
    PhoneFormatDirective
  ],
  providers: [DatePipe, DecimalPipe],
  template: `
    <h2 mat-dialog-title>{{ getTitle() }}</h2>
    
    <mat-dialog-content class="customer-form-content">
      <form [formGroup]="customerForm">
        <mat-tab-group>
          <!-- Tab 1: Datos Generales -->
          <mat-tab label="General">
            <div class="tab-padding">
              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Nombre / Razón Social</mat-label>
                  <input matInput formControlName="name" required placeholder="Ej: Juan Perez o Empresa C.A.">
                  <mat-error *ngIf="customerForm.get('name')?.hasError('required')">
                    El nombre es obligatorio
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Cédula / RIF</mat-label>
                  <input matInput formControlName="taxid" placeholder="V-12345678">
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Clave de Búsqueda</mat-label>
                  <input matInput formControlName="searchkey" placeholder="Código interno">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Primer Nombre</mat-label>
                  <input matInput formControlName="firstname">
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Apellidos</mat-label>
                  <input matInput formControlName="lastname">
                </mat-form-field>
              </div>
              
              <div class="form-row">
                <mat-checkbox formControlName="visible">Visible en Catálogo / Búsquedas</mat-checkbox>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 2: Finanzas y Descuentos -->
          <mat-tab label="Finanzas">
            <div class="tab-padding">
              <div class="form-row" *ngIf="data?.customer">
                <mat-form-field appearance="outline" class="flex-1 info-field">
                  <mat-label>Deuda Actual $</mat-label>
                  <input matInput [value]="data.customer.curdebt | number:settingsService.getDecimalFormat('total')" readonly>
                  <mat-icon matPrefix>account_balance_wallet</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1 info-field">
                  <mat-label>Última Operación</mat-label>
                  <input matInput [value]="data.customer.curdate | date:'dd/MM/yyyy HH:mm'" readonly>
                  <mat-icon matPrefix>event</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Límite de Crédito $ (Máx. Deuda)</mat-label>
                  <input matInput appMoneyInput decimalType="total" formControlName="maxdebt" placeholder="0.00">
                  <mat-icon matSuffix>credit_card</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Categoría de Descuento</mat-label>
                  <mat-select formControlName="discountcategory">
                    <mat-option [value]="null">Sin Categoría</mat-option>
                    <mat-option *ngFor="let cat of discountCategories" [value]="cat.id">
                      {{ cat.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 3: Contacto y Dirección -->
          <mat-tab label="Contacto y Dirección">
            <div class="tab-padding">
              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Teléfono</mat-label>
                  <input matInput formControlName="phone" appPhoneFormat>
                  <mat-icon matSuffix>phone</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Correo Electrónico</mat-label>
                  <input matInput formControlName="email" type="email">
                  <mat-icon matSuffix>email</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Dirección</mat-label>
                  <textarea matInput formControlName="address" rows="3" placeholder="Dirección completa..."></textarea>
                  <mat-icon matSuffix>place</mat-icon>
                </mat-form-field>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 4: Notas -->
          <mat-tab label="Notas">
            <div class="tab-padding">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Notas / Observaciones</mat-label>
                <textarea matInput formControlName="notes" rows="6" placeholder="Información adicional del cliente..."></textarea>
              </mat-form-field>
            </div>
          </mat-tab>
        </mat-tab-group>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">{{ data?.viewOnly ? 'CERRAR' : 'CANCELAR' }}</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!customerForm.valid || saving" *ngIf="!data?.viewOnly" [appLoading]="saving">
        {{ saving ? 'GUARDANDO...' : (data?.customer ? 'ACTUALIZAR' : 'GUARDAR') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .customer-form-content { min-width: 550px; }
    .tab-padding { padding: 20px 0; display: flex; flex-direction: column; gap: 10px; }
    .form-row { display: flex; gap: 15px; }
    .flex-1 { flex: 1; }
    .full-width { width: 100%; }
    textarea { resize: vertical; }
    .info-field :host ::ng-deep .mat-mdc-text-field-wrapper { background-color: #f5f5f5; }
  `]
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustomerFormComponent>);
  public data = inject(MAT_DIALOG_DATA, { optional: true });
  private customerService = inject(CustomerService);
  private discountService = inject(DiscountService);
  public settingsService = inject(SettingsService);

  customerForm!: FormGroup;
  saving = false;
  discountCategories: any[] = [];

  ngOnInit() {
    this.initForm();
    this.loadDiscountCategories();
    if (this.data?.customer) {
      this.customerForm.patchValue(this.data.customer);
    }
    if (this.data?.viewOnly) {
      this.customerForm.disable();
    }
  }

  getTitle(): string {
    if (this.data?.viewOnly) return 'Datos del Cliente';
    return this.data?.customer ? 'Editar Cliente' : 'Nuevo Cliente';
  }

  private initForm() {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      taxid: [''],
      searchkey: [''],
      firstname: [''],
      lastname: [''],
      email: ['', Validators.email],
      phone: [''],
      address: [''],
      notes: [''],
      visible: [true],
      maxdebt: [0],
      discountcategory: [null]
    });
  }

  private loadDiscountCategories() {
    this.discountService.getDiscountCustCategories().subscribe(cats => {
      this.discountCategories = cats;
    });
  }

  onSave() {
    if (this.customerForm.invalid) return;

    this.saving = true;
    const customerData = this.customerForm.value;

    if (this.data?.customer) {
      this.customerService.update(this.data.customer.id, customerData).subscribe({
        next: (res: Customer) => this.dialogRef.close(res),
        error: () => this.saving = false
      });
    } else {
      this.customerService.create(customerData).subscribe({
        next: (res: Customer) => this.dialogRef.close(res),
        error: () => this.saving = false
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
