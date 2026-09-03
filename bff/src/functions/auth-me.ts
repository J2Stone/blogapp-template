import { app, Cookie, HttpRequest, HttpResponseInit } from '@azure/functions';
import {
  parseSessionCookie,
  unsealSession,
  isSessionExpired,
  sealSession,
  sessionCookies,
  sessionFromTokens,
  clearSessionCookies,
} from '../lib/session.js';
import { refreshTokens } from '../lib/keycloak.js';
import { corsHeaders, handlePreflight } from '../lib/cors.js';
import { decodeJwt } from 'jose';

/**
 * decodeJwt() prueft die Signatur nicht, und das ist in Ordnung: das Token kam direkt
 * von Keycloak ueber HTTPS in ein versiegeltes Cookie, und das Backend prueft es echt.
 */
function userFromToken(accessToken: string) {
  const claims = decodeJwt(accessToken) as Record<string, unknown>;
  const realmAccess = claims.realm_access as { roles: string[] } | undefined;

  return {
    preferred_username: claims.preferred_username,
    email: claims.email,
    name: claims.name,
    roles: realmAccess?.roles ?? [],
  };
}

async function authMe(request: HttpRequest): Promise<HttpResponseInit> {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const cookieHeader = request.headers.get('cookie');
  const sealed = parseSessionCookie(cookieHeader);

  // Nie 401 fuer "nicht eingeloggt": ein anonymer Besucher ist ein normaler Zustand.
  if (!sealed) {
    return {
      status: 200,
      jsonBody: { isAuthenticated: false, user: null },
      headers: corsHeaders,
    };
  }

  let session = await unsealSession(sealed);
  if (!session) {
    return {
      status: 200,
      jsonBody: { isAuthenticated: false, user: null },
      headers: corsHeaders,
      cookies: clearSessionCookies(cookieHeader),
    };
  }

  const extraCookies: Cookie[] = [];

  if (isSessionExpired(session)) {
    try {
      const tokens = await refreshTokens(session.refreshToken);
      session = sessionFromTokens(tokens);
      extraCookies.push(...sessionCookies(await sealSession(session), cookieHeader));
    } catch {
      // Keycloaks SSO Session Idle/Max ist abgelaufen – die Session ist wirklich vorbei.
      return {
        status: 200,
        jsonBody: { isAuthenticated: false, user: null },
        headers: corsHeaders,
        cookies: clearSessionCookies(cookieHeader),
      };
    }
  }

  return {
    status: 200,
    jsonBody: { isAuthenticated: true, user: userFromToken(session.accessToken) },
    headers: corsHeaders,
    cookies: extraCookies.length > 0 ? extraCookies : undefined,
  };
}

app.http('auth-me', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: authMe,
});
