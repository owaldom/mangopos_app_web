import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductKitService } from '../../../../core/services/product-kit.service';
import { KitComponent, KitHeader } from '../../../../core/services/product-kit.model';
import { ProductKitDialogComponent } from './product-kit-dialog.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-kits',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Kits de Productos (Combos)</h1>
      </div>

      <div class="selection-card">
        <mat-card>
          <mat-card-content>
            <div class="row">
              <mat-form-field appearance="outline" class="kit-selector">
                <mat-label>Seleccionar Kit (Producto tipo KI)</mat-label>
                <mat-select [(ngModel)]="selectedKitId" (selectionChange)="loadKitComponents()">
                  <mat-option *ngFor="let kit of kitHeaders" [value]="kit.id">
                    {{ kit.name }} ({{ kit.reference }})
                  </mat-option>
                </mat-select>
              </mat-form-field>
              
              <button mat-flat-button color="primary" 
                      [disabled]="!selectedKitId" 
                      (click)="addComponent()">
                <mat-icon>add</mat-icon> Agregar Componente
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="table-container" *ngIf="selectedKitId">
        <mat-card>
          <table mat-table [dataSource]="components" class="full-width">
            
            <!-- Group Column -->
            <ng-container matColumnDef="group">
              <th mat-header-cell *matHeaderCellDef> Grupo / Categoría </th>
              <td mat-cell *matCellDef="let element"> 
                <span class="badge" [class.flexible]="element.group_id">
                  {{ element.group_name || 'Fijo (General)' }}
                </span>
              </td>
            </ng-container>

            <!-- Component Column -->
            <ng-container matColumnDef="component">
              <th mat-header-cell *matHeaderCellDef> Producto Componente </th>
              <td mat-cell *matCellDef="let element"> 
                <strong>{{ element.component_name }}</strong><br>
                <small class="text-muted">{{ element.component_reference }}</small>
              </td>
            </ng-container>

            <!-- Quantity Column -->
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef> Cantidad </th>
              <td mat-cell *matCellDef="let element"> {{ element.quantity }} </td>
            </ng-container>

            <!-- Mandatory Column -->
            <ng-container matColumnDef="mandatory">
              <th mat-header-cell *matHeaderCellDef> Obligatorio </th>
              <td mat-cell *matCellDef="let element"> 
                <mat-icon [color]="element.is_mandatory ? 'primary' : 'warn'">
                  {{ element.is_mandatory ? 'check_circle' : 'cancel' }}
                </mat-icon>
              </td>
            </ng-container>

            <!-- Action Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> Acciones </th>
              <td mat-cell *matCellDef="let element">
                <button mat-icon-button color="primary" (click)="editComponent(element)" matTooltip="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="removeComponent(element)" matTooltip="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div class="empty-state" *ngIf="components.length === 0">
            <mat-icon>inventory_2</mat-icon>
            <p>Este kit no tiene componentes configurados aún.</p>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 24px; }
    .header { margin-bottom: 24px; }
    .selection-card { margin-bottom: 24px; }
    .row { display: flex; align-items: center; gap: 16px; }
    .kit-selector { flex: 1; }
    .full-width { width: 100%; }
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      background: #eee;
    }
    .badge.flexible {
      background: #e3f2fd;
      color: #1976d2;
    }
    .text-muted { color: #666; font-size: 11px; }
    .empty-state {
      padding: 48px;
      text-align: center;
      color: #888;
      mat-icon { font-size: 48px; height: 48px; width: 48px; margin-bottom: 16px; }
    }
  `]
})
export class ProductKitsComponent implements OnInit {
  kitHeaders: KitHeader[] = [];
  selectedKitId: number | null = null;
  components: KitComponent[] = [];
  displayedColumns: string[] = ['group', 'component', 'quantity', 'mandatory', 'actions'];

  private kitService = inject(ProductKitService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.loadKitHeaders();
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.selectedKitId = +params['id'];
        this.loadKitComponents();
      }
    });
  }

  loadKitHeaders(): void {
    // For the management view, we might want to load more than just the first 10.
    // Let's load 100 for now to ensure visibility in the selector.
    this.kitService.getKitHeaders(1, 100).subscribe((res: any) => {
      this.kitHeaders = res.data;
    });
  }

  loadKitComponents(): void {
    if (!this.selectedKitId) return;
    this.kitService.getKitComponents(this.selectedKitId).subscribe((comps: KitComponent[]) => {
      this.components = comps;
    });
  }

  addComponent(): void {
    const dialogRef = this.dialog.open(ProductKitDialogComponent, {
      width: '500px',
      data: { kitId: this.selectedKitId }
    });

    dialogRef.afterClosed().subscribe((result: KitComponent | undefined) => {
      if (result) {
        this.saveComponentLocally(result);
      }
    });
  }

  editComponent(comp: KitComponent): void {
    const dialogRef = this.dialog.open(ProductKitDialogComponent, {
      width: '500px',
      data: { kitId: this.selectedKitId, component: comp }
    });

    dialogRef.afterClosed().subscribe((result: KitComponent | undefined) => {
      if (result) {
        this.updateComponentLocally(comp, result);
      }
    });
  }

  saveComponentLocally(result: KitComponent): void {
    // Si ya existe el componente, lo actualizamos, sino lo agregamos
    const index = this.components.findIndex(c => c.component_id === result.component_id);
    if (index > -1) {
      this.components[index] = result;
    } else {
      this.components = [...this.components, result];
    }
    this.persistKit();
  }

  updateComponentLocally(oldComp: KitComponent, newComp: KitComponent): void {
    const index = this.components.indexOf(oldComp);
    if (index > -1) {
      this.components[index] = newComp;
      this.persistKit();
    }
  }

  removeComponent(comp: KitComponent): void {
    if (confirm(`¿Estás seguro de eliminar "${comp.component_name}" del kit?`)) {
      this.components = this.components.filter(c => c !== comp);
      this.persistKit();
    }
  }

  persistKit(): void {
    if (!this.selectedKitId) return;
    this.kitService.saveKit(this.selectedKitId, this.components).subscribe({
      next: () => {
        this.snackBar.open('Configuración del kit guardada', 'Cerrar', { duration: 3000 });
        this.loadKitComponents(); // Recargar para obtener nombres actualizados etc.
      },
      error: () => this.snackBar.open('Error al guardar configuración', 'Cerrar', { duration: 3000 })
    });
  }
}
