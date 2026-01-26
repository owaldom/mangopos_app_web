import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SalesService, TicketLine } from '../../../../../core/services/sales.service';
import { SettingsService } from '../../../../../core/services/settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ticket-lines',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './ticket-lines.html',
  styleUrl: './ticket-lines.css'
})
export class TicketLinesComponent implements OnInit, OnDestroy {
  lines: TicketLine[] = [];
  ticketNumber: number = 0;
  exchangeRate: number = 1;
  selectedIndex: number = -1;
  private subscription: Subscription = new Subscription();

  constructor(
    public salesService: SalesService,
    public settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this.salesService.currentLines$.subscribe(lines => {
        this.lines = lines;
      })
    );
    this.subscription.add(
      this.salesService.exchangeRate$.subscribe(rate => {
        this.exchangeRate = rate;
      })
    );
    this.subscription.add(
      this.salesService.selectedLineIndex$.subscribe(idx => {
        this.selectedIndex = idx;
      })
    );
    // TODO: Obtener número de ticket real del backend a través del servicio
    this.ticketNumber = 1;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  updateQuantity(index: number, delta: number, event?: MouseEvent): void {
    let step = 1;
    if (event && event.shiftKey) {
      step = 0.1;
    }
    const change = delta * step;
    const newQty = this.lines[index].units + change;
    this.salesService.updateLineQuantity(index, parseFloat(newQty.toFixed(3)));
  }

  selectLine(index: number): void {
    this.salesService.setSelectedLineIndex(index);
  }

  removeLine(index: number): void {
    this.salesService.removeLine(index);
  }

  clearTicket(): void {
    if (confirm('¿Está seguro de querer limpiar todo el ticket?')) {
      this.salesService.clearTicket();
    }
  }
}
