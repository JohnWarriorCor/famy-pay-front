import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from '../../../core/services/firebase/firestore.service';
import { AuthService } from '../../../core/services/firebase/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ACHIEVEMENT_DEFINITIONS } from '../../../core/constants/app.constants';
import { Unsubscribe } from 'firebase/firestore';

export interface UnlockedAchievementDoc {
  id: string;
  code: string;
  unlockedAt: any;
  userId: string;
  userName: string;
}

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private firestore = inject(FirestoreService);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);

  private readonly _unlockedAchievements = signal<UnlockedAchievementDoc[]>([]);
  private _unsubscribe?: Unsubscribe;

  readonly unlockedAchievements = this._unlockedAchievements.asReadonly();

  /** Escuchar logros desbloqueados del espacio familiar activo */
  listenToAchievements(spaceId: string): void {
    this._unsubscribe?.();
    this._unsubscribe = this.firestore.onCollectionSnapshot<UnlockedAchievementDoc>(
      `familySpaces/${spaceId}/unlockedAchievements`,
      (data) => this._unlockedAchievements.set(data)
    );
  }

  /** Intentar desbloquear un logro si no está ya desbloqueado */
  async unlockAchievement(spaceId: string, code: string): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    // Si aún no se han cargado los logros locales o ya está desbloqueado, salimos
    const alreadyUnlocked = this._unlockedAchievements().some(a => a.code === code);
    if (alreadyUnlocked) return;

    const definition = ACHIEVEMENT_DEFINITIONS.find(a => a.code === code);
    if (!definition) return;

    const achievementData = {
      id: code,
      code,
      unlockedAt: new Date(),
      userId: user.uid,
      userName: user.displayName || user.email || 'Anónimo'
    };

    try {
      await this.firestore.setDocument(
        `familySpaces/${spaceId}/unlockedAchievements/${code}`,
        achievementData
      );
      this.notification.achievementUnlocked(definition.name, definition.icon);
    } catch (e) {
      console.error('Error al desbloquear logro:', code, e);
    }
  }

  destroy(): void {
    this._unsubscribe?.();
    this._unlockedAchievements.set([]);
  }
}
