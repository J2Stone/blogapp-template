import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';

/** Die drei Codes, die der Callback des BFF setzt. Alles andere faellt auf 'failed' zurueck. */
const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Die Anmeldung wurde abgebrochen.',
  expired: 'Der Anmeldeversuch ist abgelaufen. Bitte erneut versuchen.',
  failed: 'Die Anmeldung ist fehlgeschlagen. Bitte erneut versuchen.',
};

/**
 * Login-Seite ohne Formular. Kein Benutzername-Feld, kein Passwort-Feld: das Passwort
 * wird auf der Anmeldeseite von Keycloak getippt. Hier bleiben ein Button und eine
 * Fehlerzeile, die aus dem Query-Parameter `error` gespeist wird.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  // Aus dem Query-String gebunden – braucht withComponentInputBinding() in provideRouter().
  readonly returnUrl = input('/');
  readonly error = input<string | undefined>();

  protected readonly authEnabled = environment.authEnabled;

  /** Unbekannte Codes kollabieren auf die generische Meldung, nie roher Text aus der URL. */
  protected readonly errorMessage = computed(() => {
    const error = this.error();
    if (!error) return null;
    return ERROR_MESSAGES[error] ?? ERROR_MESSAGES['failed'];
  });

  /**
   * Volle Navigation, kein fetch: der Browser muss dem Redirect des BFF zu Keycloak
   * folgen und danach das __pkce-Cookie zum Callback zurueckbringen. Ein fetch()
   * wuerde den Redirect intern verfolgen und der Login liefe ins Leere.
   */
  signIn(): void {
    const returnUrl = encodeURIComponent(this.returnUrl());
    window.location.href = `${environment.bffUrl}/auth/login?returnUrl=${returnUrl}`;
  }
}
