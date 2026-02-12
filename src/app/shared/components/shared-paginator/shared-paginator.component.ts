import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-shared-paginator',
  standalone: true,
  imports: [MatPaginatorModule],
  template: `
    <mat-paginator
      [length]="length"
      [pageSize]="pageSize"
      [pageIndex]="pageIndex"
      [pageSizeOptions]="pageSizeOptions"
      (page)="onPageChange($event)"
      showFirstLastButtons
      aria-label="Seleccionar página">
    </mat-paginator>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class SharedPaginatorComponent {
  @Input() length = 0;
  @Input() pageSize = 50;
  @Input() pageIndex = 0;
  @Output() page = new EventEmitter<PageEvent>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly pageSizeOptions = [50, 100, 150, 200];

  onPageChange(event: PageEvent) {
    this.page.emit(event);
  }
}
