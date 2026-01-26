import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { DecimalPipe } from '@angular/common';

@Directive({
    selector: '[appDecimalInput]',
    standalone: true,
    providers: [DecimalPipe]
})
export class DecimalInputDirective {
    @Input('appDecimalInput') decimalType: 'price' | 'quantity' | 'total' = 'quantity';

    private el = inject(ElementRef);
    // Make NgControl optional to support inputs without form control (like exchange rate input)
    private ngControl = inject(NgControl, { optional: true });
    private settingsService = inject(SettingsService);
    private decimalPipe = inject(DecimalPipe);

    @HostListener('blur')
    onBlur() {
        let value: any;

        // Get value from control or element
        if (this.ngControl) {
            value = this.ngControl.value;
        } else {
            value = this.el.nativeElement.value;
        }

        if (value === null || value === undefined || value === '') return;

        // Limpiar caracteres no numéricos excepto punto y coma
        const cleanValue = parseFloat(value.toString().replace(/,/g, ''));

        if (isNaN(cleanValue)) return;

        const format = this.settingsService.getDecimalFormat(this.decimalType);

        // Formatear usando DecimalPipe
        const formatted = this.decimalPipe.transform(cleanValue, format);

        if (formatted) {
            // Actualizar vista y modelo
            if (this.ngControl && this.ngControl.control) {
                this.ngControl.control.setValue(cleanValue, { emitEvent: false }); // Mantener número en modelo
            }
            // Siempre actualizar la vista
            this.el.nativeElement.value = formatted;
        }
    }

    // Mejor enfoque para input type="number": Ajustar el step y value al hacer blur
    @HostListener('change')
    onChange() {
        if (this.el.nativeElement.type === 'number') {
            const val = parseFloat(this.el.nativeElement.value);
            if (!isNaN(val)) {
                const settings = this.settingsService.getSettings();
                let decimals = 2;
                if (this.decimalType === 'price') decimals = settings?.price_decimals || 2;
                else if (this.decimalType === 'quantity') decimals = settings?.quantity_decimals || 3;
                else if (this.decimalType === 'total') decimals = settings?.total_decimals || 2;

                this.el.nativeElement.value = val.toFixed(decimals);
            }
        }
    }
}
