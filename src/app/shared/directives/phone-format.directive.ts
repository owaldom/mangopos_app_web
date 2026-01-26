import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
    selector: '[appPhoneFormat]',
    standalone: true,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PhoneFormatDirective),
            multi: true
        }
    ]
})
export class PhoneFormatDirective implements ControlValueAccessor {
    private onChange: (value: any) => void = () => { };
    private onTouched: () => void = () => { };

    constructor(private el: ElementRef<HTMLInputElement>) { }

    @HostListener('input', ['$event'])
    onInput(event: any): void {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, ''); // Solo números

        if (value.length > 11) {
            value = value.substring(0, 11);
        }

        const formatted = this.format(value);
        input.value = formatted;

        // Emitir solo los números al modelo
        this.onChange(value);
    }

    @HostListener('blur')
    onBlur(): void {
        this.onTouched();
    }

    private format(value: string): string {
        if (!value) return '';

        let formatted = '';
        if (value.length <= 4) {
            formatted = value;
        } else if (value.length <= 7) {
            formatted = `${value.substring(0, 4)} - ${value.substring(4)}`;
        } else {
            formatted = `${value.substring(0, 4)} - ${value.substring(4, 7)}-${value.substring(7)}`;
        }
        return formatted;
    }

    writeValue(value: any): void {
        const strValue = value ? String(value).replace(/\D/g, '') : '';
        this.el.nativeElement.value = this.format(strValue);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.el.nativeElement.disabled = isDisabled;
    }
}
