import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sales-numpad',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './sales-numpad.html',
  styleUrl: './sales-numpad.css'
})
export class SalesNumpadComponent {
  value: string = '';
  mode: 'qty' | 'disc_percent' | 'disc_fixed' | 'disc_ves' | 'price' = 'qty';

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Evitar si el foco está en un input (como la tasa)
    const activeElement = document.activeElement;
    if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    if (event.key >= '0' && event.key <= '9') {
      this.onNumber(event.key);
    } else if (event.key === '.') {
      this.onNumber('.');
    } else if (event.key === 'Backspace') {
      this.value = this.value.slice(0, -1);
    } else if (event.key === 'Enter') {
      this.onEnter();
    } else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') {
      this.onClear();
    } else if (event.key === '*') {
      this.setMode('qty');
    } else if (event.key === '/') {
      this.setMode('price');
    } else if (event.key === '%') {
      if (this.mode === 'disc_percent') this.setMode('disc_fixed');
      else if (this.mode === 'disc_fixed') this.setMode('disc_ves');
      else this.setMode('disc_percent');
    }
  }

  @Output() action = new EventEmitter<{ mode: string, value: number }>();

  onNumber(num: string): void {
    if (num === '.' && this.value.includes('.')) return;
    this.value += num;
  }

  onClear(): void {
    this.value = '';
  }

  onBackspace(): void {
    if (this.value && this.value.length > 0) {
      this.value = this.value.slice(0, -1);
    }
  }

  setMode(mode: 'qty' | 'disc_percent' | 'disc_fixed' | 'disc_ves' | 'price'): void {
    const isDiscountMode = (m: string) => m.startsWith('disc_');
    if (isDiscountMode(mode) && isDiscountMode(this.mode)) {
      // Cycle if already in discount mode
      if (this.mode === 'disc_percent') this.mode = 'disc_fixed';
      else if (this.mode === 'disc_fixed') this.mode = 'disc_ves';
      else this.mode = 'disc_percent';
    } else {
      this.mode = mode;
    }
  }

  onEnter(): void {
    if (this.value) {
      this.action.emit({
        mode: this.mode,
        value: parseFloat(this.value)
      });
      this.value = '';
    }
  }
}
