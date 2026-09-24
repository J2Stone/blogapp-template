import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

// Die Module lesen ihre Umgebung beim Import, deshalb erst setzen, dann dynamisch importieren.
process.env.KEYCLOAK_URL ??= 'https://keycloak.test/realms/test';
process.env.KEYCLOAK_CLIENT_ID ??= 'test-client';
process.env.KEYCLOAK_CLIENT_SECRET ??= 'test-secret';
process.env.ALLOWED_ORIGIN ??= 'http://localhost:4200';
process.env.SESSION_SECRET ??= 'a-test-secret-that-is-at-least-32-chars';
process.env.BACKEND_API_URL ??= 'https://backend.test';

const { sealSession, sealPkce, sessionCookies, PKCE_COOKIE } = await import('../lib/session.js');
const { proxyToBackend } = await import('../lib/proxy.js');
const { authCallback } = await import('./auth-callback.js');
const { authMe } = await import('./auth-me.js');
const { authLogout } = await import('./auth-logout.js');
const { proxyEntries } = await import('./proxy-entries.js');
const { proxyEntryById } = await import('./proxy-entry-by-id.js');

afterEach(() => mock.restoreAll());

// --- Hilfen ---------------------------------------------------------------------------

/** Unsigniertes JWT: auth-me dekodiert nur, die Signatur prueft erst das Backend. */
function jwt(claims: Record<string, unknown>): string {
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${part({ alg: 'none' })}.${part(claims)}.`;
}

const TOKENS = {
  access_token: jwt({ preferred_username: 'ada', realm_access: { roles: ['user'] } }),
  refresh_token: 'refresh-2',
  id_token: 'id-2',
  expires_in: 300,
};

/** Cookie-Header, den der Browser fuer eine gueltige (oder abgelaufene) Session senden wuerde. */
async function sessionHeader(expired = false): Promise<string> {
  const sealed = await sealSession({
    accessToken: jwt({ preferred_username: 'ada', realm_access: { roles: ['user'] } }),
    refreshToken: 'refresh-1',
    idToken: 'id-1',
    expiresAt: Date.now() + (expired ? -1000 : 60_000),
  });
  return sessionCookies(sealed)
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');
}

function request(
  init: { method?: string; path?: string; headers?: Record<string, string>; body?: string } = {},
  params: Record<string, string> = {},
): HttpRequest {
  return new HttpRequest({
    method: init.method ?? 'GET',
    url: `http://localhost/api${init.path ?? '/'}`,
    headers: init.headers ?? {},
    params,
    body: init.body ? { string: init.body } : undefined,
  });
}

const CSRF = { 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:4200' };

/** Ersetzt fetch; jede Antwort kommt aus `respond`, alle Aufrufe landen in `calls`. */
function mockFetch(respond: (url: string) => Response = () => Response.json({ ok: true })) {
  const calls: { url: string; init?: RequestInit }[] = [];
  mock.method(globalThis, 'fetch', async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return respond(String(url));
  });
  return calls;
}

const tokenEndpoint = (url: string) => url.endsWith('/protocol/openid-connect/token');

const context = new InvocationContext();

function location(res: HttpResponseInit): string | undefined {
  return (res.headers as Record<string, string> | undefined)?.Location;
}

function cookieNames(res: { cookies?: { name: string; maxAge?: number }[] }, maxAge?: number) {
  return (res.cookies ?? [])
    .filter((c) => maxAge === undefined || c.maxAge === maxAge)
    .map((c) => c.name);
}

// --- proxyToBackend -------------------------------------------------------------------

test('proxy: anonymes GET geht ohne Token samt Query-String ans Backend', async () => {
  const calls = mockFetch(() => Response.json([{ id: 1 }]));
  const res = await proxyToBackend(request({ path: '/entries?page=2' }), '/entries', 'GET');

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, [{ id: 1 }]);
  assert.equal(calls[0].url, 'https://backend.test/entries?page=2');
  assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, undefined);
});

test('proxy: schreibende Requests ohne Session erreichen das Backend nie', async () => {
  const calls = mockFetch();
  const res = await proxyToBackend(request({ method: 'POST', body: '{}' }), '/entries', 'POST');

  assert.equal(res.status, 401);
  assert.equal(calls.length, 0);
});

