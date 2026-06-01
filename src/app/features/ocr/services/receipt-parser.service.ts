import { Injectable } from '@angular/core';
import { OcrResult } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ReceiptParserService {
  /** Patrones para extraer montos */
  private readonly amountPatterns = [
    /TOTAL\s*:?\s*\$?\s*([\d.,]+)/i,
    /TOTAL\s+A\s+PAGAR\s*:?\s*\$?\s*([\d.,]+)/i,
    /VALOR\s+TOTAL\s*:?\s*\$?\s*([\d.,]+)/i,
    /NETO\s*:?\s*\$?\s*([\d.,]+)/i,
    /GRAN\s+TOTAL\s*:?\s*\$?\s*([\d.,]+)/i,
    /SUBTOTAL\s*:?\s*\$?\s*([\d.,]+)/i,
    /\$\s*([\d.,]{4,})/,  // Captura $xxx,xxx
  ];

  /** Patrones para fechas */
  private readonly datePatterns = [
    /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})/,
    /(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/,
    /(\d{1,2}\s+(?:ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sep(?:tiembre)?|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?)\s+\d{2,4})/i,
  ];

  /** Palabras clave a ignorar al buscar el comercio */
  private readonly ignorePatterns = [
    /^NIT/i, /^TEL/i, /^DIR/i, /^FECHA/i, /^HORA/i,
    /^TOTAL/i, /^SUBTOTAL/i, /^\d+$/, /^IVA/i, /^FACTURA/i,
    /^RECIBO/i, /^CONSECUTIVO/i, /^CAJA/i, /^CAJERO/i,
  ];

  /** Parsear texto OCR a datos estructurados */
  parse(rawText: string): OcrResult {
    const amount = this.extractAmount(rawText);
    const date = this.extractDate(rawText);
    const merchant = this.extractMerchant(rawText);

    // Calcular confianza basada en datos extraídos
    let confidence = 0;
    if (amount) confidence += 40;
    if (date) confidence += 30;
    if (merchant) confidence += 30;

    return {
      rawText,
      extractedAmount: amount,
      extractedDate: date,
      extractedMerchant: merchant,
      confidence,
    };
  }

  /** Extraer monto total */
  private extractAmount(text: string): number | null {
    for (const pattern of this.amountPatterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        // Limpiar y convertir: "85.000" → 85000, "85,000.50" → 85000.50
        const cleaned = match[1]
          .replace(/\./g, '')  // Quitar puntos de miles
          .replace(/,/g, '.'); // Coma decimal a punto
        const num = parseFloat(cleaned);
        if (!isNaN(num) && num > 0) {
          return num;
        }
      }
    }
    return null;
  }

  /** Extraer fecha */
  private extractDate(text: string): string | null {
    for (const pattern of this.datePatterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /** Extraer nombre del comercio (primera línea significativa) */
  private extractMerchant(text: string): string | null {
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 3 && l.length < 60);

    for (const line of lines) {
      const shouldIgnore = this.ignorePatterns.some(p => p.test(line));
      if (!shouldIgnore) {
        // Limpiar caracteres especiales
        const cleaned = line
          .replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ\-&.]/g, '')
          .trim();
        if (cleaned.length > 2) {
          return cleaned;
        }
      }
    }
    return null;
  }
}
