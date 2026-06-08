import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from '../../../core/services/firebase/firestore.service';
import { AuthService } from '../../../core/services/firebase/auth.service';
import { SavingsGoal } from '../../../core/models';
import { Timestamp, Unsubscribe } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class SavingsGoalService {
  private firestore = inject(FirestoreService);
  private auth = inject(AuthService);

  private readonly _savingsGoals = signal<SavingsGoal[]>([]);
  private readonly _loading = signal(false);
  private _unsubscribe?: Unsubscribe;

  readonly savingsGoals = this._savingsGoals.asReadonly();
  readonly loading = this._loading.asReadonly();

  /** Escuchar metas de ahorro de un espacio familiar activo */
  listenToSavingsGoals(spaceId: string): void {
    this._unsubscribe?.();
    this._loading.set(true);

    this._unsubscribe = this.firestore.onCollectionSnapshot<SavingsGoal>(
      `familySpaces/${spaceId}/savingsGoals`,
      (data) => {
        this._savingsGoals.set(data);
        this._loading.set(false);
      }
    );
  }

  /** Crear meta de ahorro */
  async addSavingsGoal(spaceId: string, goal: Omit<SavingsGoal, 'id' | 'createdBy' | 'createdAt'>): Promise<string> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No autenticado');

    const goalData = {
      ...goal,
      deadline: goal.deadline instanceof Date ? Timestamp.fromDate(goal.deadline) : goal.deadline,
      createdBy: user.uid,
      createdAt: Timestamp.now()
    };

    return await this.firestore.addDocument(
      `familySpaces/${spaceId}/savingsGoals`,
      goalData
    );
  }

  /** Actualizar meta de ahorro */
  async updateSavingsGoal(spaceId: string, goalId: string, data: Partial<SavingsGoal>): Promise<void> {
    const updateData: any = { ...data };
    if (data.deadline instanceof Date) {
      updateData.deadline = Timestamp.fromDate(data.deadline);
    }

    await this.firestore.updateDocument(
      `familySpaces/${spaceId}/savingsGoals/${goalId}`,
      updateData
    );
  }

  /** Eliminar meta de ahorro */
  async deleteSavingsGoal(spaceId: string, goalId: string): Promise<void> {
    await this.firestore.deleteDocument(
      `familySpaces/${spaceId}/savingsGoals/${goalId}`
    );
  }

  destroy(): void {
    this._unsubscribe?.();
    this._savingsGoals.set([]);
  }
}
