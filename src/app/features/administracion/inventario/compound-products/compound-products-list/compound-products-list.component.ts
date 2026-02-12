import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SharedPaginatorComponent } from '../../../../../shared/components/shared-paginator/shared-paginator.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompoundProductsService } from '../compound-products.service';
import { ProductForCompound, CompoundProductDetail } from '../compound-products.model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-compound-products-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatTableModule,
        MatPaginatorModule,
        SharedPaginatorComponent,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatTooltipModule
    ],
    animations: [
        trigger('detailExpand', [
            state('collapsed,void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
            state('expanded', style({ height: '*', visibility: 'visible' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    templateUrl: './compound-products-list.component.html',
    styleUrls: ['./compound-products-list.component.css']
})
export class CompoundProductsListComponent implements OnInit {
    private compoundService = inject(CompoundProductsService);
    private router = inject(Router);

    dataSource: ProductForCompound[] = [];
    displayedColumns = ['code', 'name', 'expand'];
    expandedElement: ProductForCompound | null = null;
    compoundDetailsMap: { [key: number]: CompoundProductDetail[] } = {};

    totalItems = 0;
    pageSize = 50;
    currentPage = 1;

    ngOnInit() {
        this.loadCompoundProducts();
    }

    loadCompoundProducts() {
        this.compoundService.getProductsForCompounds(this.currentPage, this.pageSize).subscribe(res => {
            this.dataSource = res.data;
            this.totalItems = res.total;
        });
    }

    onPageChange(event: PageEvent) {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadCompoundProducts();
    }

    toggleExpand(element: ProductForCompound, event: MouseEvent) {
        event.stopPropagation();
        this.expandedElement = this.expandedElement === element ? null : element;
        if (this.expandedElement && !this.compoundDetailsMap[element.id]) {
            this.compoundService.getCompoundProducts(element.id).subscribe(details => {
                this.compoundDetailsMap[element.id] = details;
            });
        }
    }

    editCompound(productId: number) {
        this.router.navigate(['/dashboard/inventario/productos-compuestos'], { queryParams: { id: productId } });
    }
}
