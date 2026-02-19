import { Component, Inject, OnInit, HostListener, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ScaleService, ScaleStatus } from '../../../../../core/services/scale.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-scale-weight-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatButtonModule],
    templateUrl: './scale-weight-dialog.html',
    styleUrl: './scale-weight-dialog.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScaleWeightDialogComponent implements OnInit, OnDestroy {
    weightStr: string = '0';
    productName: string = '';

    scaleStatus: ScaleStatus = { connected: false, isStable: false };
    private subscription = new Subscription();

    constructor(
        public dialogRef: MatDialogRef<ScaleWeightDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { product: any },
        private scaleService: ScaleService,
        private cdr: ChangeDetectorRef
    ) {
        this.productName = data.product.name;
    }

    ngOnInit(): void {
        this.subscription.add(
            this.scaleService.weight$.subscribe((w: number) => {
                if (this.scaleStatus.connected) {
                    this.weightStr = w.toFixed(3);
                    this.cdr.markForCheck();
                }
            })
        );

        this.subscription.add(
            this.scaleService.status$.subscribe((s: ScaleStatus) => {
                this.scaleStatus = s;
                this.cdr.markForCheck();
            })
        );
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    async toggleScaleConnection() {
        if (this.scaleStatus.connected) {
            await this.scaleService.disconnect();
        } else {
            await this.scaleService.connect();
        }
        this.cdr.markForCheck();
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key >= '0' && event.key <= '9') {
            this.addDigit(event.key);
        } else if (event.key === '.' || event.key === ',') {
            this.addDigit('.');
        } else if (event.key === 'Backspace') {
            if (this.weightStr.length > 1) {
                this.weightStr = this.weightStr.slice(0, -1);
            } else {
                this.weightStr = '0';
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            this.onConfirm();
        } else if (event.key === 'Escape') {
            this.onCancel();
        } else if (event.key.toLowerCase() === 'c') {
            this.clear();
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        const weight = parseFloat(this.weightStr);
        if (weight > 0) {
            this.dialogRef.close(weight);
        }
    }

    addDigit(digit: string): void {
        if (digit === '.' && this.weightStr.includes('.')) return;

        if (this.weightStr === '0' && digit !== '.') {
            this.weightStr = digit;
        } else {
            this.weightStr += digit;
        }
        this.cdr.markForCheck();
    }

    clear(): void {
        this.weightStr = '0';
        this.cdr.markForCheck();
    }

    get weight(): number {
        return parseFloat(this.weightStr);
    }
}
