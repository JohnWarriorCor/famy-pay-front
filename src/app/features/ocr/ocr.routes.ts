import { Routes } from '@angular/router';
import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { OcrService } from './services/ocr.service';
import { ReceiptParserService } from './services/receipt-parser.service';
import { IndexedDbService } from '../../core/services/storage/indexeddb.service';
import { NotificationService } from '../../core/services/notification.service';
import { OcrResult } from '../../core/models';
import { FamilySpaceService } from '../family-space/services/family-space.service';
import { GamificationService } from '../gamification/services/gamification.service';

@Component({
  selector: 'app-ocr-scan',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, InputNumberModule,
    ProgressBarModule, CardModule, RippleModule, TagModule,
  ],
  template: `
    <div class="ocr-page animate-fade-in">
      <div class="page-header">
        <h1 class="page-title">Scanner OCR</h1>
        <p class="page-subtitle">Escanea tus recibos con reconocimiento óptico</p>
      </div>

      <!-- Upload Area -->
      @if (!imagePreviewUrl()) {
        <div
          class="upload-area"
          [class.dragover]="isDragOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave()"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
          role="button"
          tabindex="0"
          (keydown.enter)="fileInput.click()"
        >
          <div class="upload-icon">📸</div>
          <h3>Sube una imagen de tu recibo</h3>
          <p>Arrastra y suelta o haz clic para seleccionar</p>
          <p class="upload-formats">JPG, PNG, WebP — máx 10MB</p>
          <input
            #fileInput
            type="file"
            accept="image/jpeg,image/png,image/webp"
            (change)="onFileSelected($event)"
            hidden
          />
        </div>
      }

      <!-- Image Preview + Processing -->
      @if (imagePreviewUrl()) {
        <div class="preview-section animate-fade-in-scale">
          <div class="preview-header">
            <h3>Imagen cargada</h3>
            <button pButton [text]="true" icon="pi pi-times" severity="secondary" (click)="clearImage()" label="Limpiar"></button>
          </div>

          <div class="preview-image-wrapper">
            <img [src]="imagePreviewUrl()" alt="Preview del recibo" class="preview-image" />
          </div>

          <!-- Processing -->
          @if (ocrService.isProcessing()) {
            <div class="processing-section animate-fade-in">
              <div class="processing-label">
                <i class="pi pi-spin pi-spinner"></i>
                <span>Procesando imagen...</span>
                <span class="processing-pct">{{ ocrService.progress() }}%</span>
              </div>
              <p-progressBar [value]="ocrService.progress()" [showValue]="false" styleClass="ocr-progress" />
            </div>
          }

          <!-- Process Button -->
          @if (!ocrService.isProcessing() && !ocrResult()) {
            <button
              pButton
              label="Procesar con OCR"
              icon="pi pi-search"
              class="w-full process-btn"
              (click)="processImage()"
            ></button>
          }
        </div>
      }

      <!-- OCR Error -->
      @if (ocrService.error(); as error) {
        <div class="ocr-error animate-shake">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>
      }

      <!-- Results Form -->
      @if (ocrResult(); as result) {
        <div class="results-section animate-fade-in-up">
          <div class="results-header">
            <h3>Datos Extraídos</h3>
            <p-tag
              [value]="'Confianza: ' + result.confidence + '%'"
              [severity]="result.confidence > 60 ? 'success' : result.confidence > 30 ? 'warn' : 'danger'"
              [rounded]="true"
            />
          </div>

          <div class="results-form">
            <div class="form-field">
              <label>Comercio</label>
              <input pInputText [(ngModel)]="editMerchant" placeholder="Nombre del comercio" class="w-full" />
            </div>

            <div class="form-field">
              <label>Monto Total</label>
              <p-inputNumber
                [(ngModel)]="editAmount"
                mode="currency"
                currency="COP"
                locale="es-CO"
                placeholder="0"
                styleClass="w-full"
                [minFractionDigits]="0"
                [maxFractionDigits]="0"
              />
            </div>

            <div class="form-field">
              <label>Fecha</label>
              <input pInputText [(ngModel)]="editDate" placeholder="DD/MM/YYYY" class="w-full" />
            </div>

            <!-- Raw text (collapsible) -->
            <details class="raw-text-section">
              <summary>Ver texto completo</summary>
              <pre class="raw-text">{{ result.rawText }}</pre>
            </details>

            <div class="results-actions">
              <button
                pButton
                label="Registrar como gasto"
                icon="pi pi-check"
                class="w-full"
                (click)="saveAsTransaction()"
              ></button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .ocr-page {
      max-width: 600px;
      margin: 0 auto;
      @include flex-column;
      gap: $spacing-6;
    }

    // --- Upload Area ---
    .upload-area {
      @include flex-center;
      @include flex-column;
      gap: $spacing-3;
      padding: $spacing-12 $spacing-6;
      border: 2px dashed var(--border-color);
      border-radius: $radius-xl;
      cursor: pointer;
      transition: all $transition-base;
      text-align: center;
      background: var(--surface-color);

      &:hover, &.dragover {
        border-color: var(--primary-color);
        background: var(--primary-bg);
      }

      &.dragover {
        transform: scale(1.02);
      }

      .upload-icon { font-size: 3rem; margin-bottom: $spacing-2; }
      h3 { font-size: $font-size-lg; font-weight: $font-weight-semibold; }
      p { color: var(--text-secondary); font-size: $font-size-sm; }
      .upload-formats { color: var(--text-muted); font-size: $font-size-xs; }
    }

    // --- Preview ---
    .preview-section {
      @include card;
      @include flex-column;
      gap: $spacing-4;
    }

    .preview-header {
      @include flex-between;
      h3 { font-size: $font-size-lg; font-weight: $font-weight-semibold; }
    }

    .preview-image-wrapper {
      border-radius: $radius-lg;
      overflow: hidden;
      background: var(--surface-alt);
      max-height: 300px;
      @include flex-center;
    }

    .preview-image {
      max-width: 100%;
      max-height: 300px;
      object-fit: contain;
    }

    // --- Processing ---
    .processing-section {
      @include flex-column;
      gap: $spacing-2;
    }

    .processing-label {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-sm;
      color: var(--text-secondary);

      .processing-pct {
        margin-left: auto;
        font-weight: $font-weight-semibold;
        color: var(--primary-color);
      }
    }

    .process-btn {
      @include gradient-primary;
      border: none !important;
      height: 48px !important;
      font-weight: $font-weight-semibold !important;
      border-radius: $radius-md !important;
    }

    // --- Error ---
    .ocr-error {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-3 $spacing-4;
      background: var(--danger-bg);
      color: var(--danger-color);
      border-radius: $radius-md;
      font-size: $font-size-sm;
    }

    // --- Results ---
    .results-section {
      @include card;
      @include flex-column;
      gap: $spacing-4;
    }

    .results-header {
      @include flex-between;
      h3 { font-size: $font-size-lg; font-weight: $font-weight-semibold; }
    }

    .results-form {
      @include flex-column;
      gap: $spacing-4;
    }

    .form-field {
      @include flex-column;
      gap: $spacing-2;

      label {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: var(--text-secondary);
      }
    }

    .raw-text-section {
      summary {
        cursor: pointer;
        font-size: $font-size-sm;
        color: var(--primary-color);
        font-weight: $font-weight-medium;
        padding: $spacing-2 0;
      }
    }

    .raw-text {
      background: var(--surface-alt);
      padding: $spacing-4;
      border-radius: $radius-md;
      font-size: $font-size-xs;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
      color: var(--text-secondary);
      @include scrollbar-thin;
    }

    :host ::ng-deep .ocr-progress .p-progressbar {
      height: 8px !important;
      border-radius: $radius-full !important;
      .p-progressbar-value {
        border-radius: $radius-full !important;
        @include gradient-primary;
      }
    }
  `]
})
export class OcrScanComponent {
  readonly ocrService = inject(OcrService);
  private receiptParser = inject(ReceiptParserService);
  private indexedDb = inject(IndexedDbService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private familyService = inject(FamilySpaceService);
  private gamificationService = inject(GamificationService);

  readonly imagePreviewUrl = signal<string | null>(null);
  readonly isDragOver = signal(false);
  readonly ocrResult = signal<OcrResult | null>(null);

  private selectedFile: File | null = null;

  // Editable fields
  editMerchant = '';
  editAmount: number | null = null;
  editDate = '';

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.loadFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.loadFile(file);
    }
  }

  private loadFile(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.notification.warn('Archivo muy grande', 'El tamaño máximo es 10MB');
      return;
    }

    this.selectedFile = file;
    const url = URL.createObjectURL(file);
    this.imagePreviewUrl.set(url);
    this.ocrResult.set(null);
    this.ocrService.reset();
  }

  async processImage(): Promise<void> {
    if (!this.selectedFile) return;

    try {
      const rawText = await this.ocrService.processImage(this.selectedFile);
      const result = this.receiptParser.parse(rawText);
      this.ocrResult.set(result);

      // Pre-llenar campos editables
      this.editMerchant = result.extractedMerchant || '';
      this.editAmount = result.extractedAmount;
      this.editDate = result.extractedDate || '';

      this.notification.success('OCR completado', `Confianza: ${result.confidence}%`);
    } catch {
      // Error ya manejado por ocrService
    }
  }

  clearImage(): void {
    if (this.imagePreviewUrl()) {
      URL.revokeObjectURL(this.imagePreviewUrl()!);
    }
    this.imagePreviewUrl.set(null);
    this.selectedFile = null;
    this.ocrResult.set(null);
    this.ocrService.reset();
  }

  async saveAsTransaction(): Promise<void> {
    // Guardar imagen en IndexedDB
    if (this.selectedFile) {
      await this.indexedDb.saveReceipt('temp-' + Date.now(), this.selectedFile);
    }

    // Disparar logro first_ocr
    const space = this.familyService.activeSpace();
    if (space) {
      this.gamificationService.unlockAchievement(space.id, 'first_ocr').catch(() => {});
    }

    this.notification.success('Recibo escaneado', 'Redirigiendo al formulario de gasto');

    // Navegar al formulario con datos pre-llenados
    this.router.navigate(['/transactions/new'], {
      queryParams: {
        amount: this.editAmount,
        description: this.editMerchant,
        ocrText: this.ocrResult()?.rawText?.substring(0, 500),
      }
    });
  }
}

export const OCR_ROUTES: Routes = [
  {
    path: '',
    component: OcrScanComponent,
    title: 'Scanner OCR — FamyPay',
  },
];
