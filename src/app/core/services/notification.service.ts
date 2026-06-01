import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messageService = inject(MessageService);

  success(summary: string, detail?: string): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 3000,
    });
  }

  error(summary: string, detail?: string): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000,
    });
  }

  warn(summary: string, detail?: string): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life: 4000,
    });
  }

  info(summary: string, detail?: string): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: 3000,
    });
  }

  /** Notificación de presupuesto */
  budgetAlert(categoryName: string, percentage: number): void {
    if (percentage >= 100) {
      this.error('¡Presupuesto superado!', `${categoryName}: ${percentage.toFixed(0)}% consumido`);
    } else if (percentage >= 80) {
      this.warn('Presupuesto crítico', `${categoryName}: ${percentage.toFixed(0)}% consumido`);
    } else if (percentage >= 70) {
      this.warn('Alerta de presupuesto', `${categoryName}: ${percentage.toFixed(0)}% consumido`);
    }
  }

  /** Notificación de logro desbloqueado */
  achievementUnlocked(name: string, icon: string): void {
    this.messageService.add({
      severity: 'success',
      summary: `${icon} ¡Logro desbloqueado!`,
      detail: name,
      life: 6000,
      styleClass: 'achievement-toast',
    });
  }

  /** Notificación offline */
  offlineWarning(): void {
    this.warn('Sin conexión', 'Los cambios se sincronizarán al reconectar.');
  }
}
