import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../../core/services/firebase/auth.service';
import { FirestoreService } from '../../../../core/services/firebase/firestore.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, PasswordModule, RippleModule
  ],
  template: `
    <div class="auth-page">
      <div class="auth-container animate-fade-in-scale">
        <div class="auth-header">
          <div class="auth-logo">💰</div>
          <h1 class="auth-title">Crear Cuenta</h1>
          <p class="auth-subtitle">Únete a FamyPay y toma control de tus finanzas</p>
        </div>

        <form class="auth-form" (ngSubmit)="onRegister()">
          @if (authService.error(); as error) {
            <div class="auth-error animate-shake">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ error }}</span>
            </div>
          }

          <div class="form-field">
            <label for="name">Nombre completo</label>
            <input
              id="name"
              type="text"
              pInputText
              [(ngModel)]="displayName"
              name="name"
              placeholder="Juan Pérez"
              autocomplete="name"
              required
              class="w-full"
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              [toggleMask]="true"
              [feedback]="true"
              promptLabel="Elige una contraseña"
              weakLabel="Débil"
              mediumLabel="Moderada"
              strongLabel="Fuerte"
              autocomplete="new-password"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
          </div>

          <button
            pButton
            type="submit"
            label="Crear Cuenta"
            icon="pi pi-user-plus"
            class="w-full auth-button"
            [loading]="isLoading()"
            [disabled]="!email || !password || !displayName"
          ></button>
        </form>

        <p class="auth-footer">
          ¿Ya tienes cuenta?
          <a routerLink="/auth/login" class="login-link">Inicia sesión</a>
        </p>
      </div>

      <div class="auth-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
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

    .auth-logo { font-size: 3rem; margin-bottom: $spacing-3; }

    .auth-title {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      background: linear-gradient(135deg, $primary-500, $secondary-500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: $spacing-2;
    }

    .auth-subtitle { color: var(--text-secondary); font-size: $font-size-sm; }

    .auth-form { display: flex; flex-direction: column; gap: $spacing-4; }

    .form-field {
      display: flex; flex-direction: column; gap: $spacing-2;
      label { font-size: $font-size-sm; font-weight: $font-weight-medium; color: var(--text-secondary); }
    }

    .auth-error {
      display: flex; align-items: center; gap: $spacing-2;
      padding: $spacing-3 $spacing-4;
      background: var(--danger-bg); color: var(--danger-color);
      border-radius: $radius-md; font-size: $font-size-sm;
    }

    .auth-button {
      height: 48px !important;
      font-weight: $font-weight-semibold !important;
      border-radius: $radius-md !important;
      @include gradient-primary;
      border: none !important;
      font-size: $font-size-base !important;
      margin-top: $spacing-2;
    }

    .auth-footer { text-align: center; font-size: $font-size-sm; color: var(--text-secondary); margin-top: $spacing-6; }
    .login-link { color: var(--primary-color); font-weight: $font-weight-semibold; text-decoration: none; }

    .auth-decoration { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
    .decoration-circle {
      position: absolute; border-radius: 50%; opacity: 0.07;
      &.circle-1 { width: 500px; height: 500px; background: $secondary-500; top: -150px; left: -150px; }
      &.circle-2 { width: 300px; height: 300px; background: $primary-500; bottom: -100px; right: -50px; }
    }
  `]
})
export class RegisterComponent {
  readonly authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);

  displayName = '';
  email = '';
  password = '';
  isLoading = signal(false);

  async onRegister(): Promise<void> {
    if (!this.email || !this.password || !this.displayName) return;
    try {
      this.isLoading.set(true);
      const user = await this.authService.register(this.email, this.password, this.displayName);
      // Crear perfil en Firestore
      await this.firestoreService.setDocument(`users/${user.uid}`, {
        uid: user.uid,
        email: this.email,
        displayName: this.displayName,
        photoURL: null,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
        familySpaceIds: [],
      });
      this.router.navigate(['/dashboard']);
    } catch {
      // Error manejado por authService
    } finally {
      this.isLoading.set(false);
    }
  }
}
