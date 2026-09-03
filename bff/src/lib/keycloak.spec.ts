import assert from 'node:assert/strict';
import { test } from 'node:test';

// keycloak.ts validiert seine Umgebung beim Import, deshalb erst setzen, dann dynamisch
// importieren. Der bewusste Schraegstrich am Ende testet gleich das Trimmen mit.
process.env.KEYCLOAK_URL ??= 'https://keycloak.test/realms/test';
process.env.KEYCLOAK_CLIENT_ID ??= 'test-client';
process.env.KEYCLOAK_CLIENT_SECRET ??= 'test-secret';
process.env.ALLOWED_ORIGIN ??= 'http://localhost:4200/';

const { createPkcePair, safeReturnUrl, REDIRECT_URI, buildAuthorizeUrl } =
  await import('./keycloak.js');

test('safeReturnUrl lehnt alles ab, was die Seite verlassen koennte', () => {
  for (const hostile of [
    'https://phishing.example/login',
    '//phishing.example/login',
    '/\\phishing.example',
    '',
    null,
    undefined,
  ]) {
    assert.equal(safeReturnUrl(hostile), '/', `should reject ${hostile}`);
  }
  assert.equal(safeReturnUrl('/add-blog'), '/add-blog');
});

test('createPkcePair leitet die S256-Challenge aus dem Verifier ab', async () => {
  const { createHash } = await import('node:crypto');
  const { verifier, challenge } = createPkcePair();

  assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(challenge, createHash('sha256').update(verifier).digest('base64url'));
  assert.notEqual(createPkcePair().verifier, verifier);
});

test('ein Schraegstrich am Ende von ALLOWED_ORIGIN erreicht die redirect_uri nicht', () => {
  assert.equal(REDIRECT_URI, 'http://localhost:4200/api/auth/callback');
});

test('die Authorize-URL verlangt immer S256', () => {
  const params = new URL(buildAuthorizeUrl('state-value', 'challenge-value')).searchParams;
  assert.equal(params.get('code_challenge_method'), 'S256');
  assert.ok(!params.get('scope')?.includes('offline_access'));
});