test('proxy: mit Session gehen Bearer Token und Body mit', async () => {
  const calls = mockFetch(() => Response.json({ id: 9 }, { status: 201 }));
  const req = request({
    method: 'POST',
    headers: { cookie: await sessionHeader() },
    body: '{"title":"t"}',
  });
  const res = await proxyToBackend(req, '/entries', 'POST');

  assert.equal(res.status, 201);
  assert.match((calls[0].init?.headers as Record<string, string>).Authorization, /^Bearer /);
  assert.equal(calls[0].init?.body, '{"title":"t"}');
  assert.deepEqual(res.cookies, []);
});

test('proxy: eine abgelaufene Session wird refresht und neu gesetzt', async () => {
  const calls = mockFetch((url) =>
    tokenEndpoint(url) ? Response.json(TOKENS) : Response.json({}),
  );
  const res = await proxyToBackend(
    request({ headers: { cookie: await sessionHeader(true) } }),
    '/entries',
    'GET',
  );

  assert.ok(tokenEndpoint(calls[0].url));
  assert.equal(
    (calls[1].init?.headers as Record<string, string>).Authorization,
    `Bearer ${TOKENS.access_token}`,
  );
  assert.deepEqual(cookieNames(res, 86400), ['__session.0']);
});

test('proxy: scheitert der Refresh, ist die Session weg', async () => {
  mockFetch(() => Response.json({ error_description: 'Session not active' }, { status: 400 }));
  const res = await proxyToBackend(
    request({ headers: { cookie: await sessionHeader(true) } }),
    '/entries',
    'GET',
  );

  assert.equal(res.status, 401);
  assert.deepEqual(cookieNames(res, 0), ['__session.0']);
});

// --- auth-callback --------------------------------------------------------------------

async function pkceHeader(state = 'state-1'): Promise<string> {
  const sealed = await sealPkce({ verifier: 'verifier', state, returnUrl: '/add-blog' });
  return `${PKCE_COOKIE}=${encodeURIComponent(sealed)}`;
}

test('callback: lehnt Keycloak ab, geht es mit Grund zurueck zum Login', async () => {
  const res = await authCallback(request({ path: '/auth/callback?error=access_denied' }), context);
  assert.equal(location(res), '/login?error=access_denied');
});

test('callback: ohne PKCE-Cookie ist der Login-Versuch abgelaufen', async () => {
  const res = await authCallback(request({ path: '/auth/callback?code=c&state=state-1' }), context);
  assert.equal(location(res), '/login?error=expired');
});

test('callback: ein fremder state wird abgewiesen, ohne Code einzuloesen', async () => {
  const calls = mockFetch();
  const req = request({
    path: '/auth/callback?code=c&state=evil',
    headers: { cookie: await pkceHeader() },
  });
  const res = await authCallback(req, context);

  assert.equal(location(res), '/login?error=failed');
  assert.equal(calls.length, 0);
});

test('callback: gueltiger Code fuehrt mit Session zur returnUrl', async () => {
  mockFetch(() => Response.json(TOKENS));
  const req = request({
    path: '/auth/callback?code=c&state=state-1',
    headers: { cookie: await pkceHeader() },
  });
  const res = await authCallback(req, context);

  assert.equal(location(res), '/add-blog');
  assert.deepEqual(cookieNames(res, 86400), ['__session.0']);
  assert.deepEqual(cookieNames(res, 0), [PKCE_COOKIE]);
});

test('callback: scheitert der Token-Tausch, geht es zurueck zum Login', async () => {
  mockFetch(() => Response.json({}, { status: 400 }));
  const req = request({
    path: '/auth/callback?code=c&state=state-1',
    headers: { cookie: await pkceHeader() },
  });
  assert.equal(location(await authCallback(req, context)), '/login?error=failed');
});

// --- auth-me --------------------------------------------------------------------------

test('me: anonyme Besucher bekommen 200 statt 401', async () => {
  const res = await authMe(request());
  assert.equal(res.status, 200);
  assert.deepEqual(res.jsonBody, { isAuthenticated: false, user: null });
});

