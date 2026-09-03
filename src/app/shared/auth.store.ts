import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface UserInfo {
  preferred_username: string;
  email: string;
  /** Fehlt, wenn im Keycloak-Profil kein Vor-/Nachname hinterlegt ist. */
  name?: string;
  roles: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  loading: boolean;
}

// loading startet auf true: der Session-Check laeuft bereits, wenn die App hochfaehrt.
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
};

/**
 * Auth-State aus Sicht des Browsers. Ein Token sieht dieser Store nie – es liegt im
 * HTTP-Only-Cookie beim BFF. Er weiss nur, was /auth/me ihm ueber den User erzaehlt.
 *
 * Es gibt bewusst keine login(username, password)-Methode: der Login ist eine
 * Browser-Navigation zum BFF und gehoert damit auf die Login-Seite, nicht hierher.
 * Das Passwort wird auf der Keycloak-Seite getippt, nie in dieser App.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  // Privat: schreiben darf nur dieser Store ueber seine Actions.
  readonly #state = signal<AuthState>(initialState);

  // ── Derived State ──────────────────────────────────────
  readonly isAuthenticated = computed(() => this.#state().isAuthenticated);
  readonly user = computed(() => this.#state().user);
  readonly loading = computed(() => this.#state().loading);
  readonly roles = computed(() => this.#state().user?.roles ?? []);

  /**
   * Wird aufgeloest, sobald der erste Session-Check durch ist. Der Guard wartet darauf
   * mit `await` – jeder Login endet in einem vollen Reload, der Guard rennt also auf
   * jeder geschuetzten Route gegen diesen Check. Kein Polling auf loading().
   */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.checkSession();
  }

  // ── Actions ────────────────────────────────────────────
  /** Fragt den BFF, wer eingeloggt ist. credentials: 'include' schickt das Session-Cookie mit. */
  async checkSession(): Promise<void> {
    // Ohne BFF (Production-Deployment) gar nicht erst fragen: der Aufruf ginge ins Leere.
    if (!environment.authEnabled) {
      this.#sessionChecked(null);
      return;
    }

    try {
      const response = await fetch(`${environment.bffUrl}/auth/me`, {
        credentials: 'include',
      });
      const data = (await response.json()) as { isAuthenticated: boolean; user: UserInfo | null };
      this.#sessionChecked(data.isAuthenticated ? data.user : null);
    } catch (error) {
      console.error('Session konnte nicht geprueft werden:', error);
      this.#sessionChecked(null);
    }
  }

  /**
   * Verlaesst die App: der BFF beendet die Session und liefert die Keycloak-Logout-URL,
   * dorthin muss der Browser navigieren. Sonst bleibt die SSO-Session bestehen und der
   * naechste Login kommt ohne Passwortabfrage durch – das sieht aus wie ein Bug.
   *
   * Wer logout() aufruft, darf danach nicht mehr routen: wir sind bereits unterwegs.
   */
  async logout(): Promise<void> {
    try {
      const response = await fetch(`${environment.bffUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const { logoutUrl } = (await response.json()) as { logoutUrl: string };
      window.location.href = logoutUrl;
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error);
      window.location.href = '/';
    }
  }

  // ── Reducer ────────────────────────────────────────────
  /** Session-Check abgeschlossen: User uebernehmen (oder anonym bleiben), Spinner aus. */
  #sessionChecked(user: UserInfo | null): void {
    this.#state.set({ isAuthenticated: user !== null, user, loading: false });
  }
}
