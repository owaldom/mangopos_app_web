import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SharedPaginatorComponent } from '../../../../../shared/components/shared-paginator/shared-paginator.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductKitService } from '../../../../../core/services/product-kit.service';
import { KitHeader, KitComponent } from '../../../../../core/services/product-kit.model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';

@Component({
    selector: 'app-product-kits-list',
    standalone: true,
    imports: [
        CommonModule,
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
    templateUrl: './product-kits-list.component.html',
    styleUrls: ['./product-kits-list.component.css']
})
export class ProductKitsListComponent implements OnInit {
    private kitService = inject(ProductKitService);
    private router = inject(Router);

    dataSource: KitHeader[] = [];
    displayedColumns = ['code', 'name', 'pricesell', 'expand'];
    expandedElement: KitHeader | null = null;
    kitComponentsMap: { [key: number]: KitComponent[] } = {};

    totalItems = 0;
    pageSize = 50;
    currentPage = 1;

    ngOnInit() {
        this.loadKits();
    }

    loadKits() {
        this.kitService.getKitHeaders(this.currentPage, this.pageSize).subscribe(res => {
            this.dataSource = res.data;
            this.totalItems = res.total;
        });
    }

    onPageChange(event: PageEvent) {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadKits();
    }

    toggleExpand(element: KitHeader, event: MouseEvent) {
        event.stopPropagation();
        this.expandedElement = this.expandedElement === element ? null : element;
        if (this.expandedElement && !this.kitComponentsMap[element.id]) {
            this.kitService.getKitComponents(element.id).subscribe(comps => {
                this.kitComponentsMap[element.id] = comps;
            });
        }
    }

    editKit(kitId: number) {
        // Redirigir a la pantalla de gestión con el ID seleccionado
        // Para simplificar, asumimos que la pantalla de gestión puede recibir un parámetro opcional
        // o simplemente la dejamos como está y el usuario lo selecciona allá.
        // Pero el usuario pidió "ver detalle", la expansión hace eso.
        // Si quiere editar, podemos navegar.
        this.router.navigate(['/dashboard/inventario/kits-productos'], { queryParams: { id: kitId } });
    }
}
