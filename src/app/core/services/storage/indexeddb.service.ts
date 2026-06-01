import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface StoredReceipt {
  id?: number;
  transactionId: string;
  imageBlob: Blob;
  mimeType: string;
  fileName: string;
  createdAt: Date;
}

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt: number;
}

/**
 * Servicio IndexedDB usando Dexie.js
 * Almacena imágenes de recibos localmente (no en Firebase Storage)
 * y datos de cache para mejorar rendimiento offline.
 */
@Injectable({ providedIn: 'root' })
export class IndexedDbService extends Dexie {
  receipts!: Table<StoredReceipt, number>;
  cache!: Table<CacheEntry, string>;

  constructor() {
    super('FamyPayDB');

    this.version(1).stores({
      receipts: '++id, transactionId, createdAt',
      cache: 'key, expiresAt',
    });
  }

  // ============================================
  // Receipts (Imágenes de recibos)
  // ============================================

  /** Guardar imagen de recibo */
  async saveReceipt(transactionId: string, file: File): Promise<number> {
    return await this.receipts.add({
      transactionId,
      imageBlob: file,
      mimeType: file.type,
      fileName: file.name,
      createdAt: new Date(),
    });
  }

  /** Obtener recibo por ID de transacción */
  async getReceiptByTransaction(transactionId: string): Promise<StoredReceipt | undefined> {
    return await this.receipts.where('transactionId').equals(transactionId).first();
  }

  /** Obtener URL de objeto para mostrar imagen */
  async getReceiptImageUrl(transactionId: string): Promise<string | null> {
    const receipt = await this.getReceiptByTransaction(transactionId);
    if (!receipt) return null;
    return URL.createObjectURL(receipt.imageBlob);
  }

  /** Eliminar recibo */
  async deleteReceipt(transactionId: string): Promise<void> {
    await this.receipts.where('transactionId').equals(transactionId).delete();
  }

  /** Obtener tamaño total de recibos almacenados */
  async getTotalReceiptsSize(): Promise<number> {
    const receipts = await this.receipts.toArray();
    return receipts.reduce((total, r) => total + r.imageBlob.size, 0);
  }

  // ============================================
  // Cache
  // ============================================

  /** Guardar en cache */
  async setCache(key: string, value: any, ttlMs: number = 3600000): Promise<void> {
    await this.cache.put({
      key,
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /** Obtener de cache */
  async getCache<T>(key: string): Promise<T | null> {
    const entry = await this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      await this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /** Limpiar cache expirado */
  async cleanExpiredCache(): Promise<void> {
    await this.cache.where('expiresAt').below(Date.now()).delete();
  }

  /** Limpiar todo el cache */
  async clearAllCache(): Promise<void> {
    await this.cache.clear();
  }
}
