import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Recuperar Contraseña</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Funcionalidad en desarrollo...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class ForgotPasswordComponent { }
