import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from '../../../core/services/firebase/firestore.service';
import { Budget } from '../../../core/models';
import { where, Timestamp, Unsubscribe } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private firestore = inject(FirestoreService);

  private readonly _budgets = signal<Budget[]>([]);
  private readonly _loading = signal(false);
  private _activeSpaceId: string | null = null;
  private _unsubscribe?: Unsubscribe;

  /** Presupuestos actuales */
  readonly budgets = this._budgets.asReadonly();
  /** Estado de carga */
  readonly loading = this._loading.asReadonly();

  /** Escuchar presupuestos del espacio activo para un mes específico (ej: '2026-06') */
  listenToBudgets(spaceId: string, month: string): void {
    this._activeSpaceId = spaceId;
    this._unsubscribe?.();

    this._loading.set(true);
    this._unsubscribe = this.firestore.onCollectionSnapshot<Budget>(
      `familySpaces/${spaceId}/budgets`,
      (data) => {
        this._budgets.set(data);
        this._loading.set(false);
      },
      where('month', '==', month)
    );
  }

  /** Crear o actualizar presupuesto */
  async setBudget(spaceId: string, budget: Omit<Budget, 'id' | 'updatedAt' | 'spent'> & { id?: string }): Promise<void> {
    const budgetId = budget.id || `${budget.month}_${budget.categoryId}`;
    const budgetData = {
      ...budget,
      id: budgetId,
      spent: 0, // Se inicializa en 0 y se calcula en cliente o se actualiza
      updatedAt: new Date(),
    };

    await this.firestore.setDocument(
      `familySpaces/${spaceId}/budgets/${budgetId}`,
      budgetData
    );
  }

  /** Eliminar presupuesto */
  async deleteBudget(spaceId: string, budgetId: string): Promise<void> {
    await this.firestore.deleteDocument(
      `familySpaces/${spaceId}/budgets/${budgetId}`
    );
  }

  /** Limpiar listeners al destruir el servicio */
  destroy(): void {
    this._unsubscribe?.();
    this._budgets.set([]);
    this._activeSpaceId = null;
  }
}
