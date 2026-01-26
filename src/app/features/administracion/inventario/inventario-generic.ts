import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-inventario-generic',
    standalone: true,
    imports: [CommonModule, MatCardModule],
    template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ title }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>{{ description }}</p>
        <p class="dev-note">Módulo en desarrollo...</p>
      </mat-card-content>
    </mat-card>
  `,
    styles: [`
    mat-card {
      margin: 20px;
    }
    .dev-note {
      color: #999;
      font-style: italic;
      margin-top: 20px;
    }
  `]
})
export class InventarioGenericComponent {
    title = 'Inventario';
    description = 'Gestión de inventario';

    constructor(private route: ActivatedRoute) {
        this.route.data.subscribe(data => {
            this.title = data['title'] || 'Inventario';
            this.description = data['description'] || 'Módulo de gestión de inventario';
        });
    }
}