test('me: ein manipuliertes Cookie gilt als abgemeldet und wird geloescht', async () => {
  const res = await authMe(request({ headers: { cookie: '__session.0=Fe26.2**kaputt' } }));
  assert.equal((res.jsonBody as { isAuthenticated: boolean }).isAuthenticated, false);
  assert.deepEqual(cookieNames(res, 0), ['__session.0']);
});

test('me: liefert User und Rollen aus dem Access Token', async () => {
  const res = await authMe(request({ headers: { cookie: await sessionHeader() } }));
  assert.deepEqual(res.jsonBody, {
    isAuthenticated: true,
    user: { preferred_username: 'ada', email: undefined, name: undefined, roles: ['user'] },
  });
});

test('me: eine abgelaufene Session wird refresht', async () => {
  mockFetch(() => Response.json(TOKENS));
  const res = await authMe(request({ headers: { cookie: await sessionHeader(true) } }));
  assert.equal((res.jsonBody as { isAuthenticated: boolean }).isAuthenticated, true);
  assert.deepEqual(cookieNames(res, 86400), ['__session.0']);
});

test('me: scheitert der Refresh, ist der User abgemeldet', async () => {
  mockFetch(() => Response.json({}, { status: 400 }));
  const res = await authMe(request({ headers: { cookie: await sessionHeader(true) } }));
  assert.equal((res.jsonBody as { isAuthenticated: boolean }).isAuthenticated, false);
});

// --- auth-logout ----------------------------------------------------------------------

test('logout: ohne CSRF-Header kein Logout', async () => {
  const res = await authLogout(request({ method: 'POST' }));
  assert.equal(res.status, 403);
});

test('logout: widerruft das Refresh Token und liefert die Keycloak-Logout-URL', async () => {
  const calls = mockFetch(() => new Response(null, { status: 200 }));
  const res = await authLogout(
    request({ method: 'POST', headers: { ...CSRF, cookie: await sessionHeader() } }),
  );

  assert.ok(calls[0].url.endsWith('/protocol/openid-connect/revoke'));
  assert.match((res.jsonBody as { logoutUrl: string }).logoutUrl, /logout\?.*id_token_hint=id-1/);
  assert.deepEqual(cookieNames(res, 0), ['__session.0']);
});

test('logout: ohne Session geht es direkt zurueck zur App', async () => {
  const res = await authLogout(request({ method: 'POST', headers: CSRF }));
  assert.deepEqual(res.jsonBody, { logoutUrl: 'http://localhost:4200/' });
});

// --- proxy-entries / proxy-entry-by-id ------------------------------------------------

test('entries: Preflight wird ohne Backend beantwortet', async () => {
  const res = await proxyEntries(request({ method: 'OPTIONS' }));
  assert.equal(res.status, 204);
});

test('entries: POST ohne CSRF-Header erreicht das Backend nicht', async () => {
  const calls = mockFetch();
  const res = await proxyEntries(
    request({ method: 'POST', headers: { cookie: await sessionHeader() } }),
  );
  assert.equal(res.status, 403);
  assert.equal(calls.length, 0);
});

test('entries: GET reicht Status und Body durch', async () => {
  mockFetch(() => Response.json({ data: [] }));
  const res = await proxyEntries(request({ path: '/entries' }));
  assert.equal(res.status, 200);
  assert.deepEqual(res.jsonBody, { data: [] });
});

test('entry by id: DELETE ohne CSRF-Header erreicht das Backend nicht', async () => {
  const calls = mockFetch();
  const res = await proxyEntryById(request({ method: 'DELETE' }, { id: '7' }));
  assert.equal(res.status, 403);
  assert.equal(calls.length, 0);
});

test('entry by id: GET geht an /entries/{id}', async () => {
  const calls = mockFetch(() => Response.json({ id: 7 }));
  const res = await proxyEntryById(request({ path: '/entries/7' }, { id: '7' }));
  assert.equal(calls[0].url, 'https://backend.test/entries/7');
  assert.deepEqual(res.jsonBody, { id: 7 });
});
