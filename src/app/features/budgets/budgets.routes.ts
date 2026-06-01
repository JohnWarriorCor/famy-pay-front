import { Routes } from '@angular/router';
import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { BudgetWithAlert, BudgetAlertLevel, Category, Budget, Transaction } from '../../core/models';
import { BUDGET_ALERT_THRESHOLDS } from '../../core/constants/app.constants';
import { FamilySpaceService } from '../family-space/services/family-space.service';
import { BudgetService } from './services/budget.service';
import { CategoryService } from '../transactions/services/category.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { NotificationService } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputNumberModule, SelectModule, DialogModule,
    ProgressBarModule, CardModule, TagModule, RippleModule, CurrencyFormatPipe,
  ],
  template: `
    <div class="budgets-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Presupuestos</h1>
          <p class="page-subtitle">Controla tus gastos por categoría • {{ currentMonth }}</p>
        </div>
        <button pButton icon="pi pi-plus" label="Nuevo" (click)="openAddDialog()" [disabled]="!activeSpace()"></button>
      </div>

      <!-- Summary -->
      @if (activeSpace()) {
        <div class="summary-cards">
          <div class="summary-card">
            <span class="summary-label">Presupuesto Total</span>
            <span class="summary-value currency">{{ totalBudget() | currencyFormat }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-label">Gastado</span>
            <span class="summary-value currency expense-color">{{ totalSpent() | currencyFormat }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-label">Disponible</span>
            <span class="summary-value currency" [class.income-color]="totalAvailable() > 0" [class.expense-color]="totalAvailable() <= 0">{{ totalAvailable() | currencyFormat }}</span>
          </div>
        </div>

        <!-- Budget List -->
        @if (budgets().length > 0) {
          <div class="budgets-grid stagger-children">
            @for (budget of budgets(); track budget.id) {
              <div class="budget-card" [class]="'alert-' + budget.alertLevel">
                <div class="budget-header">
                  <div class="budget-category">
                    <span class="budget-name">{{ budget.categoryName }}</span>
                    <div class="flex gap-2 align-items-center mt-1">
                      <p-tag
                        [value]="getAlertLabel(budget.alertLevel)"
                        [severity]="getAlertSeverity(budget.alertLevel)"
                        [rounded]="true"
                      />
                      <button 
                        pButton 
                        icon="pi pi-trash" 
                        [text]="true" 
                        class="p-button-danger p-button-sm p-0 ml-2" 
                        style="height: 18px; width: 18px;"
                        (click)="deleteBudget(budget.id)"
                        title="Eliminar Presupuesto"
                      ></button>
                    </div>
                  </div>
                  <span class="budget-percentage number-display">{{ budget.percentage | number:'1.0-0' }}%</span>
                </div>

                <p-progressBar
                  [value]="Math.min(budget.percentage, 100)"
                  [showValue]="false"
                  [styleClass]="'budget-progress progress-' + budget.alertLevel"
                />

                <div class="budget-footer">
                  <span class="budget-spent currency-sm">{{ budget.spent | currencyFormat }} gastado</span>
                  <span class="budget-limit currency-sm">de {{ budget.limit | currencyFormat }}</span>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <p class="empty-state-title">Sin presupuestos</p>
            <p class="empty-state-text">Crea presupuestos mensuales para controlar tus gastos por categoría</p>
            <button pButton label="Crear Presupuesto" icon="pi pi-plus" class="mt-3" (click)="openAddDialog()"></button>
          </div>
        }
      } @else {
        <div class="empty-state">
          <div class="empty-state-icon">👨‍👩‍👧‍👦</div>
          <p class="empty-state-title">Sin Espacio Familiar</p>
          <p class="empty-state-text">Crea o únete a un espacio familiar en la configuración de la familia para gestionar presupuestos.</p>
        </div>
      }

      <!-- Add Dialog -->
      <p-dialog header="Nuevo Presupuesto" [(visible)]="showAddDialog" [modal]="true" [style]="{ width: '460px', maxWidth: '90vw' }">
        <div class="dialog-form">
          <div class="form-field">
            <label>Categoría</label>
            <p-select
              [(ngModel)]="selectedCategoryId"
              [options]="categoryOptions()"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona una categoría"
              styleClass="w-full"
              appendTo="body"
            />
          </div>
          <div class="form-field">
            <label>Límite mensual</label>
            <p-inputNumber
              [(ngModel)]="budgetLimit"
              mode="currency"
              currency="COP"
              locale="es-CO"
              [minFractionDigits]="0"
              [maxFractionDigits]="0"
              styleClass="w-full"
              placeholder="$0"
            />
          </div>
        </div>
        <ng-template #footer>
          <button pButton label="Cancelar" [text]="true" (click)="showAddDialog.set(false)"></button>
          <button pButton label="Crear" icon="pi pi-check" [disabled]="!selectedCategoryId || !budgetLimit" (click)="addBudget()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .budgets-page { @include flex-column; gap: $spacing-6; max-width: 800px; margin: 0 auto; }

    .page-header { @include flex-between; flex-wrap: wrap; gap: $spacing-3; }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-3;

      @include mobile-only { grid-template-columns: 1fr; }
    }

    .summary-card {
      @include card($spacing-4);
      @include flex-column;
      gap: $spacing-1;
      text-align: center;
    }

    .summary-label { font-size: $font-size-xs; color: var(--text-secondary); font-weight: $font-weight-medium; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-value { font-size: $font-size-xl; font-weight: $font-weight-bold; }

    .budgets-grid { @include flex-column; gap: $spacing-4; }

    .budget-card {
      @include card($spacing-5);
      @include flex-column;
      gap: $spacing-3;
      transition: all $transition-fast;

      &.alert-normal { border-left: 3px solid var(--success-color); }
      &.alert-warning { border-left: 3px solid var(--warning-color); }
      &.alert-critical { border-left: 3px solid var(--danger-color); background: color-mix(in srgb, var(--danger-color) 8%, var(--surface-color)); }
      &.alert-exceeded { border-left: 3px solid var(--danger-color); background: color-mix(in srgb, var(--danger-color) 12%, var(--surface-color)); }
    }

    .budget-header { @include flex-between; }
    .budget-category { @include flex-column; gap: $spacing-1; }
    .budget-name { font-weight: $font-weight-semibold; }
    .budget-percentage { font-size: $font-size-xl; font-weight: $font-weight-bold; }
    .budget-footer { @include flex-between; }
    .budget-spent { color: var(--text-secondary); }
    .budget-limit { color: var(--text-muted); }

    .dialog-form { @include flex-column; gap: $spacing-4; padding: $spacing-2 0; }
    .form-field { @include flex-column; gap: $spacing-2;
      label { font-size: $font-size-sm; font-weight: $font-weight-medium; color: var(--text-secondary); }
    }

    :host ::ng-deep {
      .budget-progress .p-progressbar { height: 8px !important; border-radius: $radius-full !important;
        background: var(--surface-alt) !important;
      }
      .progress-normal .p-progressbar-value { background: var(--success-color) !important; border-radius: $radius-full !important; }
      .progress-warning .p-progressbar-value { background: var(--warning-color) !important; border-radius: $radius-full !important; }
      .progress-critical .p-progressbar-value { background: var(--danger-color) !important; border-radius: $radius-full !important; }
      .progress-exceeded .p-progressbar-value { background: var(--danger-color) !important; border-radius: $radius-full !important; }
    }
  `]
})
export class BudgetsPage implements OnInit, OnDestroy {
  readonly Math = Math;

