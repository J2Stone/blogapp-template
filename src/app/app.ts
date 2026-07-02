import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = 'HFTM Web Applications (IN353)';

  isDark = signal(false);

  toggleTheme() {
    this.isDark.update((v) => !v);
    document.body.classList.toggle('dark-theme', this.isDark());
    localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
  }

  ngOnInit() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    this.isDark.set(stored ? stored === 'dark' : prefersDark);
    document.body.classList.toggle('dark-theme', this.isDark());
  }
}
