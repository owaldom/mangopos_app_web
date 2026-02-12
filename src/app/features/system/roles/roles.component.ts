import { Component, Inject, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { SharedPaginatorComponent } from '../../../shared/components/shared-paginator/shared-paginator.component';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoleService, Role } from '../../../core/services/role.service';

const PERMISSION_GROUPS = [
  {
    name: 'Ventas (POS)',
    icon: 'point_of_sale',
    permissions: [
      { key: 'com.openbravo.pos.sales.JPanelTicketSales', label: 'Punto de Venta (POS)' },
      { key: 'com.openbravo.pos.sales.JPanelTicketEdits', label: 'Editar Líneas / Ventas' },
      { key: 'com.openbravo.pos.sales.JPanelTicketSales$JPanelTicketSalesHistory', label: 'Historial de Ventas' },
      { key: 'com.openbravo.pos.panels.JPanelCloseMoney', label: 'Apertura / Cierre / Movimientos de Caja' },
      { key: 'com.openbravo.pos.customers.CustomersPanel', label: 'Gestión de Clientes' }
    ]
  },
  {
    name: 'Inventario',
    icon: 'inventory_2',
    permissions: [
      { key: 'com.openbravo.pos.inventory.ProductsPanel', label: 'Gestión de Productos' },
      { key: 'com.openbravo.pos.inventory.CategoriesPanel', label: 'Categorías' },
      { key: 'com.openbravo.pos.inventory.TaxPanel', label: 'Impuestos' },
      { key: 'com.openbravo.pos.inventory.StockDiaryPanel', label: 'Movimientos de Stock / Kardex' },
      { key: 'com.openbravo.pos.inventory.StockManagement', label: 'Gestión de Existencias' },
      { key: 'com.openbravo.pos.inventory.BulkPriceChange', label: 'Cambio Masivo de Precios' },
      { key: 'com.openbravo.pos.inventory.KitsPanel', label: 'Kits y Combos' },
      { key: 'com.openbravo.pos.inventory.CompoundsPanel', label: 'Productos Compuestos (Recetas)' }
    ]
  },
  {
    name: 'Administración / Finanzas',
    icon: 'account_balance_wallet',
    permissions: [
      { key: 'com.openbravo.pos.admin.CxCPanel', label: 'Cuentas por Cobrar (CxC)' },
      { key: 'com.openbravo.pos.admin.CxPPanel', label: 'Cuentas por Pagar (CxP)' },
      { key: 'com.openbravo.pos.admin.ExpensesPanel', label: 'Control de Gastos' },
      { key: 'com.openbravo.pos.admin.HabladoresPanel', label: 'Habladores de Precio' }
    ]
  },
  {
    name: 'Sistema y Configuración',
    icon: 'settings_suggest',
    permissions: [
      { key: 'com.openbravo.pos.admin.PeoplePanel', label: 'Usuarios del Sistema' },
      { key: 'com.openbravo.pos.admin.RolesPanel', label: 'Perfiles / Roles' },
      { key: 'Menu.ChangePassword', label: 'Cambio de Clave Personal' },
      { key: 'com.openbravo.pos.config.JPanelConfiguration', label: 'Configuración General' },
      { key: 'com.openbravo.pos.panels.JPanelPrinter', label: 'Configuración de Periféricos (Impresoras)' }
    ]
  },
  {
    name: 'Gestión Bancaria',
    icon: 'account_balance',
    permissions: [
      { key: 'com.openbravo.pos.panels.JPanelBanks', label: 'Cuentas Bancarias / Resumen' },
      { key: 'com.openbravo.pos.panels.JPanelBankReconcile', label: 'Conciliación Bancaria' },
      { key: 'com.openbravo.pos.panels.JPanelBankEntities', label: 'Configuración: Entidades' },
      { key: 'com.openbravo.pos.panels.JPanelBankAccountTypes', label: 'Configuración: Tipos de Cuenta' }
    ]
  }
];

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDividerModule,
    MatExpansionModule,
    MatPaginatorModule,
    SharedPaginatorComponent,
    MatTooltipModule
  ],
  template: `
    <div class="container">
      <mat-card class="main-card">
        <mat-card-header>
          <mat-card-title>Gestión de Roles</mat-card-title>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="editRole(null)">
              <mat-icon>add</mat-icon> Nuevo Rol
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          <table mat-table [dataSource]="dataSource" class="roles-table">
            
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let role"> {{role.name}} </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> Acciones </th>
              <td mat-cell *matCellDef="let role">
                <button mat-icon-button color="primary" (click)="editRole(role)" matTooltip="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteRole(role)" matTooltip="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <app-shared-paginator 
              [length]="totalRecords"
              [pageSize]="pageSize"
              [pageIndex]="currentPage - 1"
              (page)="onPageChange($event)">
          </app-shared-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .main-card { padding: 20px; }
    mat-card-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 20px;
    }
    .header-actions { margin-left: auto; }
    .roles-table { width: 100%; }
  `]
})
export class RolesListComponent implements OnInit {
  private roleService = inject(RoleService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<Role>([]);
  displayedColumns = ['name', 'actions'];

  // Pagination
  totalRecords = 0;
  pageSize = 50;
  currentPage = 1;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.getRoles(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          // Compatibility for direct array response (should not happen if using pagination params)
          this.dataSource.data = res;
          this.totalRecords = res.length;
        } else {
          this.dataSource.data = res.data;
          this.totalRecords = res.total;
        }
      },
      error: (err) => {
        console.error('Error loading roles', err);
        this.dataSource.data = [];
        this.totalRecords = 0;
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRoles();
  }

