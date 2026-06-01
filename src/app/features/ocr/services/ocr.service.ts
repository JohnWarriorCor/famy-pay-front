import { Injectable, signal } from '@angular/core';
import Tesseract from 'tesseract.js';
import { OcrResult } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class OcrService {
  private readonly _progress = signal(0);
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);

  /** Progreso de procesamiento (0-100) */
  readonly progress = this._progress.asReadonly();
  /** ¿Está procesando? */
  readonly isProcessing = this._isProcessing.asReadonly();
  /** Error */
  readonly error = this._error.asReadonly();

  /** Procesar imagen con Tesseract.js */
  async processImage(imageSource: File | Blob | string): Promise<string> {
    try {
      this._isProcessing.set(true);
      this._progress.set(0);
      this._error.set(null);

      const result = await Tesseract.recognize(imageSource, 'spa+eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            this._progress.set(Math.round(m.progress * 100));
          }
        },
      });

      return result.data.text;
    } catch (err: any) {
      const errorMsg = 'Error al procesar la imagen. Intenta con otra imagen.';
      this._error.set(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this._isProcessing.set(false);
      this._progress.set(100);
    }
  }

  /** Limpiar estado */
  reset(): void {
    this._progress.set(0);
    this._isProcessing.set(false);
    this._error.set(null);
  }
}
