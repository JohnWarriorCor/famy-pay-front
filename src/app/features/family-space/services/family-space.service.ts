import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from '../../../core/services/firebase/firestore.service';
import { AuthService } from '../../../core/services/firebase/auth.service';
import { CategoryService } from '../../transactions/services/category.service';
import { FamilySpace, FamilyMember, MemberRole } from '../../../core/models';
import { Timestamp, Unsubscribe, arrayUnion } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class FamilySpaceService {
  private firestore = inject(FirestoreService);
  private auth = inject(AuthService);
  private categoryService = inject(CategoryService);

  private readonly _spaces = signal<FamilySpace[]>([]);
  private readonly _activeSpace = signal<FamilySpace | null>(null);
  private readonly _members = signal<FamilyMember[]>([]);
  private readonly _loading = signal(false);

  /** Espacios familiares del usuario */
  readonly spaces = this._spaces.asReadonly();
  /** Espacio activo */
  readonly activeSpace = this._activeSpace.asReadonly();
  /** Miembros del espacio activo */
  readonly members = this._members.asReadonly();
  readonly loading = this._loading.asReadonly();

  /** Generar código de invitación único (8 chars) */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /** Crear espacio familiar */
  async createSpace(name: string, description: string = ''): Promise<string> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No autenticado');

    this._loading.set(true);
    try {
      const inviteCode = this.generateInviteCode();

      // 1. Crear el espacio
      const spaceId = await this.firestore.addDocument('familySpaces', {
        name,
        description,
        inviteCode,
        createdBy: user.uid,
        settings: { currency: 'COP', timezone: 'America/Bogota' },
      });

      // 2. Agregar al creador como Super Admin
      await this.firestore.setDocument(`familySpaces/${spaceId}/members/${user.uid}`, {
        role: 'superAdmin' as MemberRole,
        joinedAt: Timestamp.now(),
        displayName: user.displayName || user.email || '',
        photoURL: user.photoURL || null,
      });

      // 3. Crear invite lookup
      await this.firestore.setDocument(`invites/${inviteCode}`, {
        spaceId,
        spaceName: name,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
      });

      // 4. Actualizar usuario con el nuevo espacio
      await this.firestore.updateDocument(`users/${user.uid}`, {
        familySpaceIds: arrayUnion(spaceId),
      });

      // 5. Inicializar categorías por defecto
      await this.categoryService.initializeDefaultCategories(spaceId);

      return spaceId;
    } finally {
      this._loading.set(false);
    }
  }

  /** Unirse a un espacio con código de invitación */
  async joinSpace(inviteCode: string): Promise<string> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No autenticado');

    this._loading.set(true);
    try {
      // 1. Buscar la invitación
      const invite = await this.firestore.getDocument<any>(`invites/${inviteCode.toUpperCase()}`);
      if (!invite) throw new Error('Código de invitación inválido');

      const spaceId = invite.spaceId;

      // 2. Verificar si ya es miembro
      const existing = await this.firestore.getDocument<any>(`familySpaces/${spaceId}/members/${user.uid}`);
      if (existing) throw new Error('Ya eres miembro de este espacio');

      // 3. Agregar como miembro
      await this.firestore.setDocument(`familySpaces/${spaceId}/members/${user.uid}`, {
        role: 'member' as MemberRole,
        joinedAt: Timestamp.now(),
        displayName: user.displayName || user.email || '',
        photoURL: user.photoURL || null,
      });

      // 4. Actualizar usuario
      await this.firestore.updateDocument(`users/${user.uid}`, {
        familySpaceIds: arrayUnion(spaceId),
      });

      return spaceId;
    } finally {
      this._loading.set(false);
    }
  }

  /** Cargar espacios del usuario */
  async loadUserSpaces(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    const userDoc = await this.firestore.getDocument<any>(`users/${user.uid}`);
    if (!userDoc?.familySpaceIds?.length) {
      this._spaces.set([]);
      return;
    }

    const spaces: FamilySpace[] = [];
    for (const spaceId of userDoc.familySpaceIds) {
      const space = await this.firestore.getDocument<FamilySpace>(`familySpaces/${spaceId}`);
      if (space) spaces.push(space);
    }
    this._spaces.set(spaces);

    // Auto-seleccionar el primer espacio
    if (spaces.length > 0 && !this._activeSpace()) {
      this.setActiveSpace(spaces[0]);
    }
  }

  /** Establecer espacio activo */
  setActiveSpace(space: FamilySpace): void {
    this._activeSpace.set(space);
    // Cargar miembros
    this.loadMembers(space.id);
    // Iniciar listeners de categorías
    this.categoryService.listenToCategories(space.id);
  }

  /** Cargar miembros del espacio */
  async loadMembers(spaceId: string): Promise<void> {
    const members = await this.firestore.queryDocuments<FamilyMember>(
      `familySpaces/${spaceId}/members`
    );
    this._members.set(members.map(m => ({ ...m, userId: (m as any).id })));
  }

  /** Cambiar rol de un miembro */
  async changeMemberRole(spaceId: string, memberId: string, newRole: MemberRole): Promise<void> {
    await this.firestore.updateDocument(
      `familySpaces/${spaceId}/members/${memberId}`,
      { role: newRole }
    );
    await this.loadMembers(spaceId);
  }

  /** Eliminar miembro */
  async removeMember(spaceId: string, memberId: string): Promise<void> {
    await this.firestore.deleteDocument(`familySpaces/${spaceId}/members/${memberId}`);
    await this.loadMembers(spaceId);
  }
}
