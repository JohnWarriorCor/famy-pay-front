import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { RelativeDatePipe } from '../../../../shared/pipes/relative-date.pipe';
import { AuthService } from '../../../../core/services/firebase/auth.service';
import { FirestoreService } from '../../../../core/services/firebase/firestore.service';
import { Transaction, DashboardSummary } from '../../../../core/models';
import { orderBy, limit, Unsubscribe } from 'firebase/firestore';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, CardModule, ButtonModule,
    TagModule, ProgressBarModule, SkeletonModule,
    CurrencyFormatPipe, RelativeDatePipe
  ],
  template: `
    <div class="dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">
          Hola, {{ userName() }} 👋
        </h1>
        <p class="page-subtitle">Resumen financiero de tu familia</p>
      </div>

      <!-- Balance Card -->
      <div class="balance-card animate-fade-in-up">
        <div class="balance-card-bg"></div>
        <div class="balance-content">
          <span class="balance-label">Balance Actual</span>
          <div class="balance-amount currency-lg">
            {{ summary().balance | currencyFormat }}
          </div>
          <div class="balance-details">
            <div class="balance-detail income">
              <i class="pi pi-arrow-up"></i>
              <span>{{ summary().totalIncome | currencyFormat }}</span>
            </div>
            <div class="balance-separator"></div>
            <div class="balance-detail expense">
              <i class="pi pi-arrow-down"></i>
              <span>{{ (summary().totalFixedExpenses + summary().totalVariableExpenses) | currencyFormat }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid stagger-children">
        <!-- Money Age -->
        <div class="metric-card" [class]="'money-age-' + summary().moneyAgeLevel">
          <div class="metric-icon">⏳</div>
          <div class="metric-info">
            <span class="metric-value number-display">{{ summary().moneyAge }} días</span>
            <span class="metric-label">Edad del Dinero</span>
          </div>
          <p-tag
            [value]="moneyAgeLabel()"
            [severity]="moneyAgeSeverity()"
            [rounded]="true"
          />
        </div>

        <!-- Budget -->
        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-info">
            <span class="metric-value number-display">{{ summary().budgetConsumedPercentage | number:'1.0-0' }}%</span>
            <span class="metric-label">Presupuesto Usado</span>
          </div>
          <p-progressBar
            [value]="summary().budgetConsumedPercentage"
            [showValue]="false"
            styleClass="budget-bar"
          />
        </div>

        <!-- Savings -->
        <div class="metric-card">
          <div class="metric-icon">🎯</div>
          <div class="metric-info">
            <span class="metric-value number-display">{{ summary().savingsProgress | number:'1.0-0' }}%</span>
            <span class="metric-label">Metas de Ahorro</span>
          </div>
          <p-progressBar
            [value]="summary().savingsProgress"
            [showValue]="false"
            styleClass="savings-bar"
          />
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div class="actions-grid">
          <button class="action-btn" routerLink="/transactions/new" pRipple>
            <div class="action-icon expense-bg"><i class="pi pi-minus"></i></div>
            <span>Gasto</span>
          </button>
          <button class="action-btn" routerLink="/transactions/new" [queryParams]="{ type: 'income' }" pRipple>
            <div class="action-icon income-bg"><i class="pi pi-plus"></i></div>
            <span>Ingreso</span>
          </button>
          <button class="action-btn" routerLink="/ocr" pRipple>
            <div class="action-icon" style="background: var(--info-bg)"><i class="pi pi-camera" style="color: var(--info-color)"></i></div>
            <span>Scanner</span>
          </button>
          <button class="action-btn" routerLink="/reports" pRipple>
            <div class="action-icon" style="background: var(--primary-bg)"><i class="pi pi-file-pdf" style="color: var(--primary-color)"></i></div>
            <span>Reporte</span>
          </button>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="recent-section animate-fade-in">
        <div class="section-header">
          <h3>Últimas Transacciones</h3>
          <a routerLink="/transactions" class="see-all">Ver todas <i class="pi pi-arrow-right"></i></a>
        </div>

        @if (recentTransactions().length > 0) {
          <div class="transactions-list">
            @for (tx of recentTransactions(); track tx.id) {
              <div class="transaction-item">
                <div class="tx-icon" [style.background]="getCategoryBg(tx.type)">
                  <i class="pi" [class]="getCategoryIcon(tx.type)"></i>
                </div>
                <div class="tx-info">
                  <span class="tx-description">{{ tx.description || tx.categoryName }}</span>
                  <span class="tx-meta">{{ tx.userName }} · {{ tx.date | relativeDate }}</span>
                </div>
                <span class="tx-amount currency" [class.income-color]="tx.type === 'income'" [class.expense-color]="tx.type !== 'income'">
                  {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount | currencyFormat }}
                </span>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <p class="empty-state-title">Sin transacciones aún</p>
            <p class="empty-state-text">Registra tu primer gasto para comenzar a ver tu historial</p>
            <button pButton label="Registrar Gasto" icon="pi pi-plus" routerLink="/transactions/new" class="mt-3"></button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .dashboard {
      @include flex-column;
      gap: $spacing-6;
    }

    // --- Balance Card ---
    .balance-card {
      position: relative;
      border-radius: $radius-xl;
      padding: $spacing-8;
      overflow: hidden;
      color: white;

      @include mobile-only {
        padding: $spacing-6;
        border-radius: $radius-lg;
      }
    }

    .balance-card-bg {
      position: absolute;
      inset: 0;
      @include gradient-hero;
      z-index: 0;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      }
    }

    .balance-content {
      position: relative;
      z-index: 1;
    }

    .balance-label {
      font-size: $font-size-sm;
      opacity: 0.85;
      font-weight: $font-weight-medium;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .balance-amount {
      margin: $spacing-2 0 $spacing-4;
      font-size: 2.5rem;
      font-weight: $font-weight-bold;
      letter-spacing: -0.02em;

      @include mobile-only {
        font-size: 2rem;
      }
    }

    .balance-details {
      display: flex;
      align-items: center;
      gap: $spacing-4;
    }

    .balance-detail {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;

      i {
        width: 24px;
        height: 24px;
        border-radius: $radius-full;
        @include flex-center;
        font-size: 0.75rem;
      }

      &.income i { background: rgba(74, 222, 128, 0.3); }
      &.expense i { background: rgba(248, 113, 113, 0.3); }
    }

    .balance-separator {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.2);
    }

    // --- Metrics Grid ---
    .metrics-grid {
      display: grid;
      gap: $spacing-4;
      grid-template-columns: 1fr;

      @include md { grid-template-columns: repeat(3, 1fr); }
    }

    .metric-card {
      @include card;
      display: flex;
      align-items: center;
      gap: $spacing-4;
      padding: $spacing-5;
    }

    .metric-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
    }

    .metric-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-value {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: var(--text-primary);
    }

    .metric-label {
      font-size: $font-size-xs;
      color: var(--text-secondary);
      font-weight: $font-weight-medium;
    }

    // --- Quick Actions ---
    .quick-actions {
      h3 {
        font-size: $font-size-lg;
        margin-bottom: $spacing-4;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: $spacing-3;

      @include mobile-only {
        grid-template-columns: repeat(4, 1fr);
        gap: $spacing-2;
      }
    }

    .action-btn {
      @include flex-center;
      @include flex-column;
      gap: $spacing-2;
      padding: $spacing-4;
      border-radius: $radius-lg;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: all $transition-fast;
      font-family: inherit;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      span {
        font-size: $font-size-xs;
        font-weight: $font-weight-medium;
        color: var(--text-secondary);
      }
    }

    .action-icon {
      @include flex-center;
      width: 44px;
      height: 44px;
      border-radius: $radius-lg;

      i { font-size: 1.15rem; }

      &.income-bg {
        background: var(--success-bg);
        i { color: var(--success-color); }
      }

      &.expense-bg {
        background: var(--danger-bg);
        i { color: var(--danger-color); }
      }
    }

    // --- Recent Transactions ---
    .recent-section {
      @include card;
    }

    .section-header {
      @include flex-between;
      margin-bottom: $spacing-4;

      h3 {
        font-size: $font-size-lg;
      }
    }

    .see-all {
      font-size: $font-size-sm;
      color: var(--primary-color);
      font-weight: $font-weight-medium;
      display: flex;
      align-items: center;
      gap: $spacing-1;
      text-decoration: none;

      &:hover { text-decoration: underline; }
    }

    .transactions-list {
      @include flex-column;
    }

    .transaction-item {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-3 0;
      border-bottom: 1px solid var(--divider-color);

      &:last-child { border-bottom: none; }
    }

    .tx-icon {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-lg;
      flex-shrink: 0;

      i {
        font-size: 1rem;
        color: var(--text-primary);
      }
    }

    .tx-info {
      flex: 1;
      @include flex-column;
      gap: 2px;
      min-width: 0;
    }

    .tx-description {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      @include truncate;
    }

    .tx-meta {
      font-size: $font-size-xs;
      color: var(--text-muted);
    }

    .tx-amount {
      font-weight: $font-weight-semibold;
      font-size: $font-size-sm;
      white-space: nowrap;
    }

    :host ::ng-deep {
      .budget-bar .p-progressbar {
        height: 6px !important;
        border-radius: $radius-full !important;
        background: var(--surface-alt) !important;

        .p-progressbar-value {
          border-radius: $radius-full !important;
          background: var(--primary-color) !important;
        }
      }

      .savings-bar .p-progressbar {
        height: 6px !important;
        border-radius: $radius-full !important;
        background: var(--surface-alt) !important;

        .p-progressbar-value {
          border-radius: $radius-full !important;
          background: var(--accent-color) !important;
        }
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  private unsubscribe?: Unsubscribe;

  readonly userName = computed(() => {
    const user = this.authService.currentUser();
    return user?.displayName?.split(' ')[0] || 'Usuario';
  });

  readonly summary = signal<DashboardSummary>({
    totalIncome: 3200000,
    totalFixedExpenses: 450000,
    totalVariableExpenses: 300000,
    balance: 2450000,
    moneyAge: 23,
    moneyAgeLevel: 'healthy',
    budgetConsumedPercentage: 62,
    savingsProgress: 45,
  });

  readonly recentTransactions = signal<Transaction[]>([
    {
      id: '1', type: 'variableExpense', amount: 85000, categoryId: '1', categoryName: 'Alimentación',
      description: 'Supermercado Éxito', userId: '1', userName: 'Juan',
      date: new Date(), createdAt: new Date(), receiptOcrText: null, isRecurring: false, status: 'confirmed'
    },
    {
      id: '2', type: 'variableExpense', amount: 60000, categoryId: '2', categoryName: 'Transporte',
      description: 'Gasolina', userId: '1', userName: 'María',
      date: new Date(Date.now() - 86400000), createdAt: new Date(), receiptOcrText: null, isRecurring: false, status: 'confirmed'
    },
    {
      id: '3', type: 'income', amount: 3200000, categoryId: '3', categoryName: 'Salario',
      description: 'Salario Junio', userId: '1', userName: 'Juan',
      date: new Date(Date.now() - 172800000), createdAt: new Date(), receiptOcrText: null, isRecurring: true, status: 'confirmed'
    },
    {
      id: '4', type: 'fixedExpense', amount: 150000, categoryId: '4', categoryName: 'Servicios',
      description: 'Electricidad', userId: '1', userName: 'Juan',
      date: new Date(Date.now() - 259200000), createdAt: new Date(), receiptOcrText: null, isRecurring: true, status: 'confirmed'
    },
  ]);

  readonly moneyAgeLabel = computed(() => {
    const level = this.summary().moneyAgeLevel;
    const labels: Record<string, string> = {
      critical: 'Crítico', alert: 'Alerta', healthy: 'Saludable', excellent: 'Excelente'
    };
    return labels[level] || 'N/A';
  });

  readonly moneyAgeSeverity = computed(() => {
    const level = this.summary().moneyAgeLevel;
    const map: Record<string, 'danger' | 'warn' | 'success' | 'info'> = {
      critical: 'danger', alert: 'warn', healthy: 'success', excellent: 'info'
    };
    return map[level] || 'info';
  });

  ngOnInit(): void {
    // TODO: Cargar datos reales cuando se tenga un espacio familiar activo
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  getCategoryBg(type: string): string {
    const colors: Record<string, string> = {
      income: 'var(--success-bg)',
      fixedExpense: 'var(--danger-bg)',
      variableExpense: 'var(--warning-bg)',
      transfer: 'var(--info-bg)',
    };
    return colors[type] || 'var(--surface-alt)';
  }

  getCategoryIcon(type: string): string {
    const icons: Record<string, string> = {
      income: 'pi-arrow-up',
      fixedExpense: 'pi-home',
      variableExpense: 'pi-shopping-cart',
      transfer: 'pi-arrows-h',
    };
    return icons[type] || 'pi-circle';
  }
}
