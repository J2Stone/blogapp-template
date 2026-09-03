import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from './shared/auth.store';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
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
