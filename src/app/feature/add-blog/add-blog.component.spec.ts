import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AddBlogComponent } from './add-blog.component';
import { AuthStore } from '../../shared/auth.store';
import { BlogService } from '../../shared/blog.service';
import { BlogStateService } from '../../shared/blog-state.service';

/** save() und die Signals, die es liest – im Template sind sie protected. */
interface Form {
  title: { set(v: string): void };
  content: { set(v: string): void };
  error(): string | null;
}

function setup(createBlog: () => Promise<unknown>) {
  const blogService = { createBlog: vi.fn(createBlog) };
  const blogState = { loadBlogs: vi.fn(async () => undefined) };
  const router = { navigate: vi.fn(async () => true) };

  TestBed.configureTestingModule({
    imports: [AddBlogComponent],
    providers: [
      { provide: BlogService, useValue: blogService },
      { provide: BlogStateService, useValue: blogState },
      { provide: Router, useValue: router },
      { provide: AuthStore, useValue: { user: () => null } },
    ],
  });
  const component = TestBed.createComponent(AddBlogComponent).componentInstance;
  return { component, form: component as unknown as Form, blogService, blogState, router };
}

describe('AddBlogComponent.save', () => {
  it('schickt nichts, solange Titel oder Inhalt leer sind', async () => {
    const { component, form, blogService } = setup(async () => ({ id: 1 }));
    form.title.set('   ');
    form.content.set('Inhalt');

    await component.save();

    expect(blogService.createBlog).not.toHaveBeenCalled();
  });

  it('speichert getrimmt, laedt die Liste neu und geht zur Uebersicht', async () => {
    const { component, form, blogService, blogState, router } = setup(async () => ({ id: 1 }));
    form.title.set('  Titel  ');
    form.content.set(' Inhalt ');

    await component.save();

    expect(blogService.createBlog).toHaveBeenCalledWith({ title: 'Titel', content: 'Inhalt' });
    expect(blogState.loadBlogs).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('zeigt einen Fehler und bleibt auf der Seite, wenn das Speichern scheitert', async () => {
    const { component, form, router } = setup(async () => null);
    form.title.set('Titel');
    form.content.set('Inhalt');

    await component.save();

    expect(form.error()).toBe('Der Beitrag konnte nicht gespeichert werden.');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
