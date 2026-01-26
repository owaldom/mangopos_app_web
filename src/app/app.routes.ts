import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./shared/layouts/main-layout/main-layout').then(m => m.MainLayoutComponent),
        children: [
            {
                path: 'inicio',
                loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
                data: { title: 'Panel de Control' }
            },
            // Sección Ventas
            {
                path: 'ventas/pos',
                canActivate: [permissionGuard],
                data: { permission: 'sales' },
                loadComponent: () => import('./features/ventas/sales/sales').then(m => m.SalesComponent)
            },
            {
                path: 'ventas',
                loadComponent: () => import('./features/ventas/ventas/ventas').then(m => m.VentasComponent)
            },
            {
                path: 'consultar-ventas',
                loadComponent: () => import('./features/ventas/consultar-ventas/consultar-ventas').then(m => m.ConsultarVentasComponent)
            },
            {
                path: 'clientes',
                loadComponent: () => import('./features/ventas/customers/customers').then(m => m.CustomersComponent),
                data: { title: 'Clientes', description: 'Gestión de clientes' }
            },
            {
                path: 'movimientos-cajas',
                loadComponent: () => import('./features/ventas/cash-movements/cash-movements').then(m => m.CashMovementsComponent),
                data: { title: 'Movimientos de Caja', description: 'Historial de movimientos de caja' }
            },
            {
                path: 'apertura-caja',
                loadComponent: () => import('./features/ventas/cash-opening/cash-opening').then(m => m.CashOpeningComponent),
                data: { title: 'Apertura de Caja', description: 'Abrir caja registradora' }
            },
            {
                path: 'cierre-caja',
                loadComponent: () => import('./features/ventas/cash-closing/cash-closing').then(m => m.CashClosingComponent),
                data: { title: 'Cierre de Caja', description: 'Cerrar y arquear caja' }
            },
            // Sección Administración
            {
                path: 'admin-clientes',
                loadComponent: () => import('./features/ventas/customers/cxc-clientes').then(m => m.CxCClientesComponent),
                data: { title: 'Administración de Clientes (CxC)', description: 'Gestión de clientes con deuda' }
            },
            {
                path: 'admin-proveedores',
                loadComponent: () => import('./features/administracion/suppliers/suppliers.component').then(m => m.SuppliersComponent),
                data: { title: 'Proveedores', description: 'Gestión de proveedores' }
            },
            {
                path: 'admin-proveedores-cxp',
                loadComponent: () => import('./features/administracion/suppliers/cxp-proveedores.component').then(m => m.CxPProveedoresComponent),
                data: { title: 'Administración de Proveedores (CxP)', description: 'Gestión de deudas con proveedores' }
            },
            {
                path: 'admin-gastos',
                loadComponent: () => import('./features/administracion/expenses/expenses.component').then(m => m.ExpensesComponent),
                data: { title: 'Registrar Gastos', description: 'Registro de salidas de caja' }
            },
            {
                path: 'admin-habladores',
                loadComponent: () => import('./features/administracion/price-tags/price-tags.component').then(m => m.PriceTagsComponent),
                data: { title: 'Habladores de Precio', description: 'Generar etiquetas de precio' }
            },
            // Submenú Inventario
            {
                path: 'inventario/productos',
                canActivate: [permissionGuard],
                data: { permission: 'inventory.products', title: 'Productos', description: 'Gestión de productos y stock' },
                loadComponent: () => import('./features/administracion/inventario/productos/productos').then(m => m.ProductosComponent)
            },

            {
                path: 'inventario/productos-almacen',
                loadComponent: () => import('./features/administracion/inventario/inventario-generic').then(m => m.InventarioGenericComponent),
                data: { title: 'Productos por Almacén', description: 'Gestión de productos por almacén' }
            },
            {
                path: 'inventario/productos-auxiliares',
                loadComponent: () => import('./features/administracion/inventario/inventario-generic').then(m => m.InventarioGenericComponent),
                data: { title: 'Productos Auxiliares', description: 'Gestión de productos auxiliares' }
            },
            {
                path: 'inventario/categorias',
                canActivate: [permissionGuard],
                data: { permission: 'inventory.categories', title: 'Categorías', description: 'Gestión de categorías de productos' },
                loadComponent: () => import('./features/administracion/inventario/categorias/categorias').then(m => m.CategoriasComponent)
            },

            {
                path: 'inventario/atributos',
                loadComponent: () => import('./features/administracion/inventario/inventario-generic').then(m => m.InventarioGenericComponent),
                data: { title: 'Atributos de Productos', description: 'Definición de atributos de productos' }
            },
            {
                path: 'inventario/valores-atributos',
                loadComponent: () => import('./features/administracion/inventario/inventario-generic').then(m => m.InventarioGenericComponent),
                data: { title: 'Valores de Atributos', description: 'Gestión de valores para atributos' }
            },
            {
                path: 'inventario/conjunto-atributos',
                loadComponent: () => import('./features/administracion/inventario/inventario-generic').then(m => m.InventarioGenericComponent),
                data: { title: 'Conjunto de Atributos de Productos', description: 'Conjuntos de atributos' }
            },
            {
                path: 'inventario/uso-atributos',
                loadComponent: () => import('./features/administracion/inventario/inventario-generic').then(m => m.InventarioGenericComponent),
                data: { title: 'Uso de Atributos de Productos', description: 'Configuración de uso de atributos' }
            },
            {
                path: 'inventario/impuestos',
                loadComponent: () => import('./features/administracion/inventario/taxes/taxes').then(m => m.TaxesComponent),
                data: { title: 'Impuestos', description: 'Gestión de impuestos' }
            },
            {
                path: 'inventario/categorias-impuestos',
                loadComponent: () => import('./features/administracion/inventario/tax-categories/tax-categories').then(m => m.TaxCategoriesComponent),
                data: { title: 'Categorías de Impuestos', description: 'Gestión de categorías de impuestos' }
            },
            {
                path: 'inventario/categoria-impuestos',
                loadComponent: () => import('./features/administracion/inventario/inventario-generic').then(m => m.InventarioGenericComponent),
                data: { title: 'Categoría de Impuestos', description: 'Categorías de impuestos' }
            },
            {
                path: 'inventario/categoria-impuestos-clientes',
                loadComponent: () => import('./features/administracion/inventario/inventario-generic').then(m => m.InventarioGenericComponent),
                data: { title: 'Categoría de Impuestos por Clientes', description: 'Categorías de impuestos para clientes' }
            },
            {
                path: 'inventario/movimientos',
                loadComponent: () => import('./features/administracion/inventario/stock-movements/stock-movements').then(m => m.StockMovementsComponent),
                data: { title: 'Movimientos de Existencia', description: 'Registro de movimientos de inventario' }
            },

            {
                path: 'inventario/gestion',
                canActivate: [permissionGuard],
                data: { permission: 'sales.edit', title: 'Gestión de Inventarios' }, // Using sales.edit or similar if appropriate, but following map
                loadComponent: () => import('./features/administracion/inventario/stock-management/stock-management').then(m => m.StockManagementComponent)
            },
            {
                path: 'inventario/despiece',
                loadComponent: () => import('./features/administracion/inventario/product-despiece/product-despiece').then(m => m.ProductDespieceComponent),
                data: { title: 'Despiece de Productos', description: 'Configurar y ejecutar despiece de productos' }
            },
            {
                path: 'inventario/bajo-stock',
                loadComponent: () => import('./features/administracion/inventario/low-stock/low-stock').then(m => m.LowStockComponent),
                data: { title: 'Stock Bajo', description: 'Consulta de productos con stock bajo el mínimo' }
            },
            {
                path: 'inventario/compras',
                loadComponent: () => import('./features/administracion/inventario/purchases/purchases').then(m => m.PurchasesComponent),
                data: { title: 'Factura de Compras', description: 'Manejo de facturas de compras' }
            },
            {
                path: 'inventario/discounts',
                loadComponent: () => import('./features/administracion/inventario/discounts/discount-list/discount-list').then(m => m.DiscountListComponent),
                data: { title: 'Descuentos', description: 'Gestión de descuentos' }
            },
            {
                path: 'inventario/discount-categories',
                loadComponent: () => import('./features/administracion/inventario/discounts/categories/discount-category-list').then(m => m.DiscountCategoryListComponent),
                data: { title: 'Categorías de Descuento', description: 'Gestión de categorías de descuento' }
            },
            {
                path: 'inventario/discount-cust-categories',
                loadComponent: () => import('./features/administracion/inventario/discounts/cust-categories/discount-cust-category-list').then(m => m.DiscountCustCategoryListComponent),
                data: { title: 'Categorías de Descuento por Cliente', description: 'Gestión de categorías de descuento por cliente' }
            },
            {
                path: 'inventario/cambio-precios',
                canActivate: [permissionGuard],
                data: { permission: 'inventory.products', title: 'Cambio Masivo de Precios', description: 'Actualizar precios de múltiples productos' },
                loadComponent: () => import('./features/inventario/bulk-price-change/bulk-price-change.component').then(m => m.BulkPriceChangeComponent)
            },
            {
                path: 'inventario/productos-compuestos',
                canActivate: [permissionGuard],
                data: { permission: 'inventory.products', title: 'Productos Compuestos', description: 'Configurar productos compuestos e insumos' },
                loadComponent: () => import('./features/administracion/inventario/compound-products/compound-products.component').then(m => m.CompoundProductsComponent)
            },
            {
                path: 'inventario/consultar-compuestos',
                canActivate: [permissionGuard],
                data: { permission: 'inventory.products', title: 'Consulta de Compuestos', description: 'Ver lista de productos compuestos e insumos' },
                loadComponent: () => import('./features/administracion/inventario/compound-products/compound-products-list/compound-products-list.component').then(m => m.CompoundProductsListComponent)
            },
            {
                path: 'inventario/kits-productos',
                canActivate: [permissionGuard],
                data: { permission: 'inventory.products', title: 'Gestionar Kits (Combos)', description: 'Configurar combos y productos agrupados' },
                loadComponent: () => import('./features/administracion/inventario/product-kits/product-kits.component').then(m => m.ProductKitsComponent)
            },
            {
                path: 'inventario/consultar-kits',
                canActivate: [permissionGuard],
                data: { permission: 'inventory.products', title: 'Consulta de Kits', description: 'Ver lista de combos y componentes' },
                loadComponent: () => import('./features/administracion/inventario/product-kits/product-kits-list/product-kits-list.component').then(m => m.ProductKitsListComponent)
            },
            {
                path: 'inventario',
                redirectTo: 'inventario/productos',
                pathMatch: 'full'
            },
            {
                path: 'admin-ventas',
                loadComponent: () => import('./features/ventas/consultar-ventas/consultar-ventas').then(m => m.ConsultarVentasComponent),
                data: { title: 'Reportes de Ventas', description: 'Estadísticas y reportes' }
            },
            {
                path: 'configuracion',
                loadComponent: () => import('./features/administracion/settings/settings').then(m => m.SettingsComponent),
                data: { title: 'Configuración', description: 'Configuración del sistema' }
            },
            // Sección Sistema
            {
                path: 'change-password',
                loadComponent: () => import('./features/auth/change-password/change-password').then(m => m.ChangePasswordComponent)
            },
            {
                path: 'config-sistema',
                loadComponent: () => import('./features/ventas/consultar-ventas/consultar-ventas').then(m => m.ConsultarVentasComponent),
                data: { title: 'Configuración del Sistema', description: 'Preferencias de usuario' }
            },
            {
                path: 'system/roles',
                canActivate: [permissionGuard],
                loadComponent: () => import('./features/system/roles/roles.component').then(m => m.RolesListComponent),
                data: { title: 'Gestión de Roles', description: 'Administración de roles y permisos', permission: 'system.roles' }
            },
            {
                path: 'system/users',
                canActivate: [permissionGuard],
                loadComponent: () => import('./features/system/users/users.component').then(m => m.UsersListComponent),
                data: { title: 'Gestión de Usuarios', description: 'Administración de usuarios', permission: 'system.users' }
            },
            {
                path: 'impresoras',
                loadComponent: () => import('./features/system/printers/printers-list.component').then(m => m.PrintersListComponent),
                data: { title: 'Impresoras', description: 'Configuración de impresoras' }
            },
            {
                path: '',
                redirectTo: 'inicio',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: '/login'
    }
];
