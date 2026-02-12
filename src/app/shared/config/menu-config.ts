export interface MenuItem {
    name: string;
    route?: string;
    icon: string;
    permission?: string;
    installationType?: 'factory' | 'pos';
    children?: MenuItem[];
    badge?: string | number;
    exact?: boolean;
}

export interface MenuCategory {
    id: string;
    name: string;
    icon: string;
    color: string; // Color de acento
    items: MenuItem[];
}

export const MENU_CATEGORIES: MenuCategory[] = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'dashboard',
        color: '#2196f3', // Azul
        items: [
            { name: 'Inicio', route: '/dashboard/inicio', icon: 'home' }
        ]
    },
    {
        id: 'ventas',
        name: 'Ventas',
        icon: 'shopping_cart',
        color: '#4caf50', // Verde
        items: [
            { name: 'Punto de Venta', route: '/dashboard/ventas/pos', icon: 'point_of_sale', permission: 'sales' },
            { name: 'Consultar Ventas', route: '/dashboard/consultar-ventas', icon: 'search', permission: 'sales.history' },
            { name: 'Clientes (CxC)', route: '/dashboard/admin-clientes', icon: 'people', permission: 'admin.cxc' },
            { name: 'Movimientos de Cajas', route: '/dashboard/movimientos-cajas', icon: 'account_balance', permission: 'sales.close_cash' },
            { name: 'Apertura Caja', route: '/dashboard/apertura-caja', icon: 'lock_open', permission: 'sales' },
            { name: 'Cierre de Caja', route: '/dashboard/cierre-caja', icon: 'lock', permission: 'sales.close_cash' }
        ]
    },
    {
        id: 'inventario',
        name: 'Inventario',
        icon: 'inventory',
        color: '#ff9800', // Naranja
        items: [
            {
                name: 'Productos',
                icon: 'shopping_bag',
                children: [
                    { name: 'Gestión de Productos', route: '/dashboard/inventario/productos', icon: 'shopping_bag', permission: 'inventory.products' },
                    { name: 'Categorías', route: '/dashboard/inventario/categorias', icon: 'category', permission: 'inventory.categories' },
                    { name: 'Cambio de Precios', route: '/dashboard/inventario/cambio-precios', icon: 'price_change', permission: 'inventory.bulk_price_change' },
                    { name: 'Bajo Stock', route: '/dashboard/inventario/bajo-stock', icon: 'report_problem' }
                ]
            },
            {
                name: 'Compras y Proveedores',
                icon: 'local_shipping',
                children: [
                    { name: 'Proveedores', route: '/dashboard/admin-proveedores', icon: 'local_shipping', permission: 'admin.cxp' },
                    { name: 'CxP Proveedores', route: '/dashboard/admin-proveedores-cxp', icon: 'request_quote', permission: 'admin.cxp' },
                    { name: 'Factura de Compras', route: '/dashboard/inventario/compras', icon: 'shopping_basket', permission: 'admin.cxp' },
                    { name: 'Gestión de Inventarios', route: '/dashboard/inventario/gestion', icon: 'inventory_2', permission: 'inventory.products' },
                    { name: 'Movimientos de Existencia', route: '/dashboard/inventario/movimientos', icon: 'sync_alt', permission: 'inventory.products' }
                ]
            },
            {
                name: 'Productos Especiales',
                icon: 'auto_awesome',
                children: [
                    { name: 'Despiece de Productos', route: '/dashboard/inventario/despiece', icon: 'call_split', permission: 'inventory.products' },
                    { name: 'Consulta de Compuestos', route: '/dashboard/inventario/consultar-compuestos', icon: 'view_list', permission: 'inventory.compounds' },
                    { name: 'Gestionar Compuestos', route: '/dashboard/inventario/productos-compuestos', icon: 'layers', permission: 'inventory.compounds' },
                    { name: 'Consulta de Kits', route: '/dashboard/inventario/consultar-kits', icon: 'view_list', permission: 'inventory.kits' },
                    { name: 'Gestionar Kits', route: '/dashboard/inventario/kits-productos', icon: 'auto_awesome_motion', permission: 'inventory.kits' }
                ]
            },
            {
                name: 'Distribución',
                icon: 'local_shipping',
                children: [
                    { name: 'Órdenes de Distribución', route: '/dashboard/inventario/distribution-orders', icon: 'assignment', permission: 'inventory.distribution', installationType: 'factory' },
                    { name: 'Recibir Mercancía', route: '/dashboard/inventario/distribution-reception', icon: 'inventory', permission: 'inventory.distribution', installationType: 'pos' }
                ]
            },
            {
                name: 'Configuración',
                icon: 'settings',
                children: [
                    { name: 'Impuestos', route: '/dashboard/inventario/impuestos', icon: 'receipt', permission: 'inventory.taxes' },
                    { name: 'Almacenes', route: '/dashboard/inventario/almacenes', icon: 'warehouse', permission: 'inventory.products' },
                    { name: 'Descuentos', route: '/dashboard/inventario/discounts', icon: 'discount' },
                    { name: 'Cat. Descuento (P)', route: '/dashboard/inventario/discount-categories', icon: 'category' },
                    { name: 'Cat. Descuento (C)', route: '/dashboard/inventario/discount-cust-categories', icon: 'people' }
                ]
            }
        ]
    },
    {
        id: 'administracion',
        name: 'Administración',
        icon: 'admin_panel_settings',
        color: '#9c27b0', // Púrpura
        items: [
            { name: 'Registrar Gastos', route: '/dashboard/admin-gastos', icon: 'monetization_on', permission: 'admin.expenses' },
            { name: 'Habladores de Precio', route: '/dashboard/admin-habladores', icon: 'label', permission: 'admin.habladores' },
            { name: 'Reportes por Módulos', route: '/dashboard/reportes', icon: 'analytics' },
            { name: 'Facturas Divisas (IGTF)', route: '/dashboard/reportes/facturas-divisas', icon: 'currency_exchange' },
            { name: 'Configuración General', route: '/dashboard/configuracion', icon: 'settings' }
        ]
    },
    {
        id: 'bancos',
        name: 'Bancos',
        icon: 'account_balance',
        color: '#00bcd4', // Cyan
        items: [
            { name: 'Resumen', route: '/dashboard/bancos/resumen', icon: 'dashboard', permission: 'banks.view' },
            { name: 'Cuentas Bancarias', route: '/dashboard/bancos', icon: 'account_balance', permission: 'banks.view', exact: true },
            { name: 'Conciliación', route: '/dashboard/bancos/conciliacion', icon: 'fact_check', permission: 'banks.reconcile' },
            {
                name: 'Configuración',
                icon: 'settings',
                children: [
                    { name: 'Entidades Bancarias', route: '/dashboard/bancos/entidades', icon: 'business', permission: 'banks.config' },
                    { name: 'Tipos de Cuenta', route: '/dashboard/bancos/tipos', icon: 'list_alt', permission: 'banks.config' }
                ]
            }
        ]
    },
    {
        id: 'sistema',
        name: 'Sistema',
        icon: 'computer',
        color: '#607d8b', // Gris azulado
        items: [
            { name: 'Usuarios', route: '/dashboard/system/users', icon: 'people', permission: 'system.users' },
            { name: 'Roles', route: '/dashboard/system/roles', icon: 'badge', permission: 'system.roles' },
            { name: 'Configuración del Sistema', route: '/dashboard/config-sistema', icon: 'tune', permission: 'system.config' },
            { name: 'Impresoras', route: '/dashboard/impresoras', icon: 'print', permission: 'system.printers' }
        ]
    }
];
