import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private app: FirebaseApp;
  private auth: Auth;

  // --- Signals ---
  private readonly _currentUser = signal<User | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  /** Usuario actualmente autenticado */
  readonly currentUser = this._currentUser.asReadonly();
  /** Estado de carga de autenticación */
  readonly loading = this._loading.asReadonly();
  /** Último error de autenticación */
  readonly error = this._error.asReadonly();
  /** ¿Está autenticado? */
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.auth = getAuth(this.app);

    // Escuchar cambios de autenticación
    onAuthStateChanged(this.auth, (user) => {
      this._currentUser.set(user);
      this._loading.set(false);
    });
  }

  /** Registro con email y contraseña */
  async register(email: string, password: string, displayName: string): Promise<User> {
    try {
      this._error.set(null);
      this._loading.set(true);
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(credential.user, { displayName });
      return credential.user;
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error.code));
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /** Login con email y contraseña */
  async login(email: string, password: string): Promise<User> {
    try {
      this._error.set(null);
      this._loading.set(true);
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error.code));
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /** Login con Google */
  async loginWithGoogle(): Promise<User> {
    try {
      this._error.set(null);
      this._loading.set(true);
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      return credential.user;
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error.code));
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /** Enviar email de recuperación de contraseña */
  async resetPassword(email: string): Promise<void> {
    try {
      this._error.set(null);
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error.code));
      throw error;
    }
  }

  /** Cerrar sesión */
  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  /** Limpiar error */
  clearError(): void {
    this._error.set(null);
  }

  /** Obtener instancia de Auth para uso externo */
  getAuth(): Auth {
    return this.auth;
  }

  /** Obtener instancia de App para uso externo */
  getApp(): FirebaseApp {
    return this.app;
  }

  /** Traducir códigos de error Firebase al español */
  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Este correo ya está registrado.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/invalid-email': 'El correo electrónico no es válido.',
      'auth/user-not-found': 'No existe una cuenta con este correo.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
      'auth/popup-closed-by-user': 'Se cerró la ventana de autenticación.',
      'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
    };
    return messages[code] || 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}
