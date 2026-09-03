import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AuthStore, UserInfo } from './auth.store';

const user: UserInfo = {
  preferred_username: 'ada',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  roles: ['user'],
};

function mockFetch(response: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue({ json: async () => response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('AuthStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uebernimmt den User aus /auth/me und schickt das Cookie mit', async () => {
    const fetchMock = mockFetch({ isAuthenticated: true, user });

    const store = TestBed.inject(AuthStore);
    await store.ready;

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', { credentials: 'include' });
    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()).toEqual(user);
    expect(store.roles()).toEqual(['user']);
    expect(store.loading()).toBe(false);
  });

  it('bleibt anonym, wenn niemand eingeloggt ist', async () => {
    mockFetch({ isAuthenticated: false, user: null });

    const store = TestBed.inject(AuthStore);
    await store.ready;

    expect(store.isAuthenticated()).toBe(false);
    expect(store.roles()).toEqual([]);
    expect(store.loading()).toBe(false);
  });

  it('bleibt anonym, wenn der BFF nicht erreichbar ist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const store = TestBed.inject(AuthStore);
    await store.ready;

    expect(store.isAuthenticated()).toBe(false);
    expect(store.loading()).toBe(false);
  });

  it('logout schickt den CSRF-Header und navigiert zur Keycloak-Logout-URL', async () => {
    const fetchMock = mockFetch({ isAuthenticated: false, user: null });
    const store = TestBed.inject(AuthStore);
    await store.ready;

    fetchMock.mockResolvedValue({ json: async () => ({ logoutUrl: 'https://keycloak/logout' }) });
    // window.location ist in jsdom nicht beschreibbar, deshalb ersetzt durch ein Stub-Objekt.
    const location = { href: '' };
    vi.stubGlobal('location', location);

    await store.logout();

    expect(fetchMock).toHaveBeenLastCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    expect(location.href).toBe('https://keycloak/logout');
  });
});
