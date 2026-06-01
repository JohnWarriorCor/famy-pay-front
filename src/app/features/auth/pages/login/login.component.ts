import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../../core/services/firebase/auth.service';
import { FirestoreService } from '../../../../core/services/firebase/firestore.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, PasswordModule, DividerModule, RippleModule
  ],
  template: `
    <div class="auth-page">
      <div class="auth-container animate-fade-in-scale">
        <!-- Header -->
        <div class="auth-header">
          <div class="auth-logo">💰</div>
          <h1 class="auth-title">FamyPay</h1>
          <p class="auth-subtitle">Gestión inteligente de gastos familiares</p>
        </div>

        <!-- Form -->
        <form class="auth-form" (ngSubmit)="onLogin()">
          <!-- Error -->
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

          <div class="form-field">
            <label for="password">Contraseña</label>
            <p-password
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              [toggleMask]="true"
              [feedback]="false"
              autocomplete="current-password"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
          </div>

          <a class="forgot-link" routerLink="/auth/forgot-password">
            ¿Olvidaste tu contraseña?
          </a>

          <button
            pButton
            type="submit"
            label="Iniciar Sesión"
            icon="pi pi-sign-in"
            class="w-full auth-button"
            [loading]="isLoading()"
            [disabled]="!email || !password"
          ></button>
        </form>

        <!-- Divider -->
        <p-divider align="center">
          <span class="divider-text">o continúa con</span>
        </p-divider>

        <!-- Google Login -->
        <button
          pButton
          type="button"
          label="Google"
          icon="pi pi-google"
          class="w-full google-button"
          [outlined]="true"
          (click)="onGoogleLogin()"
          [loading]="isGoogleLoading()"
        ></button>

        <!-- Register Link -->
        <p class="auth-footer">
          ¿No tienes cuenta?
          <a routerLink="/auth/register" class="register-link">Regístrate gratis</a>
        </p>
      </div>

      <!-- Decorative Background -->
      <div class="auth-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .auth-page {
      min-height: 100vh;
      @include flex-center;
      padding: $spacing-4;
      background: var(--bg-color);
      position: relative;
      overflow: hidden;
    }

    .auth-container {
      @include card($spacing-8);
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 1;

      @include mobile-only {
        padding: $spacing-6;
        box-shadow: none;
        border: none;
        background: transparent;
      }
    }

    .auth-header {
      text-align: center;
      margin-bottom: $spacing-8;
    }

    .auth-logo {
      font-size: 3.5rem;
      margin-bottom: $spacing-3;
      animation: bounce 2s ease infinite;
    }

    .auth-title {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      background: linear-gradient(135deg, $primary-500, $secondary-500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: $spacing-2;
    }

    .auth-subtitle {
      color: var(--text-secondary);
      font-size: $font-size-sm;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: $spacing-2;

      label {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: var(--text-secondary);
      }
    }

    .auth-error {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-3 $spacing-4;
      background: var(--danger-bg);
      color: var(--danger-color);
      border-radius: $radius-md;
      font-size: $font-size-sm;

      i { font-size: 1.1rem; }
    }

    .forgot-link {
      font-size: $font-size-sm;
      color: var(--primary-color);
      text-align: right;
      text-decoration: none;
      font-weight: $font-weight-medium;

      &:hover { text-decoration: underline; }
    }

    .auth-button {
      height: 48px !important;
      font-weight: $font-weight-semibold !important;
      border-radius: $radius-md !important;
      @include gradient-primary;
      border: none !important;
      font-size: $font-size-base !important;
      margin-top: $spacing-2;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .divider-text {
      font-size: $font-size-sm;
      color: var(--text-muted);
    }

    .google-button {
      height: 48px !important;
      border-radius: $radius-md !important;
      font-weight: $font-weight-medium !important;
    }

    .auth-footer {
      text-align: center;
      font-size: $font-size-sm;
      color: var(--text-secondary);
      margin-top: $spacing-4;
    }

    .register-link {
      color: var(--primary-color);
      font-weight: $font-weight-semibold;
      text-decoration: none;

      &:hover { text-decoration: underline; }
    }

    // --- Decorative Background ---
    .auth-decoration {
      position: fixed;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .decoration-circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.07;

      &.circle-1 {
        width: 600px;
        height: 600px;
        background: $primary-500;
        top: -200px;
        right: -200px;
      }

      &.circle-2 {
        width: 400px;
        height: 400px;
        background: $secondary-500;
        bottom: -150px;
        left: -100px;
      }

      &.circle-3 {
        width: 200px;
        height: 200px;
        background: $accent-500;
        top: 40%;
        left: 10%;
      }
    }
  `]
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);
  isGoogleLoading = signal(false);

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) return;
    try {
      this.isLoading.set(true);
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch {
      // Error manejado por authService
    } finally {
      this.isLoading.set(false);
    }
  }

  async onGoogleLogin(): Promise<void> {
    try {
      this.isGoogleLoading.set(true);
      const user = await this.authService.loginWithGoogle();
      // Crear/actualizar perfil en Firestore
      await this.firestoreService.setDocument(`users/${user.uid}`, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || null,
        lastLoginAt: Timestamp.now(),
        familySpaceIds: [],
      });
      this.router.navigate(['/dashboard']);
    } catch {
      // Error manejado por authService
    } finally {
      this.isGoogleLoading.set(false);
    }
  }
}
