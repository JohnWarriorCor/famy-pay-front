import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'famypay-theme';
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _theme = signal<Theme>('light');

  /** Tema actual como signal de solo lectura */
  readonly theme = this._theme.asReadonly();

  /** ¿Es tema oscuro? */
  readonly isDark = () => this._theme() === 'dark';

  constructor() {
    // Inicializar con el tema guardado/preferido
    const initial = this.getInitialTheme();
    this._theme.set(initial);

    // Aplicar inmediatamente al DOM sin esperar al ciclo de detección
    this.applyToDom(initial);

    // Aplicar tema al DOM de forma reactiva cuando cambie
    effect(() => {
      this.applyToDom(this._theme());
    });
  }

  /** Alternar entre claro y oscuro */
  toggle(): void {
    this._theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  /** Establecer tema específico */
  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  /** Detectar tema inicial: localStorage > preferencia del sistema > light */
  private getInitialTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) return 'light';

    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;

    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /** Aplica el tema al DOM y guarda en localStorage */
  private applyToDom(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) return;

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0F172A' : '#FAFAFA');
    }
  }
}
