import { Routes } from '@angular/router';
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { ACHIEVEMENT_DEFINITIONS } from '../../core/constants/app.constants';

interface DisplayAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
}

interface DisplayGoal {
  id: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  percentage: number;
  deadline: string;
}

@Component({
  selector: 'app-gamification',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressBarModule, TagModule, CurrencyFormatPipe],
  template: `
    <div class="gamification-page animate-fade-in">
      <div class="page-header">
        <h1 class="page-title">Logros y Metas 🏆</h1>
        <p class="page-subtitle">Gamificación financiera de tu familia</p>
      </div>

      <!-- Money Age Hero -->
      <div class="money-age-hero">
        <div class="money-age-ring">
          <svg viewBox="0 0 120 120" class="ring-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-color)" stroke-width="8"/>
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="var(--primary-color)" stroke-width="8"
              stroke-linecap="round"
              [attr.stroke-dasharray]="ringDashArray()"
              [attr.stroke-dashoffset]="ringDashOffset()"
              transform="rotate(-90 60 60)"
              class="ring-progress"
            />
          </svg>
          <div class="ring-content">
            <span class="ring-value">{{ moneyAge() }}</span>
            <span class="ring-unit">días</span>
          </div>
        </div>
        <div class="money-age-info">
          <h2>Edad del Dinero</h2>
          <p-tag [value]="moneyAgeStatus()" [severity]="moneyAgeSeverity()" [rounded]="true" />
          <p class="money-age-desc">Tu dinero cubre {{ moneyAge() }} días de gastos promedio</p>
        </div>
      </div>

      <!-- Savings Goals -->
      <div class="section">
        <h3 class="section-title">🎯 Metas de Ahorro</h3>
        <div class="goals-grid stagger-children">
          @for (goal of savingsGoals(); track goal.id) {
            <div class="goal-card">
              <div class="goal-header">
                <span class="goal-icon">{{ goal.icon }}</span>
                <div class="goal-info">
                  <span class="goal-name">{{ goal.name }}</span>
                  <span class="goal-deadline text-xs text-muted">Meta: {{ goal.deadline }}</span>
                </div>
                <span class="goal-pct number-display">{{ goal.percentage | number:'1.0-0' }}%</span>
              </div>
              <p-progressBar [value]="goal.percentage" [showValue]="false" styleClass="goal-progress" />
              <div class="goal-amounts">
                <span class="currency-sm">{{ goal.current | currencyFormat }}</span>
                <span class="text-muted currency-sm">de {{ goal.target | currencyFormat }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Achievements -->
      <div class="section">
        <h3 class="section-title">🏅 Logros ({{ unlockedCount() }}/{{ achievements().length }})</h3>
        <div class="achievements-grid stagger-children">
          @for (ach of achievements(); track ach.code) {
            <div class="achievement-card" [class.locked]="!ach.unlocked" [class.unlocked]="ach.unlocked">
              <div class="achievement-icon">{{ ach.icon }}</div>
              <div class="achievement-info">
                <span class="achievement-name">{{ ach.name }}</span>
                <span class="achievement-desc">{{ ach.description }}</span>
              </div>
              @if (ach.unlocked) {
                <i class="pi pi-check-circle achievement-check"></i>
              } @else {
                <i class="pi pi-lock achievement-lock"></i>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .gamification-page { @include flex-column; gap: $spacing-8; max-width: 700px; margin: 0 auto; }

    // --- Money Age Hero ---
    .money-age-hero {
      @include card($spacing-6);
      display: flex;
      align-items: center;
      gap: $spacing-6;
      @include mobile-only { flex-direction: column; text-align: center; }
    }

    .money-age-ring { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
    .ring-svg { width: 100%; height: 100%; }
    .ring-progress { transition: stroke-dashoffset 1s ease; }

    .ring-content {
      position: absolute; inset: 0;
      @include flex-center; @include flex-column;
    }
    .ring-value { font-size: $font-size-3xl; font-weight: $font-weight-bold; line-height: 1; }
    .ring-unit { font-size: $font-size-xs; color: var(--text-secondary); font-weight: $font-weight-medium; }

    .money-age-info { @include flex-column; gap: $spacing-2; }
    .money-age-info h2 { font-size: $font-size-xl; }
    .money-age-desc { font-size: $font-size-sm; color: var(--text-secondary); margin-top: $spacing-1; }

    // --- Section ---
    .section { @include flex-column; gap: $spacing-4; }
    .section-title { font-size: $font-size-lg; font-weight: $font-weight-semibold; }

    // --- Goals ---
    .goals-grid { @include flex-column; gap: $spacing-3; }

    .goal-card { @include card($spacing-4); @include flex-column; gap: $spacing-3; }
    .goal-header { display: flex; align-items: center; gap: $spacing-3; }
    .goal-icon { font-size: 1.5rem; }
    .goal-info { flex: 1; @include flex-column; }
    .goal-name { font-weight: $font-weight-semibold; font-size: $font-size-sm; }
    .goal-pct { font-size: $font-size-lg; font-weight: $font-weight-bold; color: var(--primary-color); }
    .goal-amounts { @include flex-between; }

    // --- Achievements ---
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-3;
      @include mobile-only { grid-template-columns: 1fr; }
    }

    .achievement-card {
      @include card($spacing-4);
      display: flex;
      align-items: center;
      gap: $spacing-3;
      transition: all $transition-fast;

      &.locked {
        opacity: 0.5;
        .achievement-icon { filter: grayscale(1); }
      }

      &.unlocked {
        border-color: var(--primary-color);
        &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
      }
    }

    .achievement-icon { font-size: 1.75rem; flex-shrink: 0; }
    .achievement-info { flex: 1; @include flex-column; gap: 2px; }
    .achievement-name { font-weight: $font-weight-semibold; font-size: $font-size-sm; }
    .achievement-desc { font-size: $font-size-xs; color: var(--text-secondary); }
    .achievement-check { color: var(--success-color); font-size: 1.25rem; }
    .achievement-lock { color: var(--text-muted); font-size: 1rem; }

    :host ::ng-deep {
      .goal-progress .p-progressbar {
        height: 8px !important; border-radius: $radius-full !important;
        background: var(--surface-alt) !important;
        .p-progressbar-value { @include gradient-primary; border-radius: $radius-full !important; }
      }
    }
  `]
})
export class GamificationPage {
  readonly moneyAge = signal(23);

