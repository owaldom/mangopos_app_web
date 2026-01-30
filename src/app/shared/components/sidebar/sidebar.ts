import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth';
import { UiService } from '../../../core/services/ui.service';

interface MenuItem {
  name: string;
  route?: string;
  icon: string;
  permission?: string;
  children?: MenuItem[];
}

interface MenuSection {
  name: string;
  icon: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  host: {
    '[class.is-collapsed]': 'ui.isSidebarCollapsed()'
  }
})
export class SidebarComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  public ui = inject(UiService);

  menuSections: MenuSection[] = [
    {
      name: 'Ventas',
      icon: 'shopping_cart',
      items: [
        { name: 'Dashboard', route: '/dashboard/inicio', icon: 'dashboard' },
        { name: 'Punto de Venta', route: '/dashboard/ventas/pos', icon: 'point_of_sale', permission: 'sales' },
        { name: 'Consultar Ventas', route: '/dashboard/consultar-ventas', icon: 'search', permission: 'sales.history' },
        { name: 'Clientes', route: '/dashboard/clientes', icon: 'people', permission: 'sales' },
        { name: 'Movimientos de Cajas', route: '/dashboard/movimientos-cajas', icon: 'account_balance', permission: 'sales.close_cash' },
        { name: 'Apertura Caja', route: '/dashboard/apertura-caja', icon: 'lock_open', permission: 'sales' },
        { name: 'Cierre de Caja', route: '/dashboard/cierre-caja', icon: 'lock', permission: 'sales.close_cash' }
      ]
    },
    {
      name: 'Administración',
      icon: 'admin_panel_settings',
      items: [
        { name: 'CxC Clientes', route: '/dashboard/admin-clientes', icon: 'people', permission: 'admin.cxc' },
        { name: 'Proveedores', route: '/dashboard/admin-proveedores', icon: 'local_shipping', permission: 'admin.cxp' },
        { name: 'CxP Proveedores', route: '/dashboard/admin-proveedores-cxp', icon: 'request_quote', permission: 'admin.cxp' },
        { name: 'Registrar Gastos', route: '/dashboard/admin-gastos', icon: 'monetization_on', permission: 'admin.expenses' },
        { name: 'Habladores de Precio', route: '/dashboard/admin-habladores', icon: 'label', permission: 'admin.habladores' },
        {
          name: 'Inventario',
          icon: 'inventory',
          permission: 'inventory.products', // Higher level check
          children: [
            { name: 'Productos', route: '/dashboard/inventario/productos', icon: 'shopping_bag', permission: 'inventory.products' },
            { name: 'Categorías', route: '/dashboard/inventario/categorias', icon: 'category', permission: 'inventory.categories' },
            { name: 'Cambio de Precios', route: '/dashboard/inventario/cambio-precios', icon: 'price_change', permission: 'inventory.bulk_price_change' },
            { name: 'Impuestos', route: '/dashboard/inventario/impuestos', icon: 'receipt', permission: 'inventory.taxes' },
            { name: 'Movimientos de Existencia', route: '/dashboard/inventario/movimientos', icon: 'sync_alt', permission: 'inventory.products' },
            { name: 'Factura de Compras', route: '/dashboard/inventario/compras', icon: 'shopping_basket', permission: 'admin.cxp' },
            { name: 'Gestión de Inventarios', route: '/dashboard/inventario/gestion', icon: 'inventory_2', permission: 'inventory.products' },
            { name: 'Despiece de Productos', route: '/dashboard/inventario/despiece', icon: 'call_split', permission: 'inventory.products' },
            { name: 'Consulta de Compuestos', route: '/dashboard/inventario/consultar-compuestos', icon: 'view_list', permission: 'inventory.compounds' },
            { name: 'Gestionar Compuestos', route: '/dashboard/inventario/productos-compuestos', icon: 'layers', permission: 'inventory.compounds' },
            { name: 'Consulta de Kits', route: '/dashboard/inventario/consultar-kits', icon: 'view_list', permission: 'inventory.kits' },
            { name: 'Gestionar Kits', route: '/dashboard/inventario/kits-productos', icon: 'auto_awesome_motion', permission: 'inventory.kits' },
            { name: 'Bajo Stock', route: '/dashboard/inventario/bajo-stock', icon: 'report_problem' },
            { name: 'Descuentos', icon: 'discount', route: '/dashboard/inventario/discounts' },
            { name: 'Cat. Descuento (P)', icon: 'category', route: '/dashboard/inventario/discount-categories' },
            { name: 'Cat. Descuento (C)', icon: 'people', route: '/dashboard/inventario/discount-cust-categories' }
          ]
        },
        { name: 'Ventas', route: '/dashboard/admin-ventas', icon: 'trending_up', permission: 'sales.history' },
        { name: 'Reportes por Módulos', route: '/dashboard/reportes', icon: 'analytics' },
        { name: 'Gestión de Bancos', route: '/dashboard/bancos', icon: 'account_balance' },
        { name: 'Configuración', route: '/dashboard/configuracion', icon: 'settings' }
      ]
    },
    {
      name: 'Sistema',
      icon: 'computer',
      items: [
        { name: 'Usuarios', route: '/dashboard/system/users', icon: 'people', permission: 'system.users' },
        { name: 'Roles', route: '/dashboard/system/roles', icon: 'badge', permission: 'system.roles' },
        { name: 'Configuración', route: '/dashboard/config-sistema', icon: 'tune', permission: 'system.config' },
        { name: 'Impresoras', route: '/dashboard/impresoras', icon: 'print', permission: 'system.printers' }
      ]
    }
  ];

  get filteredMenuSections(): MenuSection[] {
    return this.menuSections.map(section => ({
      ...section,
      items: this.filterItems(section.items)
    })).filter(section => section.items.length > 0);
  }

  private filterItems(items: MenuItem[]): MenuItem[] {
    return items.filter(item => {
      if (item.permission && !this.authService.hasPermission(item.permission)) {
        return false;
      }
      if (item.children) {
        item.children = this.filterItems(item.children);
        return item.children.length > 0;
      }
      return true;
    });
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }

  toggleCollapse(): void {
    this.ui.toggleSidebar();
  }
}
