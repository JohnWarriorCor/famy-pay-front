import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../../core/services/firebase/auth.service';

interface BottomNavItem {
  label: string;
  icon: string;
  route: string;
}

interface MenuGridItem {
  label: string;
  icon: string;
  route: string;
  bg: string;
  color: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, RippleModule],
  template: `
    <nav class="bottom-nav" role="navigation" aria-label="Navegación principal">
      @for (item of items; track item.route) {
        @if (item.route === 'menu') {
          <button
            class="bottom-nav-item"
            [class.active]="isMenuOpen()"
            (click)="toggleMenu()"
            pRipple
            [attr.aria-label]="item.label"
          >
            <i [class]="item.icon" class="nav-icon"></i>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        } @else if (item.icon === 'fab') {
          <a
            class="bottom-nav-item-fab"
            [routerLink]="item.route"
            [attr.aria-label]="item.label"
            (click)="closeMenu()"
          >
            <div class="fab-button" pRipple>
              <i class="pi pi-plus"></i>
            </div>
          </a>
        } @else {
          <a
            class="bottom-nav-item"
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            pRipple
            [attr.aria-label]="item.label"
            (click)="closeMenu()"
          >
            <i [class]="item.icon" class="nav-icon"></i>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        }
      }
    </nav>

    <!-- Backdrop con blur (glassmorphism) -->
    <div 
      class="bottom-sheet-backdrop" 
      [class.show]="isMenuOpen()" 
      (click)="closeMenu()"
    ></div>

    <!-- Bottom Sheet deslizante -->
    <div class="bottom-sheet" [class.show]="isMenuOpen()">
      <div class="bottom-sheet-drag-handle"></div>
      
      <div class="bottom-sheet-header">
        <span class="bottom-sheet-title">Explorar FamyPay</span>
        <button class="bottom-sheet-close" (click)="closeMenu()" aria-label="Cerrar menú">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div class="bottom-sheet-content">
        <div class="menu-grid">
          @for (menuItem of menuItems; track menuItem.route) {
            <a
              [routerLink]="menuItem.route"
              class="menu-grid-item"
              (click)="closeMenu()"
              pRipple
            >
              <div class="menu-item-icon" [style.background]="menuItem.bg">
                <i [class]="menuItem.icon" [style.color]="menuItem.color"></i>
              </div>
              <span class="menu-item-label">{{ menuItem.label }}</span>
            </a>
          }
        </div>
        
        <div class="bottom-sheet-divider"></div>

        <div class="bottom-sheet-footer">
          <button class="logout-btn" (click)="logout()" pRipple>
            <i class="pi pi-sign-out"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: calc(#{$bottom-nav-height} + env(safe-area-inset-bottom, 0px));
      background: var(--surface-color);
      border-top: 1px solid var(--border-color);
      z-index: $z-topbar;
      align-items: center;
      justify-content: space-around;
      padding: 0 $spacing-2;
      padding-bottom: env(safe-area-inset-bottom, 0);
      overflow: visible !important;

      @include mobile-only {
        display: flex;
      }
    }

    .bottom-nav-item {
      @include flex-center;
      flex-direction: column;
      gap: 2px;
      padding: $spacing-2 $spacing-3;
      border-radius: $radius-lg;
      color: var(--text-muted);
      text-decoration: none;
      transition: all $transition-fast;
      min-width: 56px;
      position: relative;
      background: none;
      border: none;
      cursor: pointer;

      &:hover {
        color: var(--text-secondary);
      }

      &.active {
        color: var(--primary-color);

        .nav-icon {
          color: var(--primary-color);
        }

        .nav-label {
          font-weight: $font-weight-semibold;
        }

        // Dot indicator
        &::after {
          content: '';
          position: absolute;
          top: 2px;
          width: 4px;
          height: 4px;
          background: var(--primary-color);
          border-radius: $radius-full;
        }
      }
    }

    .bottom-nav-item-fab {
      @include flex-center;
      min-width: 56px;
      height: 100%;
      position: relative;
      overflow: visible !important;
      text-decoration: none;
    }

    .nav-icon {
      font-size: 1.25rem;
    }

    .nav-label {
      font-size: 0.65rem;
      font-weight: $font-weight-medium;
      letter-spacing: 0.02em;
    }

    .fab-button {
      @include flex-center;
      width: 48px;
      height: 48px;
      border-radius: $radius-full;
      @include gradient-primary;
      color: white;
      box-shadow: 0 4px 15px rgba($primary-500, 0.4);
      margin-top: -16px;
      transition: transform $transition-spring;
      overflow: hidden;

      &:hover {
        transform: scale(1.1);
      }

      i {
        font-size: 1.25rem;
      }
    }

    // --- Bottom Sheet ---
    .bottom-sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: $z-topbar - 10;
      opacity: 0;
      pointer-events: none;
      transition: opacity 300ms ease;

      &.show {
        opacity: 1;
        pointer-events: auto;
      }
    }

    .bottom-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--surface-color);
      border-top: 1px solid var(--border-color);
      border-radius: $radius-2xl $radius-2xl 0 0;
      z-index: $z-topbar - 5;
      transform: translateY(100%);
      transition: transform 350ms cubic-bezier(0.32, 0.94, 0.6, 1);
      padding: $spacing-4 $spacing-5;
      padding-bottom: calc(#{$bottom-nav-height} + env(safe-area-inset-bottom, 0px) + #{$spacing-4});
      box-shadow: var(--shadow-xl);

      &.show {
        transform: translateY(0);
      }
    }

    .bottom-sheet-drag-handle {
      width: 36px;
      height: 4px;
      background: var(--border-color);
      border-radius: $radius-full;
      margin: 0 auto $spacing-4;
    }

    .bottom-sheet-header {
      @include flex-between;
      margin-bottom: $spacing-5;
    }

    .bottom-sheet-title {
      font-size: $font-size-base;
      font-weight: $font-weight-bold;
      color: var(--text-primary);
    }

    .bottom-sheet-close {
      @include flex-center;
      width: 32px;
      height: 32px;
      border-radius: $radius-full;
      background: var(--surface-alt);
      color: var(--text-secondary);
      border: none;
      cursor: pointer;
      transition: background $transition-fast;

      &:hover {
        background: var(--border-color);
      }

      i {
        font-size: 0.85rem;
      }
    }

    .bottom-sheet-content {
      display: flex;
      flex-direction: column;
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-4;
      margin-bottom: $spacing-5;
    }

    .menu-grid-item {
      @include flex-center;
      @include flex-column;
      gap: $spacing-2;
      padding: $spacing-3;
      border-radius: $radius-xl;
      text-decoration: none;
      color: var(--text-primary);
      transition: background $transition-fast;
      cursor: pointer;

      &:hover {
        background: var(--surface-alt);
      }
    }

    .menu-item-icon {
      @include flex-center;
      width: 52px;
      height: 52px;
      border-radius: $radius-xl;
      transition: transform $transition-fast;

      i {
        font-size: 1.35rem;
      }

      .menu-grid-item:hover & {
        transform: scale(1.08);
      }
    }

    .menu-item-label {
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      color: var(--text-secondary);
      text-align: center;
    }

    .bottom-sheet-divider {
      height: 1px;
      background: var(--divider-color);
      margin-bottom: $spacing-4;
    }

    .bottom-sheet-footer {
      display: flex;
      justify-content: center;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-2;
      padding: $spacing-3 $spacing-6;
      border-radius: $radius-lg;
      color: var(--danger-color);
      background: rgba(239, 68, 68, 0.08);
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      width: 100%;
      border: 1px solid rgba(239, 68, 68, 0.15);
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        background: rgba(239, 68, 68, 0.15);
        transform: translateY(-1px);
      }

      i {
        font-size: 1rem;
      }
    }
  `]
})
export class BottomNavComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly isMenuOpen = signal(false);

  readonly items: BottomNavItem[] = [
    { label: 'Inicio', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Gastos', icon: 'pi pi-wallet', route: '/transactions' },
    { label: '', icon: 'fab', route: '/transactions/new' },
    { label: 'Reportes', icon: 'pi pi-file-pdf', route: '/reports' },
    { label: 'Más', icon: 'pi pi-bars', route: 'menu' },
  ];

  readonly menuItems: MenuGridItem[] = [
    { label: 'Presupuestos', icon: 'pi pi-chart-bar', route: '/budgets', bg: 'rgba(99, 102, 241, 0.15)', color: 'var(--secondary-color)' },
    { label: 'Scanner OCR', icon: 'pi pi-camera', route: '/ocr', bg: 'rgba(59, 130, 246, 0.15)', color: 'var(--info-color)' },
    { label: 'Logros', icon: 'pi pi-trophy', route: '/gamification', bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-color)' },
    { label: 'Familia', icon: 'pi pi-users', route: '/family', bg: 'rgba(34, 197, 94, 0.15)', color: 'var(--success-color)' },
    { label: 'Perfil', icon: 'pi pi-user', route: '/settings', bg: 'rgba(20, 184, 166, 0.15)', color: 'var(--primary-color)' },
  ];

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
