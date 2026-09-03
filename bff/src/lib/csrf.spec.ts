import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { HttpRequest } from '@azure/functions';

// csrf.ts liest ALLOWED_ORIGIN beim Import, also erst setzen, dann dynamisch importieren.
process.env.ALLOWED_ORIGIN ??= 'https://my-app.net';

const { checkCsrf } = await import('./csrf.js');

/** Gerade so viel `HttpRequest`, wie `checkCsrf` anfasst. */
function request(headers: Record<string, string>): HttpRequest {
  return { headers: new Headers(headers) } as unknown as HttpRequest;
}

const XHR = { 'X-Requested-With': 'XMLHttpRequest' };

test('ein Request aus der App geht durch', () => {
  assert.equal(checkCsrf(request({ ...XHR, Origin: 'https://my-app.net' })), null);
});

test('ein Form-Post von einer fremden Seite hat kein X-Requested-With', () => {
  const result = checkCsrf(request({ Origin: 'https://evil.example' }));
  assert.equal(result?.status, 403);
});

test('eine Schwester-Subdomain ist same-site fuers Cookie, aber keine erlaubte Origin', () => {
  // SameSite=Lax wuerde das Session-Cookie hier noch anhaengen – die Origin-Pruefung
  // ist das, was den Request stoppt.
  const result = checkCsrf(request({ ...XHR, Origin: 'https://evil.my-app.net' }));
  assert.equal(result?.status, 403);
});

test('ein Client ohne Origin-Header ist nicht der CSRF-Fall', () => {
  assert.equal(checkCsrf(request(XHR)), null);
});
