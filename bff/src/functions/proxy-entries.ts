import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { proxyToBackend } from '../lib/proxy.js';
import { checkCsrf } from '../lib/csrf.js';
import { corsHeaders, handlePreflight } from '../lib/cors.js';

/**
 * GET (oeffentlich) und POST (Session + CSRF) auf derselben Route. Zwei Functions
 * duerfen sich in Azure Functions keine Route teilen, auch nicht mit verschiedenen
 * Methoden – deshalb liegen beide Methoden in einer Datei.
 */
async function proxyEntries(request: HttpRequest): Promise<HttpResponseInit> {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  if (request.method === 'POST') {
    const csrfError = checkCsrf(request);
    // CORS-Header auch auf Fehlerantworten, sonst blockt der Browser die 403 komplett
    // und das Frontend sieht nur einen undurchsichtigen Netzwerkfehler.
    if (csrfError) return { ...csrfError, headers: corsHeaders };
  }

  const result = await proxyToBackend(request, '/entries', request.method);

  return {
    status: result.status,
    jsonBody: result.body,
    headers: corsHeaders,
    cookies: result.cookies.length > 0 ? result.cookies : undefined,
  };
}

app.http('proxy-entries', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'entries',
  handler: proxyEntries,
});
