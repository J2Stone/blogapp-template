import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BlogCreateComponent } from './blog-create.component';

interface BlogModel {
  title: string;
  content: string;
  category: string;
}

type FieldName = 'title' | 'content' | 'category';

interface ValidationErrorLike {
  kind: string;
  message?: string;
}

interface FieldStateLike {
  errors: () => ValidationErrorLike[];
  invalid: () => boolean;
  markAsTouched: () => void;
}

interface FormStateLike {
  invalid: () => boolean;
  valid: () => boolean;
}

interface ModelSignalLike {
  (): BlogModel;
  update(fn: (current: BlogModel) => BlogModel): void;
}

/**
 * blogModel und blogForm sind in der Komponente `protected` – fuer den Test wird
 * die Instanz auf die tatsaechliche Form der beiden Felder gecastet.
 */
interface Internals {
  blogModel: ModelSignalLike;
  blogForm: Record<FieldName, () => FieldStateLike> & (() => FormStateLike);
}

describe('BlogCreateComponent', () => {
  let fixture: ComponentFixture<BlogCreateComponent>;
  let component: BlogCreateComponent & Internals;

  const setValue = (field: FieldName, value: string) => {
    component.blogModel.update((current) => ({ ...current, [field]: value }));
    TestBed.tick();
  };

  const kinds = (field: FieldName) =>
    component.blogForm[field]()
      .errors()
      .map((error) => error.kind);

  const renderedErrors = () =>
    Array.from(fixture.nativeElement.querySelectorAll('mat-error')).map((el) =>
      (el as HTMLElement).textContent?.trim(),
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogCreateComponent);
    component = fixture.componentInstance as BlogCreateComponent & Internals;
    await fixture.whenStable();
  });

  it('startet mit den geforderten Startwerten', () => {
    expect(component.blogModel()).toEqual({
      title: '',
      content: '',
      category: 'general',
    });
  });

  it('ist initial ungueltig, der Submit-Button also disabled', () => {
    expect(component.blogForm().invalid()).toBe(true);

    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="blog-create-submit"]',
    );
    expect(button.disabled).toBe(true);
  });

  it('meldet required, minLength und maxLength auf dem Titel', () => {
    expect(kinds('title')).toContain('required');

    setValue('title', 'ab');
    expect(kinds('title')).toContain('minLength');

    setValue('title', 'a'.repeat(101));
    expect(kinds('title')).toContain('maxLength');
  });

  it('meldet required und minLength auf dem Inhalt', () => {
    expect(kinds('content')).toContain('required');

    setValue('content', 'zu kurz');
    expect(kinds('content')).toContain('minLength');
  });

  it('zeigt Fehler erst nach Beruehrung des Feldes an', async () => {
    setValue('title', 'ab');
    expect(renderedErrors()).toEqual([]);

    component.blogForm.title().markAsTouched();
    await fixture.whenStable();

    expect(renderedErrors()).toContain('Titel muss mindestens 3 Zeichen lang sein');
  });

  it('3a: lehnt Sonderzeichen im Titel ab, erlaubt aber Umlaute', () => {
    setValue('title', 'Mein Titel!');
    expect(kinds('title')).toContain('noSpecialChars');

    setValue('title', 'Grüße aus Bärn 2026');
    expect(kinds('title')).not.toContain('noSpecialChars');
  });

  it('3b: verlangt doppelte Titellaenge im Inhalt', () => {
    setValue('title', 'Kurzer Titel'); // 12 Zeichen -> 24 gefordert
    setValue('content', 'Zu kurzer Inhalt'); // 16 Zeichen
    expect(kinds('content')).toContain('contentTooShort');

    setValue('content', 'Dieser Inhalt ist lang genug fuer den Titel.');
    expect(kinds('content')).not.toContain('contentTooShort');
  });

  it('3b: validiert den Inhalt neu, wenn sich der Titel aendert', () => {
    setValue('title', 'Titel'); // 5 Zeichen -> 10 gefordert
    setValue('content', 'Zwoelf Zeichen!'); // 15 Zeichen, reicht
    expect(kinds('content')).not.toContain('contentTooShort');

    // Nur der Titel wird laenger – der Content-Validator muss trotzdem neu laufen.
    setValue('title', 'Ein deutlich laengerer Titel'); // 28 Zeichen -> 56 gefordert
    expect(kinds('content')).toContain('contentTooShort');
  });

  it('submit() fuehrt die Action nur bei gueltigem Formular aus', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    component.onSubmit(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    expect(log).not.toHaveBeenCalled();

    setValue('title', 'Mein Blog Titel');
    setValue('content', 'Ein ausreichend langer Inhalt fuer diesen Blogbeitrag.');
    expect(component.blogForm().valid()).toBe(true);

    component.onSubmit(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    expect(log).toHaveBeenCalledWith('Blog-Beitrag:', {
      title: 'Mein Blog Titel',
      content: 'Ein ausreichend langer Inhalt fuer diesen Blogbeitrag.',
      category: 'general',
    });

    log.mockRestore();
  });

  it('ruft preventDefault auf dem Submit-Event auf', () => {
    const event = new Event('submit', { cancelable: true });
    component.onSubmit(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
