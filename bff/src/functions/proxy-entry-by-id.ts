import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { proxyToBackend } from '../lib/proxy.js';
import { checkCsrf } from '../lib/csrf.js';
import { corsHeaders, handlePreflight } from '../lib/cors.js';

/** `{id:int}` in der Route sorgt dafuer, dass nur numerische IDs ueberhaupt matchen. */
async function proxyEntryById(request: HttpRequest): Promise<HttpResponseInit> {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  if (request.method !== 'GET') {
    const csrfError = checkCsrf(request);
    if (csrfError) return { ...csrfError, headers: corsHeaders };
  }

  const id = request.params.id;
  const result = await proxyToBackend(request, `/entries/${id}`, request.method);

  return {
    status: result.status,
    jsonBody: result.body,
    headers: corsHeaders,
    cookies: result.cookies.length > 0 ? result.cookies : undefined,
  };
}

app.http('proxy-entry-by-id', {
  methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'entries/{id:int}',
  handler: proxyEntryById,
});
