import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimarySidebarComponent } from './primary-sidebar/primary-sidebar.component';
import { SecondarySidebarComponent } from './secondary-sidebar/secondary-sidebar.component';
import { MENU_CATEGORIES, MenuCategory, MenuItem } from '../../config/menu-config';
import { sidebarAnimations } from './sidebar-animations';
import { AuthService } from '../../../core/services/auth';
import { AppConfigService } from '../../../core/services/app-config.service';

@Component({
    selector: 'app-two-level-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        PrimarySidebarComponent,
        SecondarySidebarComponent
    ],
    templateUrl: './two-level-sidebar.component.html',
    styleUrls: ['./two-level-sidebar.component.scss'],
    animations: sidebarAnimations
})
export class TwoLevelSidebarComponent implements OnInit {
    private authService = inject(AuthService);
    private appConfigService = inject(AppConfigService);

    private allCategories = MENU_CATEGORIES;
    filteredCategories: MenuCategory[] = [];
    activeCategory: MenuCategory | null = null;
    isSecondaryOpen = false;

    ngOnInit(): void {
        this.updateCategories();
    }

    private updateCategories(): void {
        this.filteredCategories = this.allCategories
            .map(category => ({
                ...category,
                items: this.filterMenuItems(category.items)
            }))
            .filter(category => category.items.length > 0);

        // Restaurar última categoría seleccionada
        const savedCategoryId = localStorage.getItem('lastActiveCategory');
        if (savedCategoryId) {
            const category = this.filteredCategories.find(c => c.id === savedCategoryId);
            if (category) {
                this.activeCategory = category;
            }
        }
    }

    private filterMenuItems(items: MenuItem[]): MenuItem[] {
        const currentType = this.appConfigService.getInstallationType();

        return items.filter(item => {
            // Filter by permission
            if (item.permission && !this.authService.hasPermission(item.permission)) {
                return false;
            }

            // Filter by installation type
            if (item.installationType && currentType && item.installationType !== currentType) {
                return false;
            }

            if (item.children) {
                const filteredChildren = this.filterMenuItems(item.children);
                return filteredChildren.length > 0;
            }
            return true;
        });
    }

    onCategorySelected(category: MenuCategory): void {


        // Si se hace clic en la misma categoría, toggle el panel
        if (this.activeCategory?.id === category.id) {
            this.isSecondaryOpen = !this.isSecondaryOpen;

        } else {
            // Si es una categoría diferente, cambiar y abrir
            this.activeCategory = category;
            this.isSecondaryOpen = true;


            // Guardar en localStorage
            localStorage.setItem('lastActiveCategory', category.id);
        }
    }

    onSecondaryClose(): void {
        this.isSecondaryOpen = false;
    }

    get activeCategoryId(): string | null {
        return this.activeCategory?.id || null;
    }
}
