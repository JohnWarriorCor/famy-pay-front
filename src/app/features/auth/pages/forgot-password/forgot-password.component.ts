import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../../core/services/firebase/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, RippleModule],
  template: `
    <div class="auth-page">
      <div class="auth-container animate-fade-in-scale">
        <div class="auth-header">
          <div class="auth-logo">🔑</div>
          <h1 class="auth-title">Recuperar Contraseña</h1>
          <p class="auth-subtitle">Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        @if (!emailSent()) {
          <form class="auth-form" (ngSubmit)="onResetPassword()">
            @if (authService.error(); as error) {
              <div class="auth-error animate-shake">
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ error }}</span>
              </div>
            }

            <div class="form-field">
              <label for="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                pInputText
                [(ngModel)]="email"
                name="email"
                placeholder="tu@correo.com"
                autocomplete="email"
                required
                class="w-full"
              />
            </div>

            <button
              pButton
              type="submit"
              label="Enviar enlace"
              icon="pi pi-send"
              class="w-full auth-button"
              [loading]="isLoading()"
              [disabled]="!email"
            ></button>
          </form>
        } @else {
          <div class="success-message animate-fade-in-up">
            <i class="pi pi-check-circle"></i>
            <p>Se envió un enlace de recuperación a <strong>{{ email }}</strong></p>
            <p class="text-sm text-secondary">Revisa tu bandeja de entrada y la carpeta de spam</p>
          </div>
        }

        <p class="auth-footer">
          <a routerLink="/auth/login" class="back-link">
            <i class="pi pi-arrow-left"></i> Volver al inicio de sesión
          </a>
        </p>
      </div>

      <div class="auth-decoration">
        <div class="decoration-circle circle-1"></div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .auth-page {
      min-height: 100vh; @include flex-center;
      padding: $spacing-4; background: var(--bg-color);
      position: relative; overflow: hidden;
    }

    .auth-container {
      @include card($spacing-8); width: 100%; max-width: 420px;
      position: relative; z-index: 1;
      @include mobile-only { padding: $spacing-6; box-shadow: none; border: none; background: transparent; }
    }

    .auth-header { text-align: center; margin-bottom: $spacing-6; }
    .auth-logo { font-size: 3rem; margin-bottom: $spacing-3; }
    .auth-title { font-size: $font-size-2xl; font-weight: $font-weight-bold; margin-bottom: $spacing-2; }
    .auth-subtitle { color: var(--text-secondary); font-size: $font-size-sm; }
    .auth-form { display: flex; flex-direction: column; gap: $spacing-4; }
    .form-field { display: flex; flex-direction: column; gap: $spacing-2;
      label { font-size: $font-size-sm; font-weight: $font-weight-medium; color: var(--text-secondary); }
    }
    .auth-error { display: flex; align-items: center; gap: $spacing-2;
      padding: $spacing-3 $spacing-4; background: var(--danger-bg); color: var(--danger-color);
      border-radius: $radius-md; font-size: $font-size-sm;
    }
    .auth-button {
      height: 48px !important; font-weight: $font-weight-semibold !important;
      border-radius: $radius-md !important; @include gradient-primary;
      border: none !important; margin-top: $spacing-2;
    }

    .success-message {
      text-align: center; padding: $spacing-6;
      i { font-size: 3rem; color: var(--success-color); margin-bottom: $spacing-4; }
      p { margin-bottom: $spacing-2; }
    }

    .auth-footer { text-align: center; margin-top: $spacing-6; }
    .back-link {
      color: var(--text-secondary); font-size: $font-size-sm;
      text-decoration: none; display: inline-flex; align-items: center; gap: $spacing-2;
      &:hover { color: var(--primary-color); }
    }

    .auth-decoration { position: fixed; inset: 0; pointer-events: none; }
    .decoration-circle {
      position: absolute; border-radius: 50%; opacity: 0.06;
      &.circle-1 { width: 400px; height: 400px; background: $accent-500; bottom: -100px; right: -100px; }
    }
  `]
})
export class ForgotPasswordComponent {
  readonly authService = inject(AuthService);

  email = '';
  isLoading = signal(false);
  emailSent = signal(false);

  async onResetPassword(): Promise<void> {
    if (!this.email) return;
    try {
      this.isLoading.set(true);
      await this.authService.resetPassword(this.email);
      this.emailSent.set(true);
    } catch {
      // handled
    } finally {
      this.isLoading.set(false);
    }
  }
}
