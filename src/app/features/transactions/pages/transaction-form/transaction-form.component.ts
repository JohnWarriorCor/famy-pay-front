import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../../core/services/notification.service';
import { Category, TransactionType } from '../../../../core/models';
import { DEFAULT_CATEGORIES } from '../../../../core/constants/app.constants';

interface QuickCategory {
  name: string;
  icon: string;
  color: string;
  id: string;
  type: 'fixedExpense' | 'variableExpense' | 'income';
}

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, InputNumberModule, DatePickerModule,
    SelectModule, TextareaModule, ToggleButtonModule, RippleModule, TagModule
  ],
  template: `
    <div class="tx-form animate-fade-in-up">
      <!-- Header -->
      <div class="form-header">
        <button class="back-btn" routerLink="/transactions" pRipple>
          <i class="pi pi-arrow-left"></i>
        </button>
        <h1>{{ isIncome() ? 'Nuevo Ingreso' : 'Nuevo Gasto' }}</h1>
        <div class="spacer"></div>
      </div>

      <!-- Type Toggle -->
      <div class="type-toggle">
        <button
          class="type-btn"
          [class.active]="!isIncome()"
          [class.expense]="!isIncome()"
          (click)="isIncome.set(false)"
          pRipple
        >
          <i class="pi pi-arrow-down"></i>
          Gasto
        </button>
        <button
          class="type-btn"
          [class.active]="isIncome()"
          [class.income]="isIncome()"
          (click)="isIncome.set(true)"
          pRipple
        >
          <i class="pi pi-arrow-up"></i>
          Ingreso
        </button>
      </div>

      <!-- Amount Input (Big, centered) -->
      <div class="amount-section">
        <span class="currency-prefix">$</span>
        <input
          type="text"
          class="amount-input"
          [(ngModel)]="amountDisplay"
          (input)="onAmountInput($event)"
          placeholder="0"
          inputmode="numeric"
          autofocus
          id="amount-input"
        />
      </div>

      <!-- Quick Categories -->
      <div class="categories-section">
        <label class="section-label">Categoría</label>
        <div class="categories-grid">
          @for (cat of displayCategories(); track cat.id) {
            <button
              class="category-chip"
              [class.selected]="selectedCategory()?.id === cat.id"
              [style.--chip-color]="cat.color"
              (click)="selectCategory(cat)"
              pRipple
            >
              <i [class]="cat.icon"></i>
              <span>{{ cat.name }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Description -->
      <div class="field-group">
        <label for="description" class="section-label">Descripción <span class="optional">(opcional)</span></label>
        <input
          id="description"
          type="text"
          pInputText
          [(ngModel)]="description"
          placeholder="Ej: Supermercado Éxito"
          class="w-full"
        />
      </div>

      <!-- Date -->
      <div class="field-group">
        <label for="date" class="section-label">Fecha</label>
        <p-datepicker
          id="date"
          [(ngModel)]="selectedDate"
          [showIcon]="true"
          [maxDate]="today"
          dateFormat="dd/mm/yy"
          placeholder="Hoy"
          styleClass="w-full"
          [touchUI]="isMobile"
        />
      </div>

      <!-- Expense Type (solo para gastos) -->
      @if (!isIncome()) {
        <div class="field-group">
          <label class="section-label">Tipo de gasto</label>
          <div class="expense-type-toggle">
            <button
              class="etype-btn"
              [class.active]="expenseType() === 'variableExpense'"
              (click)="expenseType.set('variableExpense')"
              pRipple
            >Variable</button>
            <button
              class="etype-btn"
              [class.active]="expenseType() === 'fixedExpense'"
              (click)="expenseType.set('fixedExpense')"
              pRipple
            >Fijo</button>
          </div>
        </div>
      }

      <!-- Scanner Link -->
      <button class="scanner-link" routerLink="/ocr" pRipple>
        <i class="pi pi-camera"></i>
        <span>Escanear recibo con OCR</span>
        <i class="pi pi-arrow-right"></i>
      </button>

      <!-- Submit -->
      <button
        pButton
        class="submit-btn w-full"
        [label]="isIncome() ? 'Registrar Ingreso' : 'Registrar Gasto'"
        [icon]="isIncome() ? 'pi pi-plus' : 'pi pi-minus'"
        [loading]="saving()"
        [disabled]="!amount() || !selectedCategory()"
        (click)="onSave()"
      ></button>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .tx-form {
      max-width: 500px;
      margin: 0 auto;
      @include flex-column;
      gap: $spacing-5;
    }

    .form-header {
      display: flex;
      align-items: center;
      gap: $spacing-3;

      h1 {
        font-size: $font-size-xl;
        font-weight: $font-weight-bold;
        flex: 1;
      }

      .spacer { width: 40px; }
    }

    .back-btn {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-full;
      background: var(--surface-alt);
      border: none;
      cursor: pointer;
      color: var(--text-primary);
      transition: all $transition-fast;

      &:hover {
        background: var(--primary-bg);
        color: var(--primary-color);
      }
    }

    // --- Type Toggle ---
    .type-toggle {
      display: flex;
      gap: $spacing-2;
      background: var(--surface-alt);
      padding: 4px;
      border-radius: $radius-lg;
    }

    .type-btn {
      flex: 1;
      padding: $spacing-3;
      border: none;
      border-radius: $radius-md;
      cursor: pointer;
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-2;
      background: transparent;
      color: var(--text-secondary);
      transition: all $transition-fast;

      &.active.expense {
        background: var(--danger-bg);
        color: var(--danger-color);
        box-shadow: var(--shadow-sm);
      }

      &.active.income {
        background: var(--success-bg);
        color: var(--success-color);
        box-shadow: var(--shadow-sm);
      }
    }

    // --- Amount ---
    .amount-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-2;
      padding: $spacing-6 0;
    }

    .currency-prefix {
      font-size: 2rem;
      font-weight: $font-weight-bold;
      color: var(--text-muted);
    }

    .amount-input {
      font-size: 3rem;
      font-weight: $font-weight-bold;
      color: var(--text-primary);
      background: transparent;
      border: none;
      outline: none;
      text-align: center;
      max-width: 280px;
      font-family: inherit;
      font-variant-numeric: tabular-nums;
      caret-color: var(--primary-color);

      &::placeholder {
        color: var(--text-muted);
      }
    }

    // --- Categories ---
    .section-label {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: var(--text-secondary);
      margin-bottom: $spacing-3;
      display: block;

      .optional {
        color: var(--text-muted);
        font-weight: $font-weight-normal;
      }
    }

    .categories-grid {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
    }

    .category-chip {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-2 $spacing-3;
      border-radius: $radius-full;
      border: 1.5px solid var(--border-color);
      background: var(--surface-color);
      cursor: pointer;
      font-family: inherit;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      color: var(--text-secondary);
      transition: all $transition-fast;
      white-space: nowrap;

      i {
        font-size: 0.85rem;
        color: var(--chip-color, var(--text-muted));
      }

      &:hover {
        border-color: var(--chip-color, var(--primary-color));
        background: color-mix(in srgb, var(--chip-color, var(--primary-color)) 8%, transparent);
      }

      &.selected {
        border-color: var(--chip-color, var(--primary-color));
        background: color-mix(in srgb, var(--chip-color, var(--primary-color)) 12%, transparent);
        color: var(--text-primary);

        i {
          color: var(--chip-color, var(--primary-color));
        }
      }
    }

    // --- Field Group ---
    .field-group {
      @include flex-column;
    }

    // --- Expense Type Toggle ---
    .expense-type-toggle {
      display: flex;
      gap: $spacing-2;
      background: var(--surface-alt);
      padding: 3px;
      border-radius: $radius-md;
    }

    .etype-btn {
      flex: 1;
      padding: $spacing-2 $spacing-3;
      border: none;
      border-radius: $radius-sm;
      cursor: pointer;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      font-family: inherit;
      background: transparent;
      color: var(--text-secondary);
      transition: all $transition-fast;

      &.active {
        background: var(--surface-color);
        color: var(--text-primary);
        box-shadow: var(--shadow-xs);
      }
    }

    // --- Scanner Link ---
    .scanner-link {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-4;
      border-radius: $radius-lg;
      border: 1px dashed var(--border-color);
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      font-size: $font-size-sm;
      color: var(--text-secondary);
      transition: all $transition-fast;

      span { flex: 1; text-align: left; }

      &:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
        background: var(--primary-bg);
      }

      .pi-camera {
        font-size: 1.25rem;
        color: var(--primary-color);
      }

      .pi-arrow-right {
        font-size: 0.85rem;
      }
    }

    // --- Submit ---
    .submit-btn {
      height: 52px !important;
      font-weight: $font-weight-semibold !important;
      font-size: $font-size-base !important;
      border-radius: $radius-lg !important;
      margin-top: $spacing-2;
    }
  `]
})
export class TransactionFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);

  readonly isIncome = signal(false);
  readonly amount = signal(0);
  readonly selectedCategory = signal<QuickCategory | null>(null);
  readonly expenseType = signal<'variableExpense' | 'fixedExpense'>('variableExpense');
  readonly saving = signal(false);

  amountDisplay = '';
  description = '';
  selectedDate: Date = new Date();
  today = new Date();
  isMobile = window.innerWidth < 768;

  // Categorías agrupadas para display rápido
  private readonly allCategories: QuickCategory[] = DEFAULT_CATEGORIES.map((c, i) => ({
    ...c,
    id: `default-${i}`,
    type: c.type as 'fixedExpense' | 'variableExpense' | 'income',
  }));

  readonly displayCategories = () => {
    if (this.isIncome()) {
      return this.allCategories.filter(c => c.type === 'income');
    }
    return this.allCategories.filter(c => c.type !== 'income');
  };

  ngOnInit(): void {
    // Verificar si se pide tipo income desde query params
    const type = this.route.snapshot.queryParams['type'];
    if (type === 'income') {
      this.isIncome.set(true);
    }

    // Autofocus en el input de monto
    setTimeout(() => {
      document.getElementById('amount-input')?.focus();
    }, 300);
  }

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Solo permitir números y formatear
    const raw = input.value.replace(/[^\d]/g, '');
    const num = parseInt(raw, 10) || 0;
    this.amount.set(num);

    // Formatear con separadores de miles
    if (num > 0) {
      this.amountDisplay = num.toLocaleString('es-CO');
    } else {
      this.amountDisplay = '';
    }
  }

  selectCategory(cat: QuickCategory): void {
    this.selectedCategory.set(cat);
  }

  async onSave(): Promise<void> {
    const cat = this.selectedCategory();
    if (!this.amount() || !cat) {
      this.notification.warn('Campos requeridos', 'Ingresa un monto y selecciona una categoría');
      return;
    }

    try {
      this.saving.set(true);

      // TODO: Guardar en Firestore cuando haya un espacio familiar activo
      // Por ahora, simular guardado
      await new Promise(resolve => setTimeout(resolve, 500));

      const type = this.isIncome() ? 'ingreso' : 'gasto';
      this.notification.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} registrado`,
        `$${this.amount().toLocaleString('es-CO')} en ${cat.name}`
      );

      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.notification.error('Error', 'No se pudo registrar la transacción');
    } finally {
      this.saving.set(false);
    }
  }
}
