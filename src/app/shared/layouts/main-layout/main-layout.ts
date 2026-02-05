import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { TwoLevelSidebarComponent } from '../../components/two-level-sidebar/two-level-sidebar.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme.service';
import { interval, Subscription } from 'rxjs';
import { SystemDatePipe } from '../../../shared/pipes/system-date.pipe';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TwoLevelSidebarComponent,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    SystemDatePipe
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);

  title = 'Sun Market 2020 C.A.';

  currentUser$ = this.authService.currentUser$;
  today = new Date();
  private clockSubscription?: Subscription;

  ngOnInit(): void {
    this.clockSubscription = interval(1000).subscribe(() => {
      this.today = new Date();
    });
  }

  ngOnDestroy(): void {
    if (this.clockSubscription) {
      this.clockSubscription.unsubscribe();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  goToChangePassword(): void {
    this.router.navigate(['/dashboard/change-password']);
  }

  getImageSrc(image: string | undefined): string | null {
    if (!image) return null;
    if (image.startsWith('data:image') || image.startsWith('http')) {
      return image;
    }
    return `data:image/png;base64,${image}`;
  }
}
