import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent, BottomNavComponent],
  template: `
    <app-sidebar />
    <app-topbar />

    <main class="main-content">
      <div class="content-wrapper animate-fade-in">
        <router-outlet />
      </div>
    </main>

    <app-bottom-nav />
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .main-content {
      margin-left: $sidebar-width;
      margin-top: $topbar-height;
      min-height: calc(100vh - #{$topbar-height});
      background: var(--bg-color);
      transition: margin-left $transition-base;

      @include mobile-only {
        margin-left: 0;
        margin-bottom: $bottom-nav-height;
      }
    }

    .content-wrapper {
      padding: $spacing-6;
      max-width: $content-max-width;
      margin: 0 auto;

      @include mobile-only {
        padding: $spacing-4;
      }
    }
  `]
})
export class MainLayoutComponent {}
