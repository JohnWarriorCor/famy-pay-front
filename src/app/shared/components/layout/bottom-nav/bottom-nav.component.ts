import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';

interface BottomNavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, RippleModule],
  template: `
    <nav class="bottom-nav" role="navigation" aria-label="Navegación principal">
      @for (item of items; track item.route) {
        <a
          class="bottom-nav-item"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
          pRipple
          [attr.aria-label]="item.label"
        >
          @if (item.icon === 'fab') {
            <div class="fab-button">
              <i class="pi pi-plus"></i>
            </div>
          } @else {
            <i [class]="item.icon" class="nav-icon"></i>
            <span class="nav-label">{{ item.label }}</span>
          }
        </a>
      }
    </nav>
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
      height: $bottom-nav-height;
      background: var(--surface-color);
      border-top: 1px solid var(--border-color);
      z-index: $z-topbar;
      align-items: center;
      justify-content: space-around;
      padding: 0 $spacing-2;
      padding-bottom: env(safe-area-inset-bottom, 0);

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

      &:hover {
        transform: scale(1.1);
      }

      i {
        font-size: 1.25rem;
      }
    }
  `]
})
export class BottomNavComponent {
  readonly items: BottomNavItem[] = [
    { label: 'Inicio', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Gastos', icon: 'pi pi-wallet', route: '/transactions' },
    { label: '', icon: 'fab', route: '/transactions/new' },
    { label: 'Reportes', icon: 'pi pi-chart-bar', route: '/reports' },
    { label: 'Perfil', icon: 'pi pi-user', route: '/settings' },
  ];
}
