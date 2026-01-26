import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

import { KitComponent } from '../../../../../core/services/product-kit.model';

@Component({
  selector: 'app-kit-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatRadioModule,
    MatCheckboxModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Personalizar Kit: {{ data.productName }}</h2>
    <mat-dialog-content>
      <div class="groups-container">
        <div *ngFor="let group of groups" class="group-box">
          <h3>{{ group.name || 'Opciones' }}</h3>
          
          <!-- Si el grupo tiene múltiples opciones, permitimos elegir una (radio) -->
          <mat-radio-group [(ngModel)]="selections[group.id]" class="options-list">
            <mat-radio-button *ngFor="let comp of group.components" [value]="comp">
              {{ comp.component_name }} 
              <span *ngIf="comp.quantity > 1">(x{{ comp.quantity }})</span>
            </mat-radio-button>
          </mat-radio-group>
        </div>

        <div *ngIf="fixedComponents.length > 0" class="fixed-box">
          <h3>Incluye además:</h3>
          <ul>
            <li *ngFor="let comp of fixedComponents">
              {{ comp.component_name }} x{{ comp.quantity }}
            </li>
          </ul>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" 
              [disabled]="!allGroupsSelected()"
              (click)="onConfirm()">
        Agregar al Carrito
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .groups-container { display: flex; flex-direction: column; gap: 20px; min-width: 300px; }
    .group-box { border: 1px solid #ddd; padding: 16px; border-radius: 8px; }
    .group-box h3 { margin-top: 0; color: #1976d2; border-bottom: 2px solid #e3f2fd; padding-bottom: 8px; }
    .options-list { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
    .fixed-box { background: #f9f9f9; padding: 16px; border-radius: 8px; }
    .fixed-box h3 { margin-top: 0; }
    ul { padding-left: 20px; margin: 0; }
  `]
})
export class KitSelectionDialogComponent implements OnInit {
  groups: { id: number, name: string, components: KitComponent[] }[] = [];
  fixedComponents: KitComponent[] = [];
  selections: { [key: number]: KitComponent } = {};

  constructor(
    public dialogRef: MatDialogRef<KitSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { productName: string, components: KitComponent[] }
  ) { }

  ngOnInit(): void {
    const rawGroups: { [key: number]: KitComponent[] } = {};
    const groupNames: { [key: number]: string } = {};

    this.data.components.forEach(comp => {
      if (comp.group_id) {
        if (!rawGroups[comp.group_id]) {
          rawGroups[comp.group_id] = [];
          groupNames[comp.group_id] = comp.group_name || `Grupo ${comp.group_id}`;
        }
        rawGroups[comp.group_id].push(comp);
      } else {
        this.fixedComponents.push(comp);
      }
    });

    Object.keys(rawGroups).forEach(idStr => {
      const id = parseInt(idStr);
      this.groups.push({
        id,
        name: groupNames[id],
        components: rawGroups[id]
      });

      // Selección por defecto del primer elemento si es obligatorio (asumimos obligatorio por ahora en flexibles)
      if (rawGroups[id].length > 0) {
        // Podríamos pre-seleccionar si hay solo uno o dejar vacío para forzar elección
        // this.selections[id] = rawGroups[id][0];
      }
    });
  }

  allGroupsSelected(): boolean {
    return this.groups.every(g => !!this.selections[g.id]);
  }

  onConfirm(): void {
    const finalSelection: KitComponent[] = [...this.fixedComponents];
    Object.values(this.selections).forEach(sel => finalSelection.push(sel));

    this.dialogRef.close(finalSelection);
  }
}
