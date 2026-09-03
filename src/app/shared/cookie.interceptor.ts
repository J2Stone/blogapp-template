import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Haengt an jeden Aufruf Richtung BFF das Session-Cookie und den CSRF-Header.
 *
 * Die fetch()-Aufrufe im AuthStore laufen nicht durch Interceptoren – deshalb setzen
 * checkSession() und logout() beides selbst.
 */
export const cookieInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.bffUrl)) {
    return next(
      req.clone({
        withCredentials: true,
        setHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
      }),
    );
  }
  return next(req);
};
