import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="change-password-container">
      <mat-card class="password-card">
        <mat-card-header>
          <div mat-card-avatar class="header-icon">
            <mat-icon color="primary">vpn_key</mat-icon>
          </div>
          <mat-card-title>Cambiar Contraseña</mat-card-title>
          <mat-card-subtitle>Configure una nueva clave para su cuenta</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()" class="password-form">
            <mat-form-field appearance="outline">
              <mat-label>Contraseña Actual</mat-label>
              <input [type]="hideCurrent ? 'password' : 'text'" matInput formControlName="currentPassword">
              <button mat-icon-button matSuffix (click)="hideCurrent = !hideCurrent" [attr.aria-label]="'Hide password'" type="button">
                <mat-icon>{{hideCurrent ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">
                La contraseña actual es requerida
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nueva Contraseña</mat-label>
              <input [type]="hideNew ? 'password' : 'text'" matInput formControlName="newPassword">
              <button mat-icon-button matSuffix (click)="hideNew = !hideNew" [attr.aria-label]="'Hide password'" type="button">
                <mat-icon>{{hideNew ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-hint>Mínimo 6 caracteres</mat-hint>
              <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">
                La nueva contraseña es requerida
              </mat-error>
              <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">
                Mínimo 6 caracteres
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Confirmar Nueva Contraseña</mat-label>
              <input [type]="hideConfirm ? 'password' : 'text'" matInput formControlName="confirmPassword">
              <button mat-icon-button matSuffix (click)="hideConfirm = !hideConfirm" [attr.aria-label]="'Hide password'" type="button">
                <mat-icon>{{hideConfirm ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="passwordForm.errors?.['mismatch']">
                Las contraseñas no coinciden
              </mat-error>
              <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('required')">
                Debe confirmar la contraseña
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-flat-button color="primary" [disabled]="passwordForm.invalid || loading" type="submit">
                {{ loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .change-password-container {
      display: flex;
      justify-content: center;
      padding-top: 50px;
    }
    .password-card {
      width: 100%;
      max-width: 450px;
      padding: 20px;
    }
    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e3f2fd;
      border-radius: 50%;
    }
    .password-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-top: 25px;
    }
    .form-actions {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  passwordForm: FormGroup;
  loading = false;
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMismatchValidator });
  }

  passwordMismatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      this.loading = true;
      const { currentPassword, newPassword } = this.passwordForm.value;

      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: (res) => {
          this.snackBar.open('Contraseña actualizada exitosamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard/inicio']);
          this.loading = false;
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error al actualizar contraseña', 'Cerrar', { duration: 5000 });
          this.loading = false;
        }
      });
    }
  }
}
