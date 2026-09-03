import * as Iron from '@hapi/iron';
import type { Cookie } from '@azure/functions';
import type { TokenResponse } from './keycloak.js';

const SESSION_SECRET = process.env.SESSION_SECRET!;

const SESSION_COOKIE = '__session';
const SESSION_MAX_AGE = 86400;

export const PKCE_COOKIE = '__pkce';
const PKCE_MAX_AGE = 600;

// Browser begrenzen ein einzelnes Cookie auf 4 KB und verwerfen groessere kommentarlos.
// Drei JWTs plus Iron-Overhead liegen darueber, deshalb wird der versiegelte Wert auf
// `__session.0`, `__session.1`, … verteilt und beim Lesen wieder zusammengesetzt.
const CHUNK_SIZE = 3500;

// Browser verwerfen `Secure`-Cookies ueber plain http, lokal (http://localhost) muss das
// Flag also weg. Ohne gesetztes ALLOWED_ORIGIN (also in Azure) bleibt es secure.
const SECURE_COOKIE = !process.env.ALLOWED_ORIGIN?.startsWith('http://');

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

/** Login-Flow-State, lebt nur zwischen dem Redirect zu Keycloak und dem Callback. */
export interface PkceData {
  verifier: string;
  state: string;
  returnUrl: string;
}

async function seal(data: unknown): Promise<string> {
  return Iron.seal(data, SESSION_SECRET, Iron.defaults);
}

async function unseal<T>(sealed: string): Promise<T | null> {
  try {
    return (await Iron.unseal(sealed, SESSION_SECRET, Iron.defaults)) as T;
  } catch {
    return null;
  }
}

export async function sealSession(data: SessionData): Promise<string> {
  return seal(data);
}

export async function unsealSession(sealed: string): Promise<SessionData | null> {
  return unseal<SessionData>(sealed);
}

export async function sealPkce(data: PkceData): Promise<string> {
  return seal(data);
}

export async function unsealPkce(sealed: string): Promise<PkceData | null> {
  return unseal<PkceData>(sealed);
}

export function sessionFromTokens(tokens: TokenResponse): SessionData {
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
}

export function parseCookie(cookieHeader: string | null, name = SESSION_COOKIE): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  const raw = match.substring(name.length + 1);
  try {
    // Azure SWA URL-kodiert Cookie-Werte; ohne Dekodieren scheitert das Entsiegeln.
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function cookie(name: string, value: string, maxAge: number): Cookie {
  return {
    name,
    value,
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'Lax',
    path: '/',
    maxAge,
  };
}

export function sessionCookies(sealed: string, cookieHeader: string | null = null): Cookie[] {
  const chunks: Cookie[] = [];
  let i = 0;

  for (; i * CHUNK_SIZE < sealed.length; i++) {
    const value = sealed.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    chunks.push(cookie(`${SESSION_COOKIE}.${i}`, value, SESSION_MAX_AGE));
  }

  // Eine kuerzere Session laesst die hoeheren Chunks der vorherigen stehen; beim naechsten
  // Lesen wuerde dieser Rest angehaengt und das Entsiegeln schlaegt fehl.
  for (; parseCookie(cookieHeader, `${SESSION_COOKIE}.${i}`) !== null; i++) {
    chunks.push(cookie(`${SESSION_COOKIE}.${i}`, '', 0));
  }

  return chunks;
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
  const parts: string[] = [];
  for (let i = 0; ; i++) {
    const part = parseCookie(cookieHeader, `${SESSION_COOKIE}.${i}`);
    if (part === null) break;
    parts.push(part);
  }
  return parts.length > 0 ? parts.join('') : null;
}

/** Loescht jeden Chunk, den der Browser tatsaechlich geschickt hat. */
export function clearSessionCookies(cookieHeader: string | null): Cookie[] {
  const cleared: Cookie[] = [];
  for (let i = 0; parseCookie(cookieHeader, `${SESSION_COOKIE}.${i}`) !== null; i++) {
    cleared.push(cookie(`${SESSION_COOKIE}.${i}`, '', 0));
  }
  return cleared.length > 0 ? cleared : [cookie(`${SESSION_COOKIE}.0`, '', 0)];
}

export function pkceCookie(sealed: string): Cookie {
  return cookie(PKCE_COOKIE, sealed, PKCE_MAX_AGE);
}

export function clearPkceCookie(): Cookie {
  return cookie(PKCE_COOKIE, '', 0);
}

export function isSessionExpired(session: SessionData): boolean {
  return Date.now() >= session.expiresAt;
}
