import { Injectable, inject } from '@angular/core';
import {
  getFirestore,
  Firestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  Timestamp,
  writeBatch,
  DocumentReference,
  CollectionReference,
  Unsubscribe,
} from 'firebase/firestore';
import { signal } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private db: Firestore;
  private readonly _isOffline = signal(false);

  /** Indica si la app está operando offline */
  readonly isOffline = this._isOffline.asReadonly();

  private authService = inject(AuthService);

  constructor() {
    this.db = getFirestore(this.authService.getApp());
    this.enableOffline();
    this.monitorConnection();
  }

  /** Habilitar persistencia offline (IndexedDB automático de Firestore) */
  private async enableOffline(): Promise<void> {
    try {
      await enableIndexedDbPersistence(this.db);
      console.log('[Firestore] Persistencia offline habilitada');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('[Firestore] Offline persistence: múltiples tabs abiertos');
      } else if (err.code === 'unimplemented') {
        console.warn('[Firestore] Navegador no soporta persistence');
      }
    }
  }

  /** Monitorear estado de conexión */
  private monitorConnection(): void {
    window.addEventListener('online', () => this._isOffline.set(false));
    window.addEventListener('offline', () => this._isOffline.set(true));
  }

  // ============================================
  // CRUD Genérico
  // ============================================

  /** Obtener referencia a colección */
  getCollectionRef(path: string): CollectionReference<DocumentData> {
    return collection(this.db, path);
  }

  /** Obtener referencia a documento */
  getDocRef(path: string): DocumentReference<DocumentData> {
    return doc(this.db, path);
  }

  /** Crear documento con ID auto-generado */
  async addDocument<T extends Record<string, any>>(collectionPath: string, data: T): Promise<string> {
    const ref = collection(this.db, collectionPath);
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  }

  /** Crear o sobrescribir documento con ID específico */
  async setDocument<T extends Record<string, any>>(documentPath: string, data: T): Promise<void> {
    const ref = doc(this.db, documentPath);
    await setDoc(ref, data);
  }

  /** Actualizar campos de un documento */
  async updateDocument(documentPath: string, data: Record<string, any>): Promise<void> {
    const ref = doc(this.db, documentPath);
    await updateDoc(ref, data);
  }

  /** Eliminar documento */
  async deleteDocument(documentPath: string): Promise<void> {
    const ref = doc(this.db, documentPath);
    await deleteDoc(ref);
  }

  /** Obtener un documento */
  async getDocument<T>(documentPath: string): Promise<T | null> {
    const ref = doc(this.db, documentPath);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...this.convertTimestamps(snap.data()) } as T;
  }

  /** Obtener documentos con filtros */
  async queryDocuments<T>(
    collectionPath: string,
    ...constraints: QueryConstraint[]
  ): Promise<T[]> {
    const ref = collection(this.db, collectionPath);
    const q = query(ref, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...this.convertTimestamps(d.data()) } as T));
  }

  /** Listener en tiempo real para colección */
  onCollectionSnapshot<T>(
    collectionPath: string,
    callback: (data: T[]) => void,
    ...constraints: QueryConstraint[]
  ): Unsubscribe {
    const ref = collection(this.db, collectionPath);
    const q = constraints.length > 0 ? query(ref, ...constraints) : query(ref);
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...this.convertTimestamps(d.data()) } as T));
      callback(data);
    });
  }

  /** Listener en tiempo real para documento */
  onDocumentSnapshot<T>(
    documentPath: string,
    callback: (data: T | null) => void,
  ): Unsubscribe {
    const ref = doc(this.db, documentPath);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...this.convertTimestamps(snap.data()) } as T);
    });
  }

  /** Batch write — agrupar múltiples operaciones */
  async batchWrite(operations: BatchOperation[]): Promise<void> {
    const batch = writeBatch(this.db);
    for (const op of operations) {
      const ref = doc(this.db, op.path);
      switch (op.type) {
        case 'set':
          batch.set(ref, op.data);
          break;
        case 'update':
          batch.update(ref, op.data);
          break;
        case 'delete':
          batch.delete(ref);
          break;
      }
    }
    await batch.commit();
  }

  // ============================================
  // Helpers de Query
  // ============================================

  /** Re-exportar constraints para uso externo */
  where = where;
  orderBy = orderBy;
  limit = limit;
  startAfter = startAfter;
  timestamp = Timestamp;

  /** Convertir Timestamps de Firestore a Date */
  private convertTimestamps(data: DocumentData): DocumentData {
    const converted: any = { ...data };
    for (const key in converted) {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate();
      }
    }
    return converted;
  }
}

export interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  path: string;
  data: Record<string, any>;
}
