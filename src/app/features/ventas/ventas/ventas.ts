import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Módulo de Ventas</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Bienvenido al módulo de ventas. Aquí podrás realizar y gestionar las ventas.</p>
        <p>Funcionalidad en desarrollo...</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 20px;
    }
  `]
})
export class VentasComponent { }
