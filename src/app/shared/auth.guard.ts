import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { AuthStore } from './auth.store';
import { environment } from '../../environments/environment';

/** Rolle, die das Backend fuer schreibende Zugriffe verlangt. */
const REQUIRED_ROLE = 'user';

/**
 * canMatch statt canActivate: die Pruefung laeuft, *bevor* die Route matcht, der
 * Lazy-Chunk der geschuetzten Seite wird also gar nicht erst heruntergeladen.
 *
 * Die Rollenpruefung hier ist UX, keine Sicherheit – sie haelt User von Routen fern,
 * die ohnehin scheitern wuerden. Verbindlich entscheiden BFF und Backend.
 */
export const authGuard: CanMatchFn = async (_route, segments: UrlSegment[]) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Ohne BFF gibt es keinen Login – dann ist die geschuetzte Route schlicht nicht da.
  if (!environment.authEnabled) {
    return router.createUrlTree(['/']);
  }

  // Auf den laufenden Session-Check warten statt auf loading() zu pollen.
  await authStore.ready;

  if (authStore.isAuthenticated() && authStore.roles().includes(REQUIRED_ROLE)) {
    return true;
  }

  const returnUrl = '/' + segments.map((segment) => segment.path).join('/');
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};