  private familyService = inject(FamilySpaceService);
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private transactionService = inject(TransactionService);
  private notification = inject(NotificationService);

  readonly activeSpace = this.familyService.activeSpace;

  showAddDialog = signal(false);
  selectedCategoryId = '';
  budgetLimit: number | null = null;

  currentMonth = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  private readonly monthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  /** Lista de presupuestos combinados con gastos en tiempo real y alertas */
  readonly budgets = computed<BudgetWithAlert[]>(() => {
    const rawBudgets = this.budgetService.budgets();
    const transactions = this.transactionService.transactions();

    // 1. Filtrar transacciones del mes actual de tipo gasto
    const currentMonthExpenses = transactions.filter(tx => {
      if (tx.type === 'income' || tx.type === 'transfer') return false;
      const txDate = new Date(tx.date);
      const txMonthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      return txMonthKey === this.monthKey;
    });

    // 2. Agrupar gastos por categoría
    const spentByCategoryMap = new Map<string, number>();
    currentMonthExpenses.forEach(tx => {
      const current = spentByCategoryMap.get(tx.categoryId) || 0;
      spentByCategoryMap.set(tx.categoryId, current + tx.amount);
    });

    // 3. Mapear presupuestos y calcular alertas
    return rawBudgets.map(b => {
      const spent = spentByCategoryMap.get(b.categoryId) || 0;
      const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;

      let alertLevel: BudgetAlertLevel = 'normal';
      if (percentage >= 120) {
        alertLevel = 'exceeded';
      } else if (percentage >= 100) {
        alertLevel = 'critical';
      } else if (percentage >= 80) {
        alertLevel = 'warning';
      }

      return {
        ...b,
        spent,
        percentage,
        alertLevel
      };
    });
  });

