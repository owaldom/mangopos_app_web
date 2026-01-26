import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth';

@Directive({
    selector: '[appHasPermission]',
    standalone: true
})
export class HasPermissionDirective {
    private authService = inject(AuthService);
    private templateRef = inject(TemplateRef<any>);
    private viewContainer = inject(ViewContainerRef);

    private hasView = false;

    @Input() set appHasPermission(permission: string) {
        if (this.authService.hasPermission(permission) && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        } else if (!this.authService.hasPermission(permission) && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }
}
