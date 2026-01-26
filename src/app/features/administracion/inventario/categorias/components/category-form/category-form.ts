import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Category } from '../../../../../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.category ? 'Editar' : 'Nueva' }} Categoría</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-container">
          <!-- Nombre -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" placeholder="Ej. Bebidas">
            <mat-error *ngIf="form.get('name')?.hasError('required')">
              El nombre es requerido
            </mat-error>
          </mat-form-field>

          <!-- Categoría Padre -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Categoría Padre</mat-label>
            <mat-select formControlName="parentid">
              <mat-option [value]="null">-- Ninguna (Raíz) --</mat-option>
              <mat-option *ngFor="let cat of parentCategories" [value]="cat.id">
                {{ cat.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Visibilidad -->
          <div class="visibility-section">
            <mat-checkbox formControlName="visible_in_pos">Visible en Carrito de Ventas (POS)</mat-checkbox>
          </div>

          <!-- Imagen (Placeholder por ahora) -->
            <div class="image-upload">
            <p>Imagen de categoría (Opcional)</p>
            <div *ngIf="imageBase64" class="preview-container">
                <img [src]="imageBase64" alt="Preview" style="max-height: 100px; max-width: 100%; border-radius: 4px;">
                <button mat-icon-button color="warn" type="button" (click)="imageBase64 = null; selectedFileName = null;">
                    <mat-icon>delete</mat-icon>
                </button>
            </div>
            <button type="button" mat-stroked-button (click)="fileInput.click()">
              <mat-icon>cloud_upload</mat-icon> Seleccionar Imagen
            </button>
            <input #fileInput type="file" (change)="onFileSelected($event)" style="display: none" accept="image/*">
            <span *ngIf="selectedFileName">{{ selectedFileName }}</span>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 350px;
    }
    .full-width {
      width: 100%;
    }
    .image-upload {
      border: 1px dashed #ccc;
      padding: 16px;
      text-align: center;
      border-radius: 4px;
    }
  `]
})
export class CategoryFormComponent implements OnInit {
  form: FormGroup;
  parentCategories: Category[] = [];
  selectedFileName: string | null = null;
  imageBase64: string | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CategoryFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { category?: Category, categories: Category[] }
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      parentid: [null],
      image: [null],
      visible_in_pos: [true]
    });
  }

  ngOnInit(): void {
    // Filtrar categorías para selects (no mostrarse a sí misma como padre)
    if (this.data.category) {
      this.parentCategories = this.data.categories.filter(c => c.id !== this.data.category!.id);
      this.form.patchValue(this.data.category);
      if (this.data.category.image) {
        // Asumimos que viene raw base64 del backend, agregamos prefijo para mostrar preview
        // TODO: Idealmente guardar mime type, pero asumimos png/jpg genérico
        this.imageBase64 = `data:image/png;base64,${this.data.category.image}`;
        this.selectedFileName = 'Imagen actual';
      }
    } else {
      this.parentCategories = this.data.categories;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        const fullBase64 = reader.result as string;
        this.imageBase64 = fullBase64; // Guardar completo para preview
        // El backend espera solo la parte raw del base64 para convertir a buffer
        // data:image/jpeg;base64,/9j/4AAQSk... -> /9j/4AAQSk...
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      // Preparar imagen si existe
      let imageToSend = null;
      if (this.imageBase64) {
        // Si comienza con data:, es una imagen nueva o cargada. 
        // Si ya venia del backend (solo raw base64), no tendrá data: (a menos que nosotros lo agreguemos al cargar)
        // Al cargar inicial (ngOnInit), debemos decidir si agregamos el prefijo para preview.

        const commaIdx = this.imageBase64.indexOf(',');
        if (commaIdx > -1) {
          imageToSend = this.imageBase64.substring(commaIdx + 1);
        } else {
          imageToSend = this.imageBase64; // Ya es raw
        }
      } else {
        imageToSend = null; // O mantener el anterior si no se tocó? 
        // En este form, si imageBase64 es null, significa que no hay imagen o se borró.
        // Si queremos borrarla, enviamos null.
      }

      this.dialogRef.close({
        ...formValue,
        image: imageToSend
      });
    }
  }
}
