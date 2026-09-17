import { Component, signal } from '@angular/core';
import {
  FormField,
  form,
  maxLength,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

/**
 * Signal Forms: das Model ist ein plain `signal()` mit den Rohdaten, `form()` legt
 * den Controller darueber (Validierung + Touched/Dirty/Valid-State). Beide Teile
 * bleiben getrennt – `blogModel()` liefert immer den aktuellen Formularwert.
 */
@Component({
  selector: 'app-blog-create',
  standalone: true,
  imports: [
    FormField,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './blog-create.component.html',
  styleUrl: './blog-create.component.scss',
})
export class BlogCreateComponent {
  protected readonly blogModel = signal({
    title: '',
    content: '',
    category: 'general',
  });

  protected readonly blogForm = form(this.blogModel, (s) => {
    required(s.title, { message: 'Titel ist erforderlich' });
    minLength(s.title, 3, { message: 'Titel muss mindestens 3 Zeichen lang sein' });
    maxLength(s.title, 100, { message: 'Titel darf hoechstens 100 Zeichen lang sein' });

    // 3a: Custom Validator – nur Buchstaben (inkl. Umlaute), Zahlen und Leerzeichen.
    validate(s.title, ({ value }) => {
      const title = value();
      if (title && !/^[a-zA-Z0-9äöüÄÖÜß ]+$/.test(title)) {
        return {
          kind: 'noSpecialChars',
          message: 'Titel darf nur Buchstaben, Zahlen und Leerzeichen enthalten',
        };
      }
      return null;
    });

    required(s.content, { message: 'Inhalt ist erforderlich' });
    minLength(s.content, 10, { message: 'Inhalt muss mindestens 10 Zeichen lang sein' });

    // 3b: Cross-Field – valueOf(s.title) macht den Validator reaktiv auf den Titel,
    // d.h. eine Titelaenderung validiert den Inhalt automatisch neu.
    validate(s.content, ({ value, valueOf }) => {
      const content = value();
      const title = valueOf(s.title);
      if (content && title && content.length < title.length * 2) {
        return {
          kind: 'contentTooShort',
          message: `Inhalt muss mindestens doppelt so lang wie der Titel sein (${title.length * 2} Zeichen)`,
        };
      }
      return null;
    });

    required(s.category, { message: 'Kategorie ist erforderlich' });
  });

  onSubmit(event: Event): void {
    event.preventDefault();

    // submit() fuehrt die Action nur aus, wenn alle Validierungen bestanden sind,
    // und markiert das Formular waehrenddessen als submitting.
    void submit(this.blogForm, async () => {
      console.log('Blog-Beitrag:', this.blogModel());
    });
  }
}
