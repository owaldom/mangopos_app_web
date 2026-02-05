import { Directive, ElementRef, HostListener, Input, OnChanges, SimpleChanges, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';

@Directive({
    selector: '[appMoneyInput]',
    standalone: true,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MoneyInputDirective),
            multi: true
        }
    ]
})
export class MoneyInputDirective implements ControlValueAccessor, OnChanges {
    @Input() decimalType: 'price' | 'quantity' | 'total' | 'percent' = 'total';

    private settingsService = inject(SettingsService);
    private _value: number | null = null;
    private onChange: (value: number | null) => void = () => { };
    private onTouched: () => void = () => { };
    private settingsSubscription?: any;

    constructor(private el: ElementRef<HTMLInputElement>) {
        // Suscribirse a cambios en la configuración para re-formatear si cambian los decimales
        this.settingsSubscription = this.settingsService.settings$.subscribe(() => {
            if (this._value !== null) {
                this.formatValue(this._value);
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this._value !== null) {
            this.formatValue(this._value);
        }
    }

    ngOnDestroy(): void {
        if (this.settingsSubscription) {
            this.settingsSubscription.unsubscribe();
        }
    }

    private getDecimals(): number {
        const settings = this.settingsService.getSettings();
        if (!settings) return 2;
        if (this.decimalType === 'price') return settings.price_decimals;
        if (this.decimalType === 'quantity') return settings.quantity_decimals;
        if (this.decimalType === 'percent') return settings.percentage_decimals;
        return settings.total_decimals;
    }

    @HostListener('input', ['$event'])
    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        let value = input.value;

        // Limpiar todo lo que no sea dígito
        let rawValue = value.replace(/[^0-9]/g, '');

        if (!rawValue) {
            this._value = null;
            this.onChange(null);
            return;
        }

        // Evitar ceros a la izquierda innecesarios
        rawValue = BigInt(rawValue).toString();

        const decimals = this.getDecimals();
        const divider = Math.pow(10, decimals);
        const numberValue = parseFloat(rawValue) / divider;

        this._value = numberValue;
        this.formatValue(numberValue); // Formatea visualmente
        this.onChange(numberValue);   // Emite el número real al modelo
    }

    @HostListener('blur')
    onBlur(): void {
        this.onTouched();
    }

    writeValue(value: any): void {
        const numValue = (value === null || value === undefined) ? null : Number(value);
        this._value = numValue;
        this.formatValue(numValue);
    }

    private formatValue(value: number | null): void {
        const input = this.el.nativeElement;
        if (value === null || value === undefined || isNaN(value)) {
            input.value = '';
            return;
        }

        const decimals = this.getDecimals();

        try {
            const formatted = value.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            input.value = formatted;
        } catch (e) {
            input.value = value.toFixed(decimals);
        }
    }

    registerOnChange(fn: (value: number | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.el.nativeElement.disabled = isDisabled;
    }
}
