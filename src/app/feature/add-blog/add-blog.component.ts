import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../shared/auth.store';
import { BlogService } from '../../shared/blog.service';
import { BlogStateService } from '../../shared/blog-state.service';

/**
 * Geschuetzte Seite: der authGuard laesst nur eingeloggte User mit der Rolle 'user'
 * hierher. Der POST geht ueber den BFF-Proxy, der den Bearer Token serverseitig
 * anhaengt – im Browser liegt nur das Session-Cookie.
 */
@Component({
  selector: 'app-add-blog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  templateUrl: './add-blog.component.html',
  styleUrl: './add-blog.component.scss',
})
export class AddBlogComponent {
  private blogService = inject(BlogService);
  private blogState = inject(BlogStateService);
  private router = inject(Router);
  protected authStore = inject(AuthStore);

  protected readonly title = signal('');
  protected readonly content = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  async save(): Promise<void> {
    if (this.saving() || !this.title().trim() || !this.content().trim()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const created = await this.blogService.createBlog({
      title: this.title().trim(),
      content: this.content().trim(),
    });

    this.saving.set(false);

    if (!created) {
      this.error.set('Der Beitrag konnte nicht gespeichert werden.');
      return;
    }

    await this.blogState.loadBlogs();
    await this.router.navigate(['/']);
  }
}
