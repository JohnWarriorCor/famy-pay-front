import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from '../../../core/services/firebase/firestore.service';
import { Category, CategoryType } from '../../../core/models';
import { DEFAULT_CATEGORIES } from '../../../core/constants/app.constants';
import { orderBy, Unsubscribe } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestore = inject(FirestoreService);

  private readonly _categories = signal<Category[]>([]);
  private _unsubscribe?: Unsubscribe;

  /** Categorías del espacio activo */
  readonly categories = this._categories.asReadonly();

  /** Categorías agrupadas por tipo */
  readonly incomeCategories = () => this._categories().filter(c => c.type === 'income');
  readonly fixedExpenseCategories = () => this._categories().filter(c => c.type === 'fixedExpense');
  readonly variableExpenseCategories = () => this._categories().filter(c => c.type === 'variableExpense');
  readonly expenseCategories = () => this._categories().filter(c => c.type !== 'income');

  /** Escuchar categorías de un espacio */
  listenToCategories(spaceId: string): void {
    this._unsubscribe?.();
    this._unsubscribe = this.firestore.onCollectionSnapshot<Category>(
      `familySpaces/${spaceId}/categories`,
      (data) => this._categories.set(data.sort((a, b) => a.order - b.order)),
      orderBy('order', 'asc')
    );
  }

  /** Inicializar categorías por defecto al crear un espacio */
  async initializeDefaultCategories(spaceId: string): Promise<void> {
    for (const cat of DEFAULT_CATEGORIES) {
      await this.firestore.addDocument(
        `familySpaces/${spaceId}/categories`,
        cat
      );
    }
  }

  /** Agregar categoría personalizada */
  async addCategory(spaceId: string, category: Omit<Category, 'id'>): Promise<string> {
    return await this.firestore.addDocument(
      `familySpaces/${spaceId}/categories`,
      category
    );
  }

  /** Actualizar categoría */
  async updateCategory(spaceId: string, categoryId: string, data: Partial<Category>): Promise<void> {
    await this.firestore.updateDocument(
      `familySpaces/${spaceId}/categories/${categoryId}`,
      data
    );
  }

  /** Eliminar categoría */
  async deleteCategory(spaceId: string, categoryId: string): Promise<void> {
    await this.firestore.deleteDocument(
      `familySpaces/${spaceId}/categories/${categoryId}`
    );
  }

  /** Obtener categoría por ID */
  getCategoryById(id: string): Category | undefined {
    return this._categories().find(c => c.id === id);
  }

  destroy(): void {
    this._unsubscribe?.();
  }
}
