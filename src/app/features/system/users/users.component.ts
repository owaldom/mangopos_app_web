import { Component, Inject, OnInit, inject, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService, User } from '../../../core/services/user.service';
import { RoleService, Role } from '../../../core/services/role.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  template: `
    <div class="container">
      <mat-card class="main-card">
        <mat-card-header>
          <mat-card-title>Gestión de Usuarios</mat-card-title>
          <div class="header-actions">
            <mat-form-field appearance="outline" class="search-field">
              <mat-icon matPrefix>search</mat-icon>
              <mat-label>Buscar usuario...</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="onSearch()" placeholder="Nombre o Tarjeta">
              <button *ngIf="searchQuery" matSuffix mat-icon-button (click)="clearSearch()">
                <mat-icon>close</mat-icon>
              </button>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="editUser(null)">
              <mat-icon>person_add</mat-icon> Nuevo Usuario
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          <table mat-table [dataSource]="dataSource" class="users-table">
            
            <ng-container matColumnDef="image">
              <th mat-header-cell *matHeaderCellDef> Imagen </th>
              <td mat-cell *matCellDef="let user">
                <img [src]="getImageSrc(user.image)" class="user-avatar" (error)="user.image = null">
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Nombre </th>
              <td mat-cell *matCellDef="let user"> {{user.name}} </td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef> Rol </th>
              <td mat-cell *matCellDef="let user"> {{user.role_name}} </td>
            </ng-container>

            <ng-container matColumnDef="card">
              <th mat-header-cell *matHeaderCellDef> Tarjeta </th>
              <td mat-cell *matCellDef="let user"> {{user.card}} </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> Acciones </th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button color="primary" (click)="editUser(user)" matTooltip="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="accent" (click)="changePassword(user)" matTooltip="Cambiar Contraseña">
                  <mat-icon>key</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteUser(user)" matTooltip="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator [length]="totalRecords"
                         [pageSize]="pageSize"
                         [pageSizeOptions]="[5, 10, 20]"
                         (page)="onPageChange($event)"
                         showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .main-card { padding: 20px; }
    mat-card-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 20px;
    }
    .header-actions { 
      margin-left: auto; 
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .search-field { width: 300px; }
    .search-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .users-table { width: 100%; margin-top: 10px; }
    .user-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
  `]
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<User>([]);
  roles: Role[] = [];
  displayedColumns = ['image', 'name', 'role', 'card', 'actions'];

  // Pagination & Search
  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;
  searchQuery = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  getImageSrc(image: string | undefined): string {
    if (!image) return 'assets/images/default-avatar.png';
    if (typeof image !== 'string') return 'assets/images/default-avatar.png';

    if (image.startsWith('data:image') || image.startsWith('http')) {
      return image;
    }
    return `data:image/png;base64,${image}`;
  }

  loadUsers() {
    this.userService.getUsers(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.totalRecords = res.total;
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.dataSource.data = [];
        this.totalRecords = 0;
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onSearch() {
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.loadUsers();
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearch();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (data) => this.roles = data,
      error: (err) => console.error('Error loading roles', err)
    });
  }

  editUser(user: User | null) {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: { user: user || {}, roles: this.roles, isNew: !user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (user?.id) {
          this.userService.updateUser(user.id, result).subscribe(() => {
            this.snackBar.open('Usuario actualizado', 'Cerrar', { duration: 3000 });
            this.loadUsers();
          });
        } else {
          this.userService.createUser(result).subscribe({
            next: () => {
              this.snackBar.open('Usuario creado', 'Cerrar', { duration: 3000 });
              this.loadUsers();
            },
            error: (err) => {
              this.snackBar.open(err.error?.message || 'Error al crear usuario', 'Cerrar', { duration: 3000 });
            }
          });
        }
      }
    });
  }

  changePassword(user: User) {
    const newPassword = prompt(`Ingrese nueva contraseña para ${user.name}:`);
    if (newPassword) {
      this.userService.changePassword(user.id, newPassword).subscribe({
        next: () => this.snackBar.open('Contraseña actualizada', 'Cerrar', { duration: 3000 }),
        error: (err) => this.snackBar.open('Error al cambiar contraseña', 'Cerrar', { duration: 3000 })
      });
    }
  }

  deleteUser(user: User) {
    if (confirm(`¿Está seguro de eliminar al usuario "${user.name}"?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
          this.loadUsers();
        },
        error: (err) => {
          this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.isNew ? 'Nuevo Usuario' : 'Editar Usuario' }}</h2>
    <mat-dialog-content>
       <div class="avatar-upload">
         <div *ngIf="localData.image || previewImage" class="preview-container">
            <img [src]="previewImage || localData.image" class="avatar-preview">
            <button mat-icon-button color="warn" class="remove-btn" type="button" (click)="removeImage()" matTooltip="Eliminar imagen">
                <mat-icon>delete</mat-icon>
            </button>
         </div>
         <button mat-stroked-button color="primary" type="button" (click)="fileInput.click()">
            <mat-icon>cloud_upload</mat-icon> {{ (localData.image || previewImage) ? 'Cambiar Imagen' : 'Subir Imagen' }}
         </button>
         <input #fileInput type="file" (change)="onFileSelected($event)" style="display: none" accept="image/*">
       </div>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="localData.name" required>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Rol</mat-label>
        <mat-select [(ngModel)]="localData.role" required>
          <mat-option *ngFor="let role of data.roles" [value]="role.id">
            {{ role.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tarjeta (Card Key)</mat-label>
        <input matInput [(ngModel)]="localData.card">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width" *ngIf="data.isNew">
        <mat-label>Contraseña</mat-label>
        <input matInput [(ngModel)]="localData.password" type="password" required>
      </mat-form-field>

    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()"
              [disabled]="!localData.name || !localData.role || (data.isNew && !localData.password)">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 15px; }
    .avatar-upload { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 20px; }
    .preview-container { position: relative; display: inline-block; }
    .avatar-preview { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #ccc; }
    .remove-btn { position: absolute; top: -10px; right: -10px; background: white; border-radius: 50%; }
  `]
})
export class UserDialogComponent {
  localData: any;
  previewImage: string | null = null;
  selectedFile: File | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UserDialogComponent>
  ) {
    this.localData = { ...data.user };

    // Check if image needs prefix
    if (this.localData.image && !this.localData.image.startsWith('data:image') && !this.localData.image.startsWith('http')) {
      // Assume png/jpeg generic if no better info
      this.localData.image = `data:image/png;base64,${this.localData.image}`;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string;
        // IMPORTANT: For backend, we might want to strip the prefix if it only stores raw data.
        // But usually convenient to just send the whole string if the DB is text.
        // Based on CategoryForm, we strip it? 
        // "imageToSend = this.imageBase64.substring(commaIdx + 1);"
        // I will implement similar logic when saving.
        this.localData.image = this.previewImage;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.localData.image = null;
    this.previewImage = null;
    this.selectedFile = null;
  }

  onSave() {
    // Strip base64 header if present, to match Category behavior
    if (this.localData.image && this.localData.image.startsWith('data:image')) {
      const commaIdx = this.localData.image.indexOf(',');
      if (commaIdx > -1) {
        this.localData.image = this.localData.image.substring(commaIdx + 1);
      }
    }
    // We must manually close the dialog since we removed [mat-dialog-close]
    this.dialogRef.close(this.localData);
  }
}
