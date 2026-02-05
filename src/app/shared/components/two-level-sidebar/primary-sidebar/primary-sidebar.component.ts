import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MenuCategory } from '../../../config/menu-config';

@Component({
    selector: 'app-primary-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        MatTooltipModule,
        MatIconModule,
        MatRippleModule
    ],
    templateUrl: './primary-sidebar.component.html',
    styleUrls: ['./primary-sidebar.component.scss']
})
export class PrimarySidebarComponent implements OnInit {
    @Input() categories: MenuCategory[] = [];
    @Input() activeCategory: string | null = null;
    @Output() categorySelected = new EventEmitter<MenuCategory>();

    ngOnInit(): void {
    }


    onCategoryClick(category: MenuCategory): void {
        this.categorySelected.emit(category);
    }

    isActive(categoryId: string): boolean {
        return this.activeCategory === categoryId;
    }
}
