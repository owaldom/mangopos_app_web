import { Pipe, PipeTransform, inject, Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
@Pipe({
    name: 'systemDate',
    standalone: true
})
export class SystemDatePipe implements PipeTransform {
    private datePipe = new DatePipe('en-US');

    transform(value: any, format: string = 'dd/MM/yyyy hh:mm a'): any {
        if (!value) return '';

        // Ensure UTC safety if it looks like a date string without offset
        let dateVal = value;
        if (typeof value === 'string' && !value.includes('Z') && !value.includes('+')) {
            dateVal = value + 'Z';
        }

        return this.datePipe.transform(dateVal, format);
    }
}
