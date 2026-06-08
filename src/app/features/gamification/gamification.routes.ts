import { Routes } from '@angular/router';
import { Component, signal, inject, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { RippleModule } from 'primeng/ripple';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { ACHIEVEMENT_DEFINITIONS } from '../../core/constants/app.constants';
import { FamilySpaceService } from '../family-space/services/family-space.service';
import { GamificationService } from './services/gamification.service';
import { SavingsGoalService } from './services/savings-goal.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { NotificationService } from '../../core/services/notification.service';

interface DisplayAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: any;
  unlockedBy?: string;
}

@Component({
  selector: 'app-gamification',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe,
    ButtonModule, ProgressBarModule, TagModule, DialogModule,
    InputTextModule, InputNumberModule, DatePickerModule, RippleModule,
    CurrencyFormatPipe
  ],
  template: `
    <div class="gamification-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Logros y Metas 🏆</h1>
          <p class="page-subtitle">Gamificación financiera de tu familia</p>
        </div>
        <button pButton icon="pi pi-plus" label="Nueva Meta" (click)="openAddDialog()" [disabled]="!activeSpace()"></button>
      </div>

      <!-- Money Age Hero -->
      @if (activeSpace()) {
        <div class="money-age-hero animate-fade-in-up">
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
            <div>
              <p-tag [value]="moneyAgeStatus()" [severity]="moneyAgeSeverity()" [rounded]="true" />
            </div>
            <p class="money-age-desc">Tu dinero cubre {{ moneyAge() }} días de gastos promedio en base a tus ingresos.</p>
          </div>
        </div>

        <!-- Savings Goals -->
        <div class="section animate-fade-in">
          <h3 class="section-title">🎯 Metas de Ahorro</h3>
          
          @if (savingsGoals().length > 0) {
            <div class="goals-grid stagger-children">
              @for (goal of savingsGoals(); track goal.id) {
                <div class="goal-card">
                  <div class="goal-header">
                    <span class="goal-icon">{{ goal.icon }}</span>
                    <div class="goal-info">
                      <span class="goal-name">{{ goal.name }}</span>
                      <span class="goal-deadline text-xs text-muted">Meta: {{ goal.deadline | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="flex gap-2 align-items-center">
                      <span class="goal-pct font-semibold text-primary">{{ goal.percentage | number:'1.0-0' }}%</span>
                      <button 
                        pButton 
                        icon="pi pi-trash" 
                        [text]="true" 
                        class="p-button-danger p-button-sm p-0 ml-2" 
                        style="height: 20px; width: 20px;"
                        (click)="deleteSavingsGoal(goal.id)"
                        title="Eliminar Meta"
                      ></button>
                    </div>
                  </div>
                  <p-progressBar [value]="Math.min(goal.percentage, 100)" [showValue]="false" styleClass="goal-progress" />
                  <div class="goal-amounts">
                    <span class="currency-sm">{{ goal.currentAmount | currencyFormat }}</span>
                    <span class="text-muted currency-sm">de {{ goal.targetAmount | currencyFormat }}</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <div class="empty-state-icon">🎯</div>
              <p class="empty-state-title">Sin metas de ahorro</p>
              <p class="empty-state-text">Establece objetivos de ahorro conjuntos para motivar a la familia.</p>
              <button pButton label="Crear Meta" icon="pi pi-plus" class="mt-3" (click)="openAddDialog()"></button>
            </div>
          }
        </div>

        <!-- Achievements -->
        <div class="section animate-fade-in">
          <h3 class="section-title">🏅 Logros ({{ unlockedCount() }}/{{ achievements().length }})</h3>
          <div class="achievements-grid stagger-children">
            @for (ach of achievements(); track ach.code) {
              <div class="achievement-card" [class.locked]="!ach.unlocked" [class.unlocked]="ach.unlocked">
                <div class="achievement-icon">{{ ach.icon }}</div>
                <div class="achievement-info">
                  <span class="achievement-name">{{ ach.name }}</span>
                  <span class="achievement-desc">{{ ach.description }}</span>
                  @if (ach.unlocked && ach.unlockedBy) {
                    <span class="text-xxs text-muted mt-1">Desbloqueado por {{ ach.unlockedBy }}</span>
                  }
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
      } @else {
        <div class="empty-state">
          <div class="empty-state-icon">👨‍👩‍👧‍👦</div>
          <p class="empty-state-title">Sin Espacio Familiar</p>
          <p class="empty-state-text">Crea o únete a un espacio familiar en la configuración de la familia para ver logros y metas de ahorro.</p>
        </div>
      }

      <!-- Add Savings Goal Dialog -->
      <p-dialog header="Nueva Meta de Ahorro" [(visible)]="showAddDialog" [modal]="true" [style]="{ width: '460px', maxWidth: '90vw' }">
        <div class="dialog-form">
          <div class="form-field">
            <label>Nombre de la meta</label>
            <input pInputText [(ngModel)]="goalName" placeholder="Ej: Vacaciones Familiares" class="w-full" />
          </div>
          <div class="form-field">
            <label>Icono (Emoji)</label>
            <input pInputText [(ngModel)]="goalIcon" placeholder="Ej: ✈️, 🏦, 💻" class="w-full" />
          </div>
          <div class="form-field">
            <label>Monto Objetivo</label>
            <p-inputNumber
              [(ngModel)]="goalTarget"
              mode="currency"
              currency="COP"
              locale="es-CO"
              [minFractionDigits]="0"
              [maxFractionDigits]="0"
              styleClass="w-full"
              placeholder="$0"
            />
          </div>
          <div class="form-field">
            <label>Fecha Límite</label>
            <p-datepicker
              [(ngModel)]="goalDeadline"
              [showIcon]="true"
              dateFormat="dd/mm/yy"
              placeholder="Selecciona fecha"
              styleClass="w-full"
              appendTo="body"
            />
          </div>
        </div>
        <ng-template #footer>
          <button pButton label="Cancelar" [text]="true" (click)="showAddDialog.set(false)"></button>
          <button pButton label="Crear" icon="pi pi-check" [disabled]="!goalName || !goalTarget || !goalDeadline" (click)="addSavingsGoal()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .gamification-page { @include flex-column; gap: $spacing-8; max-width: 700px; margin: 0 auto; }
    
    .page-header { @include flex-between; flex-wrap: wrap; gap: $spacing-3; }

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

    .dialog-form { @include flex-column; gap: $spacing-4; padding: $spacing-2 0; }
    .form-field { @include flex-column; gap: $spacing-2;
      label { font-size: $font-size-sm; font-weight: $font-weight-medium; color: var(--text-secondary); }
    }

    :host ::ng-deep {
      .goal-progress .p-progressbar {
        height: 8px !important; border-radius: $radius-full !important;
        background: var(--surface-alt) !important;
        .p-progressbar-value { @include gradient-primary; border-radius: $radius-full !important; }
      }
    }
  `]
})
export class GamificationPage implements OnInit, OnDestroy {
  readonly Math = Math;

