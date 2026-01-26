import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MoneyInputDirective } from '../../../../shared/directives/money-input.directive';
import { PhoneFormatDirective } from '../../../../shared/directives/phone-format.directive';
import { SupplierService, Supplier } from '../../../../core/services/supplier.service';

@Component({
    selector: 'app-supplier-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatCheckboxModule,
        MatTabsModule,
        MoneyInputDirective,
        PhoneFormatDirective
    ],
    templateUrl: './supplier-dialog.component.html',
    styleUrls: ['./supplier-dialog.component.css']
})
export class SupplierDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private supplierService = inject(SupplierService);
    public dialogRef = inject(MatDialogRef<SupplierDialogComponent>);

    public data = inject<any>(MAT_DIALOG_DATA);

    form: FormGroup;
    isEdit = false;
    loading = false;

    constructor() {
        this.form = this.fb.group({
            cif: ['', Validators.required],
            name: ['', Validators.required],
            address: [''],
            contactcomm: [''],
            contactfact: [''],
            payrule: ['Contado'], // Default
            faxnumber: [''],
            phonecomm: [''], // Was phone
            phonefact: [''],
            email: ['', [Validators.email]],
            webpage: [''],
            notes: [''],
            creditdays: [0],
            creditlimit: [0], // Was curdebt, now Credit Limit
            persontype: ['Persona Jurídica domiciliada'],
            typesupplier: ['Nacional'],
            balance: [{ value: 0, disabled: true }],
            total_paid: [{ value: 0, disabled: true }],
            visible: [true]
        });
    }

    ngOnInit(): void {
        // Data is now { supplier: Supplier, viewOnly?: boolean } or just Supplier if legacy method used
        // But to support standardized "viewOnly" pattern, we should expect an object or handle both.
        // Given previous edits, we were passing 'supplier' directly or null.
        // Let's adjust to handle a potential wrapper object OR direct supplier object to be safe,
        // OR simply check if 'data' has a 'viewOnly' property if we change how we open it.

        // Wait, 'data' type is typed as 'Supplier' in the line 'public data = inject<Supplier>(MAT_DIALOG_DATA);'
        // I need to change the type of 'data' to allow { supplier: Supplier, viewOnly: boolean }

        const data: any = this.data; // Cast to any to handle flexibility

        if (data) {
            // Check if data is directly a Supplier (has id) or a wrapper
            const supplier = data.id ? data : data.supplier;
            const viewOnly = data.viewOnly || false;

            if (supplier) {
                this.isEdit = true;
                this.form.patchValue(supplier);
            }

            if (viewOnly) {
                this.form.disable();
                this.isEdit = false; // logic for title might need adjustment
            }
        }
    }

    save() {
        if (this.form.invalid) return;

        this.loading = true;
        const body = this.form.value;
        body.creditlimit = Number(body.creditlimit); // Ensure numeric
        body.creditdays = Number(body.creditdays);

        if (this.isEdit && this.data) {
            this.supplierService.update(this.data.id, body).subscribe({
                next: (res) => {
                    this.loading = false;
                    this.dialogRef.close(res);
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                }
            });
        } else {
            this.supplierService.create(body).subscribe({
                next: (res) => {
                    this.loading = false;
                    this.dialogRef.close(res);
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                }
            });
        }
    }

    cancel() {
        this.dialogRef.close();
    }
}
