import { HttpRequest, HttpResponseInit } from '@azure/functions';

// Derselbe Wert wie in den CORS-Headern. Ein abschliessender Schraegstrich wuerde nie
// auf den Origin-Header passen, den der Browser immer ohne Slash sendet.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN!.replace(/\/+$/, '');

function reject(reason: string): HttpResponseInit {
  return { status: 403, jsonBody: { error: reason } };
}

/**
 * Zwei unabhaengige Pruefungen gegen Cross-Site-Requests:
 *
 * 1. `X-Requested-With` kann ein Form-Post oder ein <img>-Tag nicht setzen, und ein
 *    cross-origin `fetch`, der es setzt, loest einen Preflight aus, den unser
 *    CORS-Handler nur fuer die erlaubte Origin beantwortet.
 * 2. `Origin` wird serverseitig verglichen. Das haengt nicht davon ab, dass der
 *    Browser CORS durchsetzt, und faellt geschlossen aus, falls die CORS-Header je
 *    auf die Request-Origin gelockert werden. Es schliesst zudem die Luecke von
 *    `SameSite=Lax`, dessen Grenze die *Site* ist – eine Schwester-Subdomain gilt
 *    als same-site und bekaeme das Cookie sonst angehaengt.
 *
 * Requests ohne `Origin`-Header (curl, Postman) bestehen Pruefung 2: sie tragen keine
 * ambienten Cookies und sind damit nicht der CSRF-Fall. Browser senden bei POST immer
 * einen Origin.
 */
export function checkCsrf(request: HttpRequest): HttpResponseInit | null {
  if (request.headers.get('x-requested-with') !== 'XMLHttpRequest') {
    return reject('Missing or invalid X-Requested-With header');
  }

  const origin = request.headers.get('origin');
  if (origin !== null && origin !== ALLOWED_ORIGIN) {
    return reject('Origin not allowed');
  }

  return null;
}
