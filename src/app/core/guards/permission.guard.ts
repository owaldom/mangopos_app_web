import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

export const permissionGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    const requiredPermission = route.data?.['permission'];

    if (!requiredPermission) {
        return true; // No permission required
    }

    if (authService.hasPermission(requiredPermission)) {
        return true;
    }

    // Permission denied
    snackBar.open('Acceso denegado: No tiene permisos para este módulo', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
    });

    router.navigate(['/dashboard']);
    return false;
};
