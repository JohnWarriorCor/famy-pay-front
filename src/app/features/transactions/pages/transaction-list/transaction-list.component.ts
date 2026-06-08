import { Component, signal, computed, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { RelativeDatePipe } from '../../../../shared/pipes/relative-date.pipe';
import { Transaction, TransactionType } from '../../../../core/models';
import { TransactionService } from '../../services/transaction.service';
import { FamilySpaceService } from '../../../family-space/services/family-space.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, SelectModule, TagModule,
    RippleModule, CurrencyFormatPipe, RelativeDatePipe
  ],
  template: `
    <div class="tx-list-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Transacciones</h1>
          <p class="page-subtitle">{{ filteredTransactions().length }} registros</p>
        </div>
        <button pButton label="Nuevo" icon="pi pi-plus" routerLink="/transactions/new"></button>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <i class="pi pi-search"></i>
          <input
            type="text"
            pInputText
            [(ngModel)]="searchTerm"
            placeholder="Buscar transacción..."
            class="search-input"
          />
        </div>
        <p-select
          [(ngModel)]="typeFilter"
          [options]="typeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Tipo"
          [showClear]="true"
          styleClass="type-filter"
        />
      </div>

      <!-- Transactions -->
      @if (loading()) {
        <div class="loading-state animate-fade-in">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--primary-color);"></i>
          <p class="mt-2">Cargando transacciones...</p>
        </div>
      } @else if (filteredTransactions().length > 0) {
        <!-- Group by date -->
        @for (group of groupedTransactions(); track group.label) {
          <div class="date-group">
            <span class="date-label">{{ group.label }}</span>
            <span class="date-total currency-sm" [class.income-color]="group.total > 0" [class.expense-color]="group.total < 0">
              {{ group.total > 0 ? '+' : '' }}{{ group.total | currencyFormat }}
            </span>
          </div>
          @for (tx of group.transactions; track tx.id) {
            <div class="transaction-row" pRipple>
              <div class="tx-icon" [style.background]="getCategoryBg(tx.type)">
                <i class="pi" [class]="getCategoryIcon(tx.type)"></i>
              </div>
              <div class="tx-details">
                <span class="tx-desc">{{ tx.description || tx.categoryName }}</span>
                <span class="tx-meta">{{ tx.categoryName }} · {{ tx.userName }}</span>
              </div>
              <div class="tx-right">
                <span class="tx-amount" [class.income-color]="tx.type === 'income'" [class.expense-color]="tx.type !== 'income'">
                  {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount | currencyFormat }}
                </span>
                <span class="tx-time">{{ tx.date | relativeDate }}</span>
              </div>
            </div>
          }
        }
      } @else {
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p class="empty-state-title">Sin resultados</p>
          <p class="empty-state-text">{{ searchTerm || typeFilter ? 'Prueba con otros filtros' : 'Registra tu primera transacción' }}</p>
          @if (!searchTerm && !typeFilter) {
            <button pButton label="Registrar Gasto" icon="pi pi-plus" routerLink="/transactions/new" class="mt-3"></button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .tx-list-page { @include flex-column; gap: $spacing-4; }

    .page-header { @include flex-between; flex-wrap: wrap; gap: $spacing-3; }

    .filters-bar {
      display: flex;
      gap: $spacing-3;
      @include mobile-only { flex-direction: column; }
    }

    .search-wrapper {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;

      .pi-search {
        position: absolute;
        left: 12px;
        color: var(--text-muted);
        font-size: 0.9rem;
      }

      .search-input {
        width: 100%;
        padding-left: 36px !important;
      }
    }

    :host ::ng-deep .type-filter { min-width: 150px; }

    .date-group {
      @include flex-between;
      padding: $spacing-2 0;
      margin-top: $spacing-3;
    }

    .date-label {
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .transaction-row {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-3 $spacing-4;
      background: var(--surface-color);
      border-radius: $radius-lg;
      border: 1px solid var(--border-color);
      margin-bottom: $spacing-2;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        box-shadow: var(--shadow-sm);
        transform: translateX(2px);
      }
    }

    .tx-icon {
      @include flex-center;
      width: 42px;
      height: 42px;
      border-radius: $radius-lg;
      flex-shrink: 0;

      i { font-size: 1rem; color: var(--text-primary); }
    }

    .tx-details {
      flex: 1;
      @include flex-column;
      gap: 2px;
      min-width: 0;
    }

    .tx-desc {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      @include truncate;
    }

    .tx-meta {
      font-size: $font-size-xs;
      color: var(--text-muted);
    }

    .tx-right {
      @include flex-column;
      align-items: flex-end;
      gap: 2px;
    }

    .tx-amount {
      font-weight: $font-weight-semibold;
      font-size: $font-size-sm;
      white-space: nowrap;
    }

    .tx-time {
      font-size: $font-size-xs;
      color: var(--text-muted);
    }

    .loading-state {
      @include flex-center;
      @include flex-column;
      gap: $spacing-3;
      padding: $spacing-8 0;
      color: var(--text-secondary);
      font-size: $font-size-sm;
    }
  `]
})
export class TransactionListComponent implements OnInit, OnDestroy {
  private transactionService = inject(TransactionService);
  private familyService = inject(FamilySpaceService);

