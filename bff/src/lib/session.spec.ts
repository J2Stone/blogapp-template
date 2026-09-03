import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clearSessionCookies, parseSessionCookie, sessionCookies } from './session.js';

/** Baut den `Cookie:`-Header nach, den der Browser fuer diese Cookies zuruecksenden wuerde. */
function asHeader(cookies: { name: string; value: string }[]): string {
  return cookies.map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');
}

test('eine Session groesser als ein Cookie ueberlebt den Round Trip', () => {
  // Realistische Groesse: drei Keycloak-JWTs, von Iron versiegelt, ergaben 4857 Bytes.
  const sealed = 'Fe26.2**' + 'x'.repeat(4849);
  const cookies = sessionCookies(sealed);

  assert.ok(cookies.length > 1);
  for (const c of cookies) {
    assert.ok(c.value.length <= 3500, `${c.name} must stay under the 4 KB browser cap`);
  }
  assert.equal(parseSessionCookie(asHeader(cookies)), sealed);
});

test('eine kuerzere Session loescht die Rest-Chunks der vorherigen', () => {
  const previous = asHeader(sessionCookies('o'.repeat(8000))); // 3 Chunks
  const cookies = sessionCookies('n'.repeat(100), previous); // 1 Chunk

  assert.deepEqual(
    cookies.map((c) => [c.name, c.maxAge]),
    [
      ['__session.0', 86400],
      ['__session.1', 0],
      ['__session.2', 0],
    ],
  );

  const kept = cookies.filter((c) => c.maxAge !== 0);
  assert.equal(parseSessionCookie(asHeader(kept)), 'n'.repeat(100));
});

test('Loeschen laesst keinen vom Browser gesendeten Chunk stehen', () => {
  const cleared = clearSessionCookies(asHeader(sessionCookies('y'.repeat(8000))));
  assert.equal(cleared.length, 3);
  for (const c of cleared) {
    assert.equal(c.maxAge, 0);
  }
});
