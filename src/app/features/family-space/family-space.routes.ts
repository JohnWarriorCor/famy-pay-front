import { Routes } from '@angular/router';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { FamilySpaceService } from './services/family-space.service';
import { NotificationService } from '../../core/services/notification.service';
import { FamilyMember, MemberRole } from '../../core/models';

@Component({
  selector: 'app-family-space',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, CardModule, DialogModule,
    AvatarModule, TagModule, RippleModule,
  ],
  template: `
    <div class="family-page animate-fade-in">
      <div class="page-header">
        <h1 class="page-title">Espacio Familiar</h1>
        <p class="page-subtitle">Gestiona tu familia y miembros</p>
      </div>

      <!-- Active Space -->
      @if (familyService.activeSpace(); as space) {
        <div class="space-card">
          <div class="space-info">
            <div class="space-icon">👨‍👩‍👧‍👦</div>
            <div>
              <h2>{{ space.name }}</h2>
              <p class="text-sm text-secondary">{{ space.description || 'Mi espacio familiar' }}</p>
            </div>
          </div>

          <!-- Invite Code -->
          <div class="invite-section">
            <label class="section-label">Código de Invitación</label>
            <div class="invite-code-display">
              <span class="invite-code">{{ space.inviteCode }}</span>
              <button pButton icon="pi pi-copy" [text]="true" (click)="copyInviteCode(space.inviteCode)" pTooltip="Copiar código"></button>
            </div>
            <p class="text-xs text-muted">Comparte este código para que otros se unan</p>
          </div>
        </div>

        <!-- Members -->
        <div class="members-section">
          <h3>Miembros ({{ familyService.members().length }})</h3>
          <div class="members-list stagger-children">
            @for (member of familyService.members(); track member.userId) {
              <div class="member-card">
                <p-avatar
                  [label]="member.displayName.charAt(0).toUpperCase()"
                  shape="circle"
                  size="large"
                  styleClass="member-avatar"
                />
                <div class="member-info">
                  <span class="member-name">{{ member.displayName }}</span>
                  <p-tag
                    [value]="getRoleLabel(member.role)"
                    [severity]="getRoleSeverity(member.role)"
                    [rounded]="true"
                  />
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- No Space -->
        <div class="no-space-section">
          <div class="space-option" (click)="showCreateDialog.set(true)" pRipple>
            <div class="option-icon create-icon">
              <i class="pi pi-plus"></i>
            </div>
            <div class="option-info">
              <h3>Crear espacio familiar</h3>
              <p>Inicia un nuevo grupo para tu familia</p>
            </div>
            <i class="pi pi-chevron-right"></i>
          </div>

          <div class="space-option" (click)="showJoinDialog.set(true)" pRipple>
            <div class="option-icon join-icon">
              <i class="pi pi-link"></i>
            </div>
            <div class="option-info">
              <h3>Unirse a un espacio</h3>
              <p>Ingresa el código de invitación</p>
            </div>
            <i class="pi pi-chevron-right"></i>
          </div>
        </div>
      }

      <!-- Create Dialog -->
      <p-dialog
        header="Crear Espacio Familiar"
        [(visible)]="showCreateDialog"
        [modal]="true"
        [draggable]="false"
        [style]="{ width: '400px' }"
      >
        <div class="dialog-form">
          <div class="form-field">
            <label>Nombre del espacio</label>
            <input pInputText [(ngModel)]="newSpaceName" placeholder="Ej: Familia Pérez" class="w-full" />
          </div>
          <div class="form-field">
            <label>Descripción <span class="text-muted">(opcional)</span></label>
            <input pInputText [(ngModel)]="newSpaceDescription" placeholder="Descripción del espacio" class="w-full" />
          </div>
        </div>
        <ng-template #footer>
          <button pButton label="Cancelar" [text]="true" (click)="showCreateDialog.set(false)"></button>
          <button
            pButton
            label="Crear Espacio"
            icon="pi pi-check"
            [loading]="familyService.loading()"
            [disabled]="!newSpaceName"
            (click)="createSpace()"
          ></button>
        </ng-template>
      </p-dialog>

      <!-- Join Dialog -->
      <p-dialog
        header="Unirse a un Espacio"
        [(visible)]="showJoinDialog"
        [modal]="true"
        [draggable]="false"
        [style]="{ width: '400px' }"
      >
        <div class="dialog-form">
          <div class="form-field">
            <label>Código de invitación</label>
            <input
              pInputText
              [(ngModel)]="joinCode"
              placeholder="Ej: ABC12345"
              class="w-full join-input"
              (input)="joinCode = joinCode.toUpperCase()"
              maxlength="8"
            />
          </div>
        </div>
        <ng-template #footer>
          <button pButton label="Cancelar" [text]="true" (click)="showJoinDialog.set(false)"></button>
          <button
            pButton
            label="Unirse"
            icon="pi pi-sign-in"
            [loading]="familyService.loading()"
            [disabled]="joinCode.length < 8"
            (click)="joinSpace()"
          ></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .family-page {
      @include flex-column;
      gap: $spacing-6;
      max-width: 600px;
      margin: 0 auto;
    }

    .space-card {
      @include card;
      @include flex-column;
      gap: $spacing-5;
    }

    .space-info {
      display: flex;
      align-items: center;
      gap: $spacing-4;

      .space-icon { font-size: 2.5rem; }
      h2 { font-size: $font-size-xl; font-weight: $font-weight-bold; margin-bottom: $spacing-1; }
    }

    .invite-section {
      background: var(--surface-alt);
      padding: $spacing-4;
      border-radius: $radius-lg;
    }

    .section-label {
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: $spacing-2;
      display: block;
    }

    .invite-code-display {
      @include flex-between;
    }

    .invite-code {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      letter-spacing: 0.15em;
      font-variant-numeric: tabular-nums;
      color: var(--primary-color);
    }

    .members-section {
      @include flex-column;
      gap: $spacing-4;

      h3 { font-size: $font-size-lg; font-weight: $font-weight-semibold; }
    }

    .members-list {
      @include flex-column;
      gap: $spacing-3;
    }

    .member-card {
      @include card($spacing-4);
      display: flex;
      align-items: center;
      gap: $spacing-3;
    }

    .member-info {
      flex: 1;
      @include flex-column;
      gap: $spacing-1;
    }

    .member-name {
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
    }

    :host ::ng-deep .member-avatar {
      background: linear-gradient(135deg, $primary-500, $secondary-500) !important;
      color: white !important;
    }

    // --- No Space Options ---
    .no-space-section {
      @include flex-column;
      gap: $spacing-4;
    }

    .space-option {
      @include card-interactive;
      display: flex;
      align-items: center;
      gap: $spacing-4;
      padding: $spacing-5;

      .option-info {
        flex: 1;
        h3 { font-size: $font-size-base; font-weight: $font-weight-semibold; margin-bottom: 2px; }
        p { font-size: $font-size-sm; color: var(--text-secondary); }
      }

      .pi-chevron-right { color: var(--text-muted); }
    }

    .option-icon {
      @include flex-center;
      width: 48px;
      height: 48px;
      border-radius: $radius-lg;
      font-size: 1.25rem;

      &.create-icon {
        background: var(--primary-bg);
        i { color: var(--primary-color); }
      }

      &.join-icon {
        background: var(--info-bg);
        i { color: var(--info-color); }
      }
    }

    .dialog-form {
      @include flex-column;
      gap: $spacing-4;
      padding: $spacing-2 0;
    }

    .form-field {
      @include flex-column;
      gap: $spacing-2;

      label { font-size: $font-size-sm; font-weight: $font-weight-medium; color: var(--text-secondary); }
    }

    .join-input {
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: $font-weight-semibold !important;
      text-align: center;
      font-size: $font-size-xl !important;
    }
  `]
})
export class FamilySpacePage implements OnInit {
  readonly familyService = inject(FamilySpaceService);
  private notification = inject(NotificationService);

