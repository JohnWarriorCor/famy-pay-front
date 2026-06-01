import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // --- Rutas públicas ---
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // --- Rutas protegidas con layout ---
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'transactions',
        loadChildren: () => import('./features/transactions/transactions.routes').then(m => m.TRANSACTIONS_ROUTES),
      },
      {
        path: 'budgets',
        loadChildren: () => import('./features/budgets/budgets.routes').then(m => m.BUDGETS_ROUTES),
      },
      {
        path: 'ocr',
        loadChildren: () => import('./features/ocr/ocr.routes').then(m => m.OCR_ROUTES),
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES),
      },
      {
        path: 'gamification',
        loadChildren: () => import('./features/gamification/gamification.routes').then(m => m.GAMIFICATION_ROUTES),
      },
      {
        path: 'family',
        loadChildren: () => import('./features/family-space/family-space.routes').then(m => m.FAMILY_SPACE_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // --- Fallback ---
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
