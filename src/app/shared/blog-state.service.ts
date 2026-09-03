import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Blog } from '../interfaces/blog.schema';
import { BlogService } from './blog.service';

interface BlogState {
  blogs: Blog[];
  loading: boolean;
  error: string | null;
  selectedAuthor: string;
}

export const ALL_AUTHORS = 'all';
const AUTHOR_STORAGE_KEY = 'blog-selected-author';

/** Liest den zuletzt gewaehlten Autor aus dem localStorage (Fallback: alle Autoren). */
function restoreSelectedAuthor(): string {
  try {
    return localStorage.getItem(AUTHOR_STORAGE_KEY) ?? ALL_AUTHORS;
  } catch {
    return ALL_AUTHORS;
  }
}

@Injectable({ providedIn: 'root' })
export class BlogStateService {
  private blogService = inject(BlogService);

  // ── State ──────────────────────────────────────────────
  // Privat: schreiben darf nur dieser Service über seine Actions.
  readonly #state = signal<BlogState>({
    blogs: [],
    loading: false,
    error: null,
    selectedAuthor: restoreSelectedAuthor(),
  });

  // ── Derived State ──────────────────────────────────────
  // Öffentliche Lese-API für die Komponenten.
  readonly blogs = computed(() => this.#state().blogs);
  readonly loading = computed(() => this.#state().loading);
  readonly error = computed(() => this.#state().error);
  readonly selectedAuthor = computed(() => this.#state().selectedAuthor);
  readonly blogCount = computed(() => this.blogs().length);

  /** Auswahlliste des Filters: alle Autoren ohne Duplikate. */
  readonly authors = computed(() => [...new Set(this.blogs().map((blog) => blog.author))].sort());

  /** Blogs des gewaehlten Autors, bei 'all' die komplette Liste. */
  readonly filteredBlogs = computed(() => {
    const author = this.selectedAuthor();
    if (author === ALL_AUTHORS) {
      return this.blogs();
    }
    return this.blogs().filter((blog) => blog.author === author);
  });

  /** Merkt sich den Filter über einen Reload hinweg. */
  protected readonly persistSelectedAuthor = effect(() => {
    const author = this.selectedAuthor();
    try {
      localStorage.setItem(AUTHOR_STORAGE_KEY, author);
    } catch {
      // localStorage nicht verfügbar (z.B. Private Mode) – Filter bleibt dann nur zur Laufzeit erhalten.
    }
  });

  // ── Actions ────────────────────────────────────────────
  /** Laedt die Blog-Liste vom Backend und entscheidet, welcher Reducer greift. */
  async loadBlogs(): Promise<void> {
    this.#loadStarted();
    try {
      this.#loadSucceeded(await this.blogService.getBlogs());
    } catch {
      this.#loadFailed('Die Blog-Beiträge konnten nicht geladen werden.');
    }
  }

  setAuthor(author: string): void {
    this.#authorSelected(author);
  }

  toggleLike(blogId: number): void {
    this.#likeToggled(blogId);
  }

  // ── Reducer ────────────────────────────────────────────
  /** Ladevorgang beginnt: Spinner an, alte Fehlermeldung weg. */
  #loadStarted(): void {
    this.#state.update((state) => ({ ...state, loading: true, error: null }));
  }

  /** Daten sind da: Liste übernehmen, Spinner aus. */
  #loadSucceeded(blogs: Blog[]): void {
    this.#state.update((state) => ({ ...state, blogs, loading: false }));
  }

  /** Laden fehlgeschlagen: Fehlermeldung setzen, Spinner aus. */
  #loadFailed(message: string): void {
    this.#state.update((state) => ({ ...state, error: message, loading: false }));
  }

  /** Filter gewechselt. */
  #authorSelected(author: string): void {
    this.#state.update((state) => ({ ...state, selectedAuthor: author }));
  }

  /** Like umgeschaltet: Zaehler und Flag des betroffenen Blogs anpassen. */
  #likeToggled(blogId: number): void {
    this.#state.update((state) => ({
      ...state,
      blogs: state.blogs.map((blog) =>
        blog.id === blogId
          ? {
              ...blog,
              likedByMe: !blog.likedByMe,
              likes: blog.likedByMe ? blog.likes - 1 : blog.likes + 1,
            }
          : blog,
      ),
    }));
  }
}