  readonly activeSpace = this.familyService.activeSpace;
  readonly loading = this.transactionService.loading;

  searchTerm = '';
  typeFilter: string | null = null;

  readonly typeOptions = [
    { label: 'Ingresos', value: 'income' },
    { label: 'Gastos Fijos', value: 'fixedExpense' },
    { label: 'Gastos Variables', value: 'variableExpense' },
  ];

  constructor() {
    effect(() => {
      const space = this.activeSpace();
      if (space) {
        this.transactionService.listenToTransactions(space.id);
      }
    });
  }

  ngOnInit(): void {
    const space = this.activeSpace();
    if (space) {
      this.transactionService.listenToTransactions(space.id);
    }
  }

  ngOnDestroy(): void {
    this.transactionService.destroy();
  }

  readonly filteredTransactions = computed(() => {
    let txs = this.transactionService.transactions();
    if (this.typeFilter) {
      txs = txs.filter(t => t.type === this.typeFilter);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      txs = txs.filter(t =>
        t.description.toLowerCase().includes(term) ||
        t.categoryName.toLowerCase().includes(term) ||
        t.userName.toLowerCase().includes(term)
      );
    }
    return txs;
  });

  readonly groupedTransactions = computed(() => {
    const txs = this.filteredTransactions();
    const groups: Map<string, { label: string; total: number; transactions: Transaction[] }> = new Map();

    for (const tx of txs) {
      const date = new Date(tx.date);
      const key = date.toLocaleDateString('es-CO');
      const today = new Date();
      const yesterday = new Date(Date.now() - 86400000);

      let label: string;
      if (date.toDateString() === today.toDateString()) {
        label = 'Hoy';
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = 'Ayer';
      } else {
        label = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
      }

      if (!groups.has(key)) {
        groups.set(key, { label, total: 0, transactions: [] });
      }
      const group = groups.get(key)!;
      group.transactions.push(tx);
      group.total += tx.type === 'income' ? tx.amount : -tx.amount;
    }

    return Array.from(groups.values());
  });

  getCategoryBg(type: string): string {
    const colors: Record<string, string> = {
      income: 'var(--success-bg)',
      fixedExpense: 'var(--danger-bg)',
      variableExpense: 'var(--warning-bg)',
    };
    return colors[type] || 'var(--surface-alt)';
  }

  getCategoryIcon(type: string): string {
    const icons: Record<string, string> = {
      income: 'pi-arrow-up',
      fixedExpense: 'pi-home',
      variableExpense: 'pi-shopping-cart',
    };
    return icons[type] || 'pi-circle';
  }
}