  editRole(role: Role | null) {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      data: role || { name: '', permissions: '' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (role?.id) {
          this.roleService.updateRole(role.id, result).subscribe(() => {
            this.snackBar.open('Rol actualizado', 'Cerrar', { duration: 3000 });
            this.loadRoles();
          });
        } else {
          this.roleService.createRole(result).subscribe(() => {
            this.snackBar.open('Rol creado', 'Cerrar', { duration: 3000 });
            this.loadRoles();
          });
        }
      }
    });
  }

  deleteRole(role: Role) {
    if (confirm(`¿Está seguro de eliminar el rol "${role.name}"?`)) {
      this.roleService.deleteRole(role.id).subscribe({
        next: () => {
          this.snackBar.open('Rol eliminado', 'Cerrar', { duration: 3000 });
          this.loadRoles();
        },
        error: (err) => {
          this.snackBar.open('Error al eliminar rol: ' + (err.error?.message || err.message), 'Cerrar', { duration: 5000 });
        }
      });
    }
  }
}

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatCheckboxModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule
  ],
  template: `
    <div class="roles-dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>{{ data.id ? 'Editar Rol' : 'Nuevo Rol' }}</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline" class="full-width name-field">
          <mat-label>Nombre del Rol</mat-label>
          <input matInput [(ngModel)]="localData.name" required placeholder="Ej. Cajero, Administrador...">
        </mat-form-field>

        <div class="permissions-container">
          <label class="section-label">Asignación de Permisos de Acceso</label>
          
          <mat-accordion multi="true">
            <mat-expansion-panel *ngFor="let group of permissionGroups" class="group-panel" [expanded]="true">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <div class="title-with-icon">
                    <mat-icon>{{ group.icon }}</mat-icon>
                    <span>{{ group.name }}</span>
                  </div>
                </mat-panel-title>
                <mat-panel-description>
                  <span class="count-badge" [class.all-selected]="getSelectedCount(group) === group.permissions.length">
                    {{ getSelectedCount(group) }} / {{ group.permissions.length }} activos
                  </span>
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="panel-inner">
                <div class="panel-actions">
                  <button mat-stroked-button color="primary" (click)="toggleGroup(group, true); $event.stopPropagation()">
                    <mat-icon>done_all</mat-icon> Seleccionar Todos
                  </button>
                  <button mat-stroked-button color="warn" (click)="toggleGroup(group, false); $event.stopPropagation()">
                    <mat-icon>close</mat-icon> Ninguno
                  </button>
                </div>

                <div class="checkbox-grid">
                  <div *ngFor="let perm of group.permissions" class="perm-item">
                    <mat-checkbox [(ngModel)]="selectedPermissions[perm.key]" color="primary">
                      <span class="perm-label">{{ perm.label }}</span>
                    </mat-checkbox>
                  </div>
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!localData.name">Guardar Cambios</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .roles-dialog-container { padding: 0; }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #eee;
      background: #fbfbfb;
    }
    .dialog-header h2 { margin: 0 !important; font-weight: 500; color: #3f51b5; }
    .close-btn { color: #666; }

    .full-width { width: 100%; }
    .name-field { margin-top: 16px; }
    .dialog-content { 
      width: 100%; 
      max-height: 70vh; 
      padding: 0 24px 24px 24px;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    .section-label { 
      display: block; 
      font-weight: 600; 
      color: #1a237e; 
      margin-bottom: 16px; 
      font-size: 1rem;
      border-left: 4px solid #3f51b5;
      padding-left: 12px;
    }
    
    .group-panel { 
      margin-bottom: 12px !important; 
      border: 1px solid #e0e0e0; 
      border-radius: 8px !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
      overflow: hidden;
    }
    
    .title-with-icon { display: flex; align-items: center; gap: 12px; }
    .title-with-icon mat-icon { color: #3f51b5; }
    .title-with-icon span { font-weight: 500; font-size: 0.95rem; }
    
    .count-badge { 
      background: #f5f5f5; 
      color: #757575; 
      padding: 2px 10px; 
      border-radius: 12px; 
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid #e0e0e0;
    }
    .count-badge.all-selected {
      background: #e8f5e9;
      color: #2e7d32;
      border-color: #c8e6c9;
    }

    .panel-inner { padding: 8px 16px 16px 16px; background: #fafafa; }
    .panel-actions { 
      display: flex; 
      gap: 12px; 
      margin-bottom: 20px; 
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .panel-actions button { 
      font-size: 0.8rem; 
      height: 36px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .panel-actions button mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .perm-item { 
      display: flex; 
      align-items: flex-start; 
      background: white;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #f0f0f0;
      transition: all 0.2s ease;
    }
    .perm-item:hover { border-color: #3f51b5; background: #f5f6ff; }
    .perm-label { font-size: 0.85rem; color: #424242; font-weight: 400; line-height: 1.3; }
    
    ::ng-deep .mat-expansion-panel-header { background: white !important; height: 56px !important; }
    ::ng-deep .mat-expansion-panel-header:hover { background: #fcfcfc !important; }
    ::ng-deep .mat-checkbox-inner-container { margin-top: 2px !important; }
  `]
})
export class RoleDialogComponent {
  localData: Partial<Role>;
  permissionGroups = PERMISSION_GROUPS;
  selectedPermissions: { [key: string]: boolean } = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<RoleDialogComponent>
  ) {
    this.localData = { ...data };
    this.parsePermissions();
  }

  getSelectedCount(group: any): number {
    return group.permissions.filter((p: any) => this.selectedPermissions[p.key]).length;
  }

  toggleGroup(group: any, value: boolean) {
    group.permissions.forEach((p: any) => {
      this.selectedPermissions[p.key] = value;
    });
  }

  private parsePermissions() {
    const xml = this.localData.permissions || '';
    // Extraer todas las clases con regex
    const regex = /<class\s+name="([^"]+)"\s*\/>/g;
    let match;

    // Inicializar todas las conocidas como false
    this.permissionGroups.forEach(g => {
      g.permissions.forEach(p => {
        this.selectedPermissions[p.key] = false;
      });
    });

    while ((match = regex.exec(xml)) !== null) {
      this.selectedPermissions[match[1]] = true;
    }
  }

  private generateXML(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<permissions>\n';

    // Agregar permisos base obligatorios (como JPanelMenu)
    xml += '  <class name="com.openbravo.pos.forms.JPanelMenu"/>\n';
    xml += '  <class name="Menu.Exit"/>\n';

    // Agregar seleccionados
    Object.keys(this.selectedPermissions).forEach(key => {
      if (this.selectedPermissions[key]) {
        xml += `  <class name="${key}"/>\n`;
      }
    });

    xml += '</permissions>';
    return xml;
  }

  onSave() {
    this.localData.permissions = this.generateXML();
    this.dialogRef.close(this.localData);
  }
}
