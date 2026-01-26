import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'phoneFormat',
    standalone: true
})
export class PhoneFormatPipe implements PipeTransform {

    transform(value: string | number | null | undefined): string {
        if (!value) return '';

        // Solo números
        const cleanValue = String(value).replace(/\D/g, '');

        if (!cleanValue) return '';

        if (cleanValue.length <= 4) {
            return cleanValue;
        } else if (cleanValue.length <= 7) {
            return `${cleanValue.substring(0, 4)} - ${cleanValue.substring(4)}`;
        } else {
            // Limitar a 11 dígitos para el formato estándar solicitado
            const truncated = cleanValue.substring(0, 11);
            if (truncated.length <= 7) {
                return `${truncated.substring(0, 4)} - ${truncated.substring(4)}`;
            }
            return `${truncated.substring(0, 4)} - ${truncated.substring(4, 7)}-${truncated.substring(7)}`;
        }
    }

}
