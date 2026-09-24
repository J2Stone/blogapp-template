import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../shared/auth.store';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    NgTemplateOutlet,
  ],
})
export class SidebarComponent implements OnInit {
  // Gleicher Breakpoint wie die Media Query in .nav (768px), sonst laufen JS und CSS auseinander.
  private readonly mobileQuery = window.matchMedia('(max-width: 767.98px)');
  protected readonly isMobile = signal(this.mobileQuery.matches);

  constructor() {
    const onChange = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);
    this.mobileQuery.addEventListener('change', onChange);
    // Die Komponente kann zerstoert werden, das MediaQueryList-Objekt lebt weiter: ohne
    // Cleanup haelt der Listener die Komponente im Speicher (Memory Leak).
    inject(DestroyRef).onDestroy(() => this.mobileQuery.removeEventListener('change', onChange));
  }

  protected readonly title = 'HFTM Web Applications (IN353)';
  protected readonly authStore = inject(AuthStore);
  // Ohne BFF gibt es keinen Login – dann bleiben die Auth-Bedienelemente ganz weg.
  protected readonly authEnabled = environment.authEnabled;

  isDark = signal(false);

  toggleTheme() {
    this.isDark.update((v) => !v);
    document.body.classList.toggle('dark-theme', this.isDark());
    localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
  }

  /** logout() verlaesst die App per window.location.href – danach nicht mehr routen. */
  async logout(): Promise<void> {
    await this.authStore.logout();
  }

  ngOnInit() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    this.isDark.set(stored ? stored === 'dark' : prefersDark);
    document.body.classList.toggle('dark-theme', this.isDark());
  }
}
