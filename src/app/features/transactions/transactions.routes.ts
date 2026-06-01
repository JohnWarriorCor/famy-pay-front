import { Routes } from '@angular/router';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/transaction-list/transaction-list.component').then(m => m.TransactionListComponent),
    title: 'Transacciones — FamyPay',
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/transaction-form/transaction-form.component').then(m => m.TransactionFormComponent),
    title: 'Nueva Transacción — FamyPay',
  },
];
