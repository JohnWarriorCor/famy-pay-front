import { Injectable, inject, signal, computed } from '@angular/core';
import { FirestoreService } from '../../../core/services/firebase/firestore.service';
import { AuthService } from '../../../core/services/firebase/auth.service';
import { Transaction, TransactionType, TransactionFilter } from '../../../core/models';
import { orderBy, limit, where, Timestamp, Unsubscribe, startAfter } from 'firebase/firestore';
import { PAGINATION } from '../../../core/constants/app.constants';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private firestore = inject(FirestoreService);
  private auth = inject(AuthService);

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
  async addTransaction(spaceId: string, data: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
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

    return await this.firestore.addDocument(
      `familySpaces/${spaceId}/transactions`,
      txData
    );
  }

  /** Actualizar transacción */
  async updateTransaction(spaceId: string, txId: string, data: Partial<Transaction>): Promise<void> {
    const updateData: any = { ...data };
    if (data.date instanceof Date) {
      updateData.date = Timestamp.fromDate(data.date);
    }
    await this.firestore.updateDocument(
      `familySpaces/${spaceId}/transactions/${txId}`,
      updateData
    );
  }

  /** Eliminar transacción */
  async deleteTransaction(spaceId: string, txId: string): Promise<void> {
    await this.firestore.deleteDocument(
      `familySpaces/${spaceId}/transactions/${txId}`
    );
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