  showCreateDialog = signal(false);
  showJoinDialog = signal(false);

  newSpaceName = '';
  newSpaceDescription = '';
  joinCode = '';

  ngOnInit(): void {
    this.familyService.loadUserSpaces();
  }

  async createSpace(): Promise<void> {
    if (!this.newSpaceName) return;
    try {
      await this.familyService.createSpace(this.newSpaceName, this.newSpaceDescription);
      this.notification.success('Espacio creado', `"${this.newSpaceName}" está listo`);
      this.showCreateDialog.set(false);
      this.newSpaceName = '';
      this.newSpaceDescription = '';
      await this.familyService.loadUserSpaces();
    } catch (e: any) {
      this.notification.error('Error', e.message);
    }
  }

  async joinSpace(): Promise<void> {
    if (this.joinCode.length < 8) return;
    try {
      await this.familyService.joinSpace(this.joinCode);
      this.notification.success('¡Te uniste!', 'Ahora eres miembro del espacio');
      this.showJoinDialog.set(false);
      this.joinCode = '';
      await this.familyService.loadUserSpaces();
    } catch (e: any) {
      this.notification.error('Error', e.message);
    }
  }

  copyInviteCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.notification.info('Código copiado', code);
  }

  getRoleLabel(role: MemberRole): string {
    const labels: Record<MemberRole, string> = {
      superAdmin: 'Super Admin',
      admin: 'Admin',
      member: 'Miembro',
    };
    return labels[role];
  }

  getRoleSeverity(role: MemberRole): 'success' | 'info' | 'secondary' {
    const map: Record<MemberRole, 'success' | 'info' | 'secondary'> = {
      superAdmin: 'success',
      admin: 'info',
      member: 'secondary',
    };
    return map[role];
  }
}

export const FAMILY_SPACE_ROUTES: Routes = [
  {
    path: '',
    component: FamilySpacePage,
    title: 'Familia — FamyPay',
  },
];
