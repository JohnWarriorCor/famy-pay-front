import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/firebase/auth.service';
import { FirestoreService } from '../../../../core/services/firebase/firestore.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, MenuModule, BadgeModule, RippleModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <!-- Mobile menu button -->
        <button class="mobile-logo" pRipple>
          <span class="logo-emoji">💰</span>
          <span class="logo-name">FamyPay</span>
        </button>
      </div>

      <div class="topbar-right">
        <!-- Offline indicator -->
        @if (firestoreService.isOffline()) {
          <div class="offline-badge animate-fade-in">
            <i class="pi pi-wifi-off"></i>
            <span>Offline</span>
          </div>
        }

        <!-- Theme toggle -->
        <button
          class="theme-toggle"
          (click)="themeService.toggle()"
          [attr.aria-label]="themeService.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          pRipple
        >
          <i class="pi" [class.pi-sun]="themeService.isDark()" [class.pi-moon]="!themeService.isDark()"></i>
        </button>

        <!-- User avatar -->
        @if (authService.currentUser(); as user) {
          <button class="user-button" (click)="userMenu.toggle($event)" pRipple>
            @if (user.photoURL) {
              <p-avatar [image]="user.photoURL" shape="circle" size="normal" />
            } @else {
              <p-avatar
                [label]="(user.displayName || user.email || '?').charAt(0).toUpperCase()"
                shape="circle"
                size="normal"
                styleClass="user-avatar"
              />
            }
          </button>
          <p-menu #userMenu [model]="userMenuItems" [popup]="true" appendTo="body" />
        }
      </div>
    </header>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .topbar {
      position: fixed;
      top: 0;
      right: 0;
      left: $sidebar-width;
      height: $topbar-height;
      background: var(--surface-color);
      border-bottom: 1px solid var(--border-color);
      @include flex-between;
      padding: 0 $spacing-6;
      z-index: $z-topbar;
      transition: left $transition-base;

      @include mobile-only {
        left: 0;
      }
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: $spacing-3;
    }

    .mobile-logo {
      display: none;
      align-items: center;
      gap: $spacing-2;
      background: none;
      border: none;
      cursor: pointer;
      padding: $spacing-2;
      border-radius: $radius-md;

      @include mobile-only {
        display: flex;
      }

      .logo-emoji {
        font-size: 1.5rem;
      }

      .logo-name {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        background: linear-gradient(135deg, $primary-500, $secondary-500);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: $spacing-3;
    }

    .offline-badge {
      display: flex;
      align-items: center;
      gap: $spacing-1;
      padding: $spacing-1 $spacing-3;
      background: var(--warning-bg);
      color: var(--warning-color);
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;

      i {
        font-size: 0.85rem;
      }
    }

    .theme-toggle {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-full;
      background: var(--surface-alt);
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all $transition-fast;

      &:hover {
        background: var(--primary-bg);
        color: var(--primary-color);
      }

      i {
        font-size: 1.1rem;
      }
    }

    .user-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      border-radius: $radius-full;
      transition: transform $transition-fast;

      &:hover {
        transform: scale(1.05);
      }
    }

    :host ::ng-deep .user-avatar {
      background: linear-gradient(135deg, $primary-500, $secondary-500) !important;
      color: white !important;
      font-weight: $font-weight-semibold !important;
    }
  `]
})
export class TopbarComponent {
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  readonly firestoreService = inject(FirestoreService);
  private router = inject(Router);

  readonly userMenuItems: MenuItem[] = [
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      command: () => this.router.navigate(['/settings']),
    },
    {
      label: 'Familia',
      icon: 'pi pi-users',
      command: () => this.router.navigate(['/family']),
    },
    { separator: true },
    {
      label: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      command: async () => {
        await this.authService.logout();
        this.router.navigate(['/auth/login']);
      },
    },
  ];
}