  // Opciones de categorías de gastos (excluyendo ingresos)
  readonly categoryOptions = computed(() => {
    const expenseCategories = this.categoryService.expenseCategories();
    return expenseCategories.map(cat => ({
      label: cat.name,
      value: cat.id
    }));
  });

  readonly totalBudget = () => this.budgets().reduce((sum, b) => sum + b.limit, 0);
  readonly totalSpent = () => this.budgets().reduce((sum, b) => sum + b.spent, 0);
  readonly totalAvailable = () => this.totalBudget() - this.totalSpent();

  ngOnInit(): void {
    const space = this.activeSpace();
    if (space) {
      this.initListeners(space.id);
    }
  }

  ngOnDestroy(): void {
    this.budgetService.destroy();
  }

  private initListeners(spaceId: string): void {
    this.budgetService.listenToBudgets(spaceId, this.monthKey);
    this.transactionService.listenToTransactions(spaceId);
  }

  openAddDialog(): void {
    this.selectedCategoryId = '';
    this.budgetLimit = null;
    this.showAddDialog.set(true);
  }

  async addBudget(): Promise<void> {
    const space = this.activeSpace();
    if (!space) {
      this.notification.error('Error', 'No hay un espacio familiar activo');
      return;
    }

    const catId = this.selectedCategoryId;
    const limitAmount = this.budgetLimit;

    if (!catId || !limitAmount) return;

    // Buscar nombre de la categoría
    const cat = this.categoryService.getCategoryById(catId);
    const categoryName = cat ? cat.name : 'Categoría';

    try {
      this.showAddDialog.set(false);
      await this.budgetService.setBudget(space.id, {
        categoryId: catId,
        categoryName,
        limit: limitAmount,
        month: this.monthKey
      });
      this.notification.success('Presupuesto creado', `Presupuesto de ${categoryName} establecido en $${limitAmount.toLocaleString('es-CO')}`);
    } catch (e: any) {
      this.notification.error('Error al crear presupuesto', e.message);
    }
  }

  async deleteBudget(budgetId: string): Promise<void> {
    const space = this.activeSpace();
    if (!space) return;

    try {
      await this.budgetService.deleteBudget(space.id, budgetId);
      this.notification.success('Presupuesto eliminado', 'El presupuesto se quitó correctamente');
    } catch (e: any) {
      this.notification.error('Error al eliminar presupuesto', e.message);
    }
  }

  getAlertLabel(level: BudgetAlertLevel): string {
    const labels: Record<BudgetAlertLevel, string> = {
      normal: 'Normal', warning: 'Alerta', critical: 'Crítico', exceeded: '¡Superado!'
    };
    return labels[level];
  }

  getAlertSeverity(level: BudgetAlertLevel): 'success' | 'warn' | 'danger' | 'info' {
    const map: Record<BudgetAlertLevel, 'success' | 'warn' | 'danger' | 'info'> = {
      normal: 'success', warning: 'warn', critical: 'danger', exceeded: 'danger'
    };
    return map[level];
  }
}

export const BUDGETS_ROUTES: Routes = [
  { path: '', component: BudgetsPage, title: 'Presupuestos — FamyPay' }
];