  private familyService = inject(FamilySpaceService);
  private gamificationService = inject(GamificationService);
  private savingsGoalService = inject(SavingsGoalService);
  private transactionService = inject(TransactionService);
  private notification = inject(NotificationService);

  readonly activeSpace = this.familyService.activeSpace;

  // Modales y Formulario
  showAddDialog = signal(false);
  goalName = '';
  goalIcon = '🎯';
  goalTarget: number | null = null;
  goalDeadline: Date | null = null;

  /** Edad del dinero calculada reactivamente */
  readonly moneyAge = computed(() => {
    const transactions = this.transactionService.transactions();
    const lastIncome = transactions
      .filter(tx => tx.type === 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return lastIncome
      ? Math.floor((Date.now() - new Date(lastIncome.date).getTime()) / 86400000)
      : 0;
  });

  readonly moneyAgeStatus = computed(() => {
    const age = this.moneyAge();
    if (age >= 30) return 'Excelente';
    if (age >= 14) return 'Saludable';
    if (age >= 7) return 'Alerta';
    return 'Crítico';
  });

  readonly moneyAgeSeverity = computed((): 'success' | 'info' | 'warn' | 'danger' => {
    const age = this.moneyAge();
    if (age >= 30) return 'info';
    if (age >= 14) return 'success';
    if (age >= 7) return 'warn';
    return 'danger';
  });

  // SVG ring calculations
  readonly ringDashArray = () => 2 * Math.PI * 52;
  readonly ringDashOffset = computed(() => {
    const progress = Math.min(this.moneyAge() / 30, 1); // max 30 days = full circle
    return this.ringDashArray() * (1 - progress);
  });

  /** Metas de ahorro mapeadas desde Firestore */
  readonly savingsGoals = computed(() => {
    const rawGoals = this.savingsGoalService.savingsGoals();
    const transactions = this.transactionService.transactions();

    // Mapear cada meta y estimar progreso basado en transacciones (por simplicidad,
    // usaremos el currentAmount de la meta y el acumulado de transacciones destinadas a ahorro
    // si el modelo lo requiere, o directamente el currentAmount real de la base de datos).
    return rawGoals.map(goal => {
      const percentage = goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount) * 100
        : 0;
      return {
        ...goal,
        percentage
      };
    });
  });

