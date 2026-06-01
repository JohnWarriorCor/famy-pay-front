import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/firebase/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.loading()) {
    // Esperar a que Firebase inicialice auth
    return new Promise<boolean>((resolve) => {
      const check = setInterval(() => {
        if (!authService.loading()) {
          clearInterval(check);
          if (authService.isAuthenticated()) {
            resolve(true);
          } else {
            router.navigate(['/auth/login']);
            resolve(false);
          }
        }
      }, 100);
    });
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

/** Guard inverso: redirigir a dashboard si ya está autenticado */
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.loading()) {
    return new Promise<boolean>((resolve) => {
      const check = setInterval(() => {
        if (!authService.loading()) {
          clearInterval(check);
          if (!authService.isAuthenticated()) {
            resolve(true);
          } else {
            router.navigate(['/dashboard']);
            resolve(false);
          }
        }
      }, 100);
    });
  }

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
