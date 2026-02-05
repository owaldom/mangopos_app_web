import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRippleModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MenuCategory, MenuItem } from '../../../config/menu-config';
import { AuthService } from '../../../../core/services/auth';
import { sidebarAnimations } from '../sidebar-animations';

@Component({
    selector: 'app-secondary-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatListModule,
        MatExpansionModule,
        MatRippleModule
    ],
    templateUrl: './secondary-sidebar.component.html',
    styleUrls: ['./secondary-sidebar.component.scss'],
    animations: sidebarAnimations
})
export class SecondarySidebarComponent implements OnChanges {
    private router = inject(Router);
    private authService = inject(AuthService);

    @Input() category: MenuCategory | null = null;
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    searchQuery = '';

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen']) {

        }
        if (changes['category']) {

        }
    }

    get filteredItems(): MenuItem[] {
        if (!this.category) return [];

        // Los items ya vienen filtrados por permisos desde el padre
        let items = this.category.items;

        if (this.searchQuery.trim()) {
            items = this.searchItems(items, this.searchQuery.toLowerCase());
        }

        return items;
    }

    private searchItems(items: MenuItem[], query: string): MenuItem[] {
        const results: MenuItem[] = [];

        for (const item of items) {
            if (item.name.toLowerCase().includes(query)) {
                results.push(item);
            } else if (item.children) {
                const childResults = this.searchItems(item.children, query);
                if (childResults.length > 0) {
                    results.push({
                        ...item,
                        children: childResults
                    });
                }
            }
        }

        return results;
    }

    navigate(item: MenuItem): void {
        if (item.route) {
            this.router.navigate([item.route]);
            this.close.emit();
        }
    }

    onBackdropClick(): void {
        this.close.emit();
    }

    hasChildren(item: MenuItem): boolean {
        return !!item.children && item.children.length > 0;
    }

    clearSearch(): void {
        this.searchQuery = '';
    }
}
