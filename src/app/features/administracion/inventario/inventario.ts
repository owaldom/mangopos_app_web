import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de Inventario</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Módulo de administración de inventario.</p>
      </mat-card-content>
    </mat-card>
  `
})
export class InventarioComponent { }
