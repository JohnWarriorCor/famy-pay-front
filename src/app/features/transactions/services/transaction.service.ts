import { Injectable, inject, signal, computed } from '@angular/core';
import { FirestoreService } from '../../../core/services/firebase/firestore.service';
import { AuthService } from '../../../core/services/firebase/auth.service';
import { Transaction, TransactionType, TransactionFilter, Budget } from '../../../core/models';
import { orderBy, limit, where, Timestamp, Unsubscribe, startAfter } from 'firebase/firestore';
import { PAGINATION } from '../../../core/constants/app.constants';
import { GamificationService } from '../../gamification/services/gamification.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private firestore = inject(FirestoreService);
  private auth = inject(AuthService);
  private gamificationService = inject(GamificationService);

  private readonly _transactions = signal<Transaction[]>([]);
  private readonly _loading = signal(false);
  private _activeSpaceId: string | null = null;
  private _unsubscribe?: Unsubscribe;

  /** Transacciones actuales */
  readonly transactions = this._transactions.asReadonly();
  /** Estado de carga */
  readonly loading = this._loading.asReadonly();

  /** Ruta base de transacciones para el espacio activo */
  private get collectionPath(): string {
    return `familySpaces/${this._activeSpaceId}/transactions`;
  }

  /** Establecer espacio activo y suscribirse */
  listenToTransactions(spaceId: string): void {
    this._activeSpaceId = spaceId;
    this._unsubscribe?.();

    this._loading.set(true);
    this._unsubscribe = this.firestore.onCollectionSnapshot<Transaction>(
      this.collectionPath,
      (data) => {
        this._transactions.set(data);
        this._loading.set(false);
      },
      orderBy('date', 'desc'),
      limit(PAGINATION.defaultPageSize)
    );
  }

  /** Crear nueva transacción */
  async addTransaction(spaceId: string, data: Omit<Transaction, 'id' | 'createdAt' | 'userId' | 'userName'>): Promise<string> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No autenticado');

    const txData = {
      ...data,
      userId: user.uid,
      userName: user.displayName || user.email || 'Anónimo',
      date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
      createdAt: Timestamp.now(),
      status: 'confirmed' as const,
    };

    const docId = await this.firestore.addDocument(
      `familySpaces/${spaceId}/transactions`,
      txData
    );

    if (data.type !== 'income' && data.type !== 'transfer') {
      await this.updateBudgetSpent(spaceId, data.categoryId, data.date);
      // Trigger Logro: Primer Gasto
      await this.gamificationService.unlockAchievement(spaceId, 'first_expense');
      // Trigger Logro: Racha
      await this.checkStreakAchievements(spaceId);
    }

    return docId;
  }

  /** Actualizar transacción */
  async updateTransaction(spaceId: string, txId: string, data: Partial<Transaction>): Promise<void> {
    const oldTx = await this.firestore.getDocument<Transaction>(
      `familySpaces/${spaceId}/transactions/${txId}`
    );

    const updateData: any = { ...data };
    if (data.date instanceof Date) {
      updateData.date = Timestamp.fromDate(data.date);
    }
    await this.firestore.updateDocument(
      `familySpaces/${spaceId}/transactions/${txId}`,
      updateData
    );

    // Recalcular presupuestos si era y/o es un gasto
    if (oldTx) {
      if (oldTx.type !== 'income' && oldTx.type !== 'transfer') {
        await this.updateBudgetSpent(spaceId, oldTx.categoryId, oldTx.date);
      }
      const newCategory = data.categoryId || oldTx.categoryId;
      const newDate = data.date || oldTx.date;
      const newType = data.type || oldTx.type;
      if (newType !== 'income' && newType !== 'transfer') {
        await this.updateBudgetSpent(spaceId, newCategory, newDate);
      }
    }
  }

  /** Eliminar transacción */
  async deleteTransaction(spaceId: string, txId: string): Promise<void> {
    const tx = await this.firestore.getDocument<Transaction>(
      `familySpaces/${spaceId}/transactions/${txId}`
    );

    await this.firestore.deleteDocument(
      `familySpaces/${spaceId}/transactions/${txId}`
    );

    if (tx && tx.type !== 'income' && tx.type !== 'transfer') {
      await this.updateBudgetSpent(spaceId, tx.categoryId, tx.date);
      // Recalcular racha tras eliminación
      await this.checkStreakAchievements(spaceId);
    }
  }

  /** Recalcular el total gastado para un presupuesto y actualizarlo en Firestore */
  private async updateBudgetSpent(spaceId: string, categoryId: string, date: Date | Timestamp): Promise<void> {
    const d = date instanceof Date ? date : (date as any).toDate ? (date as any).toDate() : new Date();
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const budgetId = `${monthKey}_${categoryId}`;

    // Obtener todas las transacciones de esta categoría en este mes
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    try {
      const txs = await this.firestore.queryDocuments<Transaction>(
        `familySpaces/${spaceId}/transactions`,
        where('categoryId', '==', categoryId),
        where('date', '>=', Timestamp.fromDate(startOfMonth)),
        where('date', '<=', Timestamp.fromDate(endOfMonth))
      );

      // Sumar montos de gastos (excluyendo ingresos y transferencias)
      const spent = txs
        .filter(tx => tx.type !== 'income' && tx.type !== 'transfer')
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Si existe el presupuesto, actualizar el campo spent
      const budgetDoc = await this.firestore.getDocument<Budget>(
        `familySpaces/${spaceId}/budgets/${budgetId}`
      );
      if (budgetDoc) {
        await this.firestore.updateDocument(
          `familySpaces/${spaceId}/budgets/${budgetId}`,
          { spent, updatedAt: new Date() }
        );
      }
    } catch (e) {
      console.warn('Error al actualizar spent en el presupuesto:', budgetId, e);
    }
  }

  /** Verificar y desbloquear logros de rachas de días consecutivos de gastos */
  private async checkStreakAchievements(spaceId: string): Promise<void> {
    const transactions = this._transactions();
    const user = this.auth.currentUser();
    if (!user) return;

    // Filtrar gastos del usuario actual
    const userExpenses = transactions.filter(tx => 
      tx.userId === user.uid && 
      tx.type !== 'income' && 
      tx.type !== 'transfer'
    );

    if (userExpenses.length === 0) return;

    // Obtener fechas únicas formateadas YYYY-MM-DD
    const uniqueDates = Array.from(new Set(
      userExpenses.map(tx => {
        const d = tx.date instanceof Date ? tx.date : (tx.date as any).toDate ? (tx.date as any).toDate() : new Date(tx.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Orden descendente (recientes primero)

    let streak = 0;
    const oneDayMs = 86400000;

    if (uniqueDates.length > 0) {
      let currentDate = new Date(uniqueDates[0]);
      currentDate.setHours(0,0,0,0);

      const today = new Date();
      today.setHours(0,0,0,0);

      const diffFromToday = today.getTime() - currentDate.getTime();

      // Si el gasto más reciente fue hoy o ayer
      if (diffFromToday <= oneDayMs) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const nextDate = new Date(uniqueDates[i]);
          nextDate.setHours(0,0,0,0);
          const diff = currentDate.getTime() - nextDate.getTime();
          if (diff === oneDayMs) {
            streak++;
            currentDate = nextDate;
          } else if (diff > oneDayMs) {
            break;
          }
        }
      }
    }

    if (streak >= 7) {
      await this.gamificationService.unlockAchievement(spaceId, 'streak_7');
    }
    if (streak >= 30) {
      await this.gamificationService.unlockAchievement(spaceId, 'streak_30');
    }
  }

  /** Obtener transacciones filtradas (one-time read para reportes) */
  async getFilteredTransactions(spaceId: string, filter: TransactionFilter): Promise<Transaction[]> {
    const constraints: any[] = [];

    if (filter.type) {
      constraints.push(where('type', '==', filter.type));
    }
    if (filter.categoryId) {
      constraints.push(where('categoryId', '==', filter.categoryId));
    }
    if (filter.userId) {
      constraints.push(where('userId', '==', filter.userId));
    }
    if (filter.status) {
      constraints.push(where('status', '==', filter.status));
    }

    constraints.push(orderBy('date', 'desc'));
    constraints.push(limit(PAGINATION.maxPageSize));

    const results = await this.firestore.queryDocuments<Transaction>(
      `familySpaces/${spaceId}/transactions`,
      ...constraints
    );

    // Filtros client-side para evitar índices compuestos adicionales
    return results.filter(tx => {
      if (filter.dateFrom && new Date(tx.date) < filter.dateFrom) return false;
      if (filter.dateTo && new Date(tx.date) > filter.dateTo) return false;
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        return (
          tx.description.toLowerCase().includes(term) ||
          tx.categoryName.toLowerCase().includes(term) ||
          tx.userName.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }

  /** Limpiar suscripción */
  destroy(): void {
    this._unsubscribe?.();
  }
}