  readonly moneyAgeStatus = () => {
    const age = this.moneyAge();
    if (age > 30) return 'Excelente';
    if (age > 14) return 'Saludable';
    if (age > 7) return 'Alerta';
    return 'Crítico';
  };

  readonly moneyAgeSeverity = (): 'success' | 'info' | 'warn' | 'danger' => {
    const age = this.moneyAge();
    if (age > 30) return 'info';
    if (age > 14) return 'success';
    if (age > 7) return 'warn';
    return 'danger';
  };

  // SVG ring calculations
  readonly ringDashArray = () => 2 * Math.PI * 52;
  readonly ringDashOffset = () => {
    const progress = Math.min(this.moneyAge() / 30, 1); // max 30 days = full circle
    return this.ringDashArray() * (1 - progress);
  };

  readonly savingsGoals = signal<DisplayGoal[]>([
    { id: '1', name: 'Vacaciones Familiares', icon: '✈️', target: 5000000, current: 2250000, percentage: 45, deadline: 'Dic 2026' },
    { id: '2', name: 'Fondo de Emergencia', icon: '🏦', target: 10000000, current: 7500000, percentage: 75, deadline: 'Mar 2027' },
    { id: '3', name: 'Laptop Nueva', icon: '💻', target: 3000000, current: 900000, percentage: 30, deadline: 'Sep 2026' },
  ]);

  readonly achievements = signal<DisplayAchievement[]>(
    ACHIEVEMENT_DEFINITIONS.map((a, i) => ({
      ...a,
      unlocked: i < 4,  // Demo: primeros 4 desbloqueados
      unlockedDate: i < 4 ? 'Mayo 2026' : undefined,
    }))
  );

  readonly unlockedCount = () => this.achievements().filter(a => a.unlocked).length;
}

export const GAMIFICATION_ROUTES: Routes = [
  { path: '', component: GamificationPage, title: 'Logros — FamyPay' }
];
