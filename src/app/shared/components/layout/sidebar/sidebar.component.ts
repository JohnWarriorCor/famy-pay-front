import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/firebase/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, RippleModule, TooltipModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo" (click)="collapsed.set(!collapsed())">
          <span class="logo-icon">💰</span>
          @if (!collapsed()) {
            <span class="logo-text">FamyPay</span>
          }
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        @for (item of navItems; track item.route) {
          <a
            class="nav-item"
            [routerLink]="item.route"
            routerLinkActive="active"
            [pTooltip]="collapsed() ? item.label : ''"
            tooltipPosition="right"
            pRipple
          >
            <i [class]="item.icon" class="nav-icon"></i>
            @if (!collapsed()) {
              <span class="nav-label">{{ item.label }}</span>
            }
            @if (item.badge && !collapsed()) {
              <span class="nav-badge">{{ item.badge }}</span>
            }
          </a>
        }
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button
          class="nav-item"
          (click)="toggleCollapse()"
          pRipple
          [pTooltip]="collapsed() ? 'Expandir' : ''"
          tooltipPosition="right"
        >
          <i class="pi" [class.pi-angle-double-right]="collapsed()" [class.pi-angle-double-left]="!collapsed()"></i>
          @if (!collapsed()) {
            <span class="nav-label">Colapsar</span>
          }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: $sidebar-width;
      background: var(--surface-color);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      z-index: $z-sidebar;
      transition: width $transition-base;
      overflow: hidden;

      &.collapsed {
        width: $sidebar-collapsed-width;
      }

      @include mobile-only {
        display: none;
      }
    }

    .sidebar-header {
      padding: $spacing-5 $spacing-4;
      border-bottom: 1px solid var(--divider-color);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      cursor: pointer;
      padding: $spacing-2;
      border-radius: $radius-md;
      transition: background $transition-fast;

      &:hover {
        background: var(--surface-alt);
      }
    }

    .logo-icon {
      font-size: 1.75rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .logo-text {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      background: linear-gradient(135deg, $primary-500, $secondary-500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      white-space: nowrap;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: $spacing-3 $spacing-2;
      display: flex;
      flex-direction: column;
      gap: $spacing-1;
      @include scrollbar-thin;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-3 $spacing-4;
      border-radius: $radius-md;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all $transition-fast;
      cursor: pointer;
      white-space: nowrap;
      border: none;
      background: none;
      width: 100%;
      font-size: $font-size-sm;
      font-family: inherit;

      &:hover {
        background: var(--surface-alt);
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary-bg);
        color: var(--primary-color);
        font-weight: $font-weight-medium;

        .nav-icon {
          color: var(--primary-color);
        }
      }

      @include focus-ring;
    }

    .nav-icon {
      font-size: 1.15rem;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-label {
      flex: 1;
    }

    .nav-badge {
      @include badge($danger-500);
      min-width: 20px;
      height: 20px;
    }

    .sidebar-footer {
      padding: $spacing-3 $spacing-2;
      border-top: 1px solid var(--divider-color);
    }
  `]
})
export class SidebarComponent {
  readonly collapsed = signal(false);

  private themeService = inject(ThemeService);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Transacciones', icon: 'pi pi-wallet', route: '/transactions' },
    { label: 'Presupuestos', icon: 'pi pi-chart-bar', route: '/budgets' },
    { label: 'Scanner OCR', icon: 'pi pi-camera', route: '/ocr' },
    { label: 'Reportes', icon: 'pi pi-file-pdf', route: '/reports' },
    { label: 'Logros', icon: 'pi pi-trophy', route: '/gamification' },
    { label: 'Familia', icon: 'pi pi-users', route: '/family' },
    { label: 'Configuración', icon: 'pi pi-cog', route: '/settings' },
  ];

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }
}
