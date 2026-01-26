import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-ticket-notes-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule
    ],
    template: `
    <h2 mat-dialog-title>
      <mat-icon>note_add</mat-icon>
      Notas al Ticket
    </h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Escriba aquí sus observaciones...</mat-label>
        <textarea matInput [(ngModel)]="notes" rows="6" placeholder="Ej: Entregar en el estacionamiento, Cliente frecuente, etc."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">CANCELAR</button>
      <button mat-raised-button color="primary" (click)="onSave()">GUARDAR NOTA</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .full-width {
      width: 100%;
      margin-top: 10px;
    }
    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    textarea {
      font-size: 16px;
    }
  `]
})
export class TicketNotesDialogComponent {
    notes: string = '';

    constructor(
        public dialogRef: MatDialogRef<TicketNotesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { notes: string }
    ) {
        this.notes = data.notes || '';
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.dialogRef.close(this.notes);
    }
}
