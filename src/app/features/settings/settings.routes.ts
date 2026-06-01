import { Routes } from '@angular/router';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/firebase/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IndexedDbService } from '../../core/services/storage/indexeddb.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, AvatarModule, SelectModule,
    ToggleSwitchModule, DividerModule, CardModule, RippleModule,
  ],
  template: `
    <div class="settings-page animate-fade-in">
      <div class="page-header">
        <h1 class="page-title">Configuración ⚙️</h1>
        <p class="page-subtitle">Personaliza tu experiencia</p>
      </div>

      <!-- Profile Section -->
      <div class="settings-section">
        <h3 class="section-title">Perfil</h3>
        <div class="profile-card">
          <div class="profile-header">
            @if (user()?.photoURL) {
              <img [src]="user()!.photoURL!" class="profile-photo" alt="Avatar" />
            } @else {
              <p-avatar
                [label]="(user()?.displayName || user()?.email || '?').charAt(0).toUpperCase()"
                shape="circle"
                size="xlarge"
                styleClass="profile-avatar"
              />
            }
            <div class="profile-info">
              <span class="profile-name">{{ user()?.displayName || 'Sin nombre' }}</span>
              <span class="profile-email">{{ user()?.email }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Appearance -->
      <div class="settings-section">
        <h3 class="section-title">Apariencia</h3>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi" [class.pi-moon]="darkMode" [class.pi-sun]="!darkMode"></i>
            <div>
              <span class="setting-label">Modo Oscuro</span>
              <span class="setting-desc">Reduce el brillo y cuida tus ojos</span>
            </div>
          </div>
          <p-toggleSwitch inputId="darkModeSwitch" [(ngModel)]="darkMode" (ngModelChange)="onDarkModeChange($event)" />
        </div>
      </div>

      <!-- Notifications -->
      <div class="settings-section">
        <h3 class="section-title">Notificaciones</h3>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-bell"></i>
            <div>
              <span class="setting-label">Alertas de Presupuesto</span>
              <span class="setting-desc">Recibe alertas al llegar al 70%, 80% y 100%</span>
            </div>
          </div>
          <p-toggleSwitch inputId="budgetAlertsSwitch" [(ngModel)]="budgetAlerts" />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-trophy"></i>
            <div>
              <span class="setting-label">Logros</span>
              <span class="setting-desc">Notificaciones de logros desbloqueados</span>
            </div>
          </div>
          <p-toggleSwitch inputId="achievementNotifsSwitch" [(ngModel)]="achievementNotifs" />
        </div>
      </div>

      <!-- Storage -->
      <div class="settings-section">
        <h3 class="section-title">Almacenamiento</h3>
        <div class="setting-item">
          <div class="setting-info">
            <i class="pi pi-database"></i>
            <div>
              <span class="setting-label">Imágenes de Recibos</span>
              <span class="setting-desc">{{ storageUsed() }}</span>
            </div>
          </div>
          <button pButton label="Limpiar" icon="pi pi-trash" severity="danger" [text]="true" [outlined]="true" size="small" (click)="clearStorage()"></button>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section">
        <h3 class="section-title">Acerca de</h3>
        <div class="about-info">
          <div class="about-row">
            <span class="about-label">Versión</span>
            <span class="about-value">1.0.0</span>
          </div>
          <div class="about-row">
            <span class="about-label">Framework</span>
            <span class="about-value">Angular 21</span>
          </div>
          <div class="about-row">
            <span class="about-label">Licencia</span>
            <span class="about-value">MIT</span>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="settings-section danger-zone">
        <h3 class="section-title">Zona de Peligro</h3>
        <button pButton label="Cerrar Sesión" icon="pi pi-sign-out" severity="danger" [outlined]="true" class="w-full" (click)="onLogout()"></button>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .settings-page { @include flex-column; gap: $spacing-6; max-width: 600px; margin: 0 auto; }

    .settings-section {
      @include flex-column;
      gap: $spacing-3;
    }

    .section-title {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: var(--text-primary);
      padding-bottom: $spacing-2;
      border-bottom: 1px solid var(--divider-color);
    }

    .profile-card { @include card($spacing-5); }

    .profile-header {
      display: flex;
      align-items: center;
      gap: $spacing-4;
    }

    .profile-photo {
      width: 64px;
      height: 64px;
      border-radius: $radius-full;
      object-fit: cover;
    }

    :host ::ng-deep .profile-avatar {
      background: linear-gradient(135deg, $primary-500, $secondary-500) !important;
      color: white !important;
      font-size: 1.5rem !important;
      font-weight: $font-weight-bold !important;
    }

    .profile-info {
      @include flex-column;
      gap: $spacing-1;
    }

    .profile-name { font-size: $font-size-lg; font-weight: $font-weight-semibold; }
    .profile-email { font-size: $font-size-sm; color: var(--text-secondary); }

    .setting-item {
      @include card($spacing-4);
      @include flex-between;
      gap: $spacing-4;
    }

    .setting-info {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      flex: 1;

      > i {
        font-size: 1.25rem;
        color: var(--text-secondary);
        width: 28px;
        text-align: center;
      }

      > div {
        @include flex-column;
        gap: 2px;
      }
    }

    .setting-label { font-size: $font-size-sm; font-weight: $font-weight-medium; }
    .setting-desc { font-size: $font-size-xs; color: var(--text-muted); }

    .about-info {
      @include card($spacing-4);
      @include flex-column;
      gap: $spacing-3;
    }

    .about-row {
      @include flex-between;
    }

    .about-label { font-size: $font-size-sm; color: var(--text-secondary); }
    .about-value { font-size: $font-size-sm; font-weight: $font-weight-medium; }

    .danger-zone {
      padding-top: $spacing-4;
      border-top: 1px solid var(--danger-color);
    }
  `]
})
export class SettingsPage implements OnInit {
  readonly themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private indexedDb = inject(IndexedDbService);

  readonly user = this.authService.currentUser;
  readonly storageUsed = signal('Calculando...');

  darkMode = false;
  budgetAlerts = true;
  achievementNotifs = true;

  async ngOnInit(): Promise<void> {
    this.darkMode = this.themeService.isDark();
    await this.calculateStorage();
  }

  onDarkModeChange(value: boolean): void {
    this.darkMode = value;
    this.themeService.setTheme(value ? 'dark' : 'light');
  }

  private async calculateStorage(): Promise<void> {
    try {
      const size = await this.indexedDb.getTotalReceiptsSize();
      if (size === 0) {
        this.storageUsed.set('Sin imágenes almacenadas');
      } else if (size < 1024 * 1024) {
        this.storageUsed.set(`${(size / 1024).toFixed(1)} KB en uso`);
      } else {
        this.storageUsed.set(`${(size / (1024 * 1024)).toFixed(1)} MB en uso`);
      }
    } catch {
      this.storageUsed.set('No disponible');
    }
  }

  async clearStorage(): Promise<void> {
    try {
      await this.indexedDb.receipts.clear();
      await this.indexedDb.clearAllCache();
      this.storageUsed.set('Sin imágenes almacenadas');
      this.notification.success('Almacenamiento limpiado', 'Se eliminaron todas las imágenes locales');
    } catch {
      this.notification.error('Error', 'No se pudo limpiar el almacenamiento');
    }
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    window.location.href = '/auth/login';
  }
}

export const SETTINGS_ROUTES: Routes = [
  { path: '', component: SettingsPage, title: 'Configuración — FamyPay' }
];