  /** Logros combinando definiciones predeterminadas y estado de desbloqueo en Firestore */
  readonly achievements = computed<DisplayAchievement[]>(() => {
    const unlocked = this.gamificationService.unlockedAchievements();
    return ACHIEVEMENT_DEFINITIONS.map(def => {
      const unlockedDoc = unlocked.find(u => u.code === def.code);
      return {
        ...def,
        unlocked: !!unlockedDoc,
        unlockedBy: unlockedDoc?.userName,
        unlockedAt: unlockedDoc?.unlockedAt
      };
    });
  });

  readonly unlockedCount = () => this.achievements().filter(a => a.unlocked).length;

  constructor() {
    // Escuchar cambios del espacio activo
    effect(() => {
      const space = this.activeSpace();
      if (space) {
        this.initListeners(space.id);
      }
    });
  }

  ngOnInit(): void {
    const space = this.activeSpace();
    if (space) {
      this.initListeners(space.id);
    }
  }

  ngOnDestroy(): void {
    this.gamificationService.destroy();
    this.savingsGoalService.destroy();
    this.transactionService.destroy();
  }

  private initListeners(spaceId: string): void {
    this.gamificationService.listenToAchievements(spaceId);
    this.savingsGoalService.listenToSavingsGoals(spaceId);
    this.transactionService.listenToTransactions(spaceId);
  }

  openAddDialog(): void {
    this.goalName = '';
    this.goalIcon = '🎯';
    this.goalTarget = null;
    this.goalDeadline = null;
    this.showAddDialog.set(true);
  }

  async addSavingsGoal(): Promise<void> {
    const space = this.activeSpace();
    if (!space) return;

    if (!this.goalName || !this.goalTarget || !this.goalDeadline) return;

    try {
      this.showAddDialog.set(false);
      await this.savingsGoalService.addSavingsGoal(space.id, {
        name: this.goalName,
        icon: this.goalIcon,
        targetAmount: this.goalTarget,
        currentAmount: 0, // Se inicia en cero pesos de ahorro acumulados
        deadline: this.goalDeadline
      });

      // Intentar desbloquear logro "first_budget" o similar si aplica, o lanzar notificaciones
      this.notification.success('Meta Creada', `Se estableció la meta "${this.goalName}" con éxito.`);
    } catch (e: any) {
      this.notification.error('Error al crear meta', e.message);
    }
  }

  async deleteSavingsGoal(goalId: string): Promise<void> {
    const space = this.activeSpace();
    if (!space) return;

    try {
      await this.savingsGoalService.deleteSavingsGoal(space.id, goalId);
      this.notification.success('Meta Eliminada', 'La meta de ahorro fue eliminada correctamente.');
    } catch (e: any) {
      this.notification.error('Error al eliminar meta', e.message);
    }
  }
}

export const GAMIFICATION_ROUTES: Routes = [
  { path: '', component: GamificationPage, title: 'Logros y Metas — FamyPay' }
];
