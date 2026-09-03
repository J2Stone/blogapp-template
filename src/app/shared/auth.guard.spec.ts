import { TestBed } from '@angular/core/testing';
import { PartialMatchRouteSnapshot, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthStore } from './auth.store';

/** Der Guard bekommt die Segmente der Route, die er gerade prueft. */
const segments = [new UrlSegment('add-blog', {})];
const route: Route = {};
// Der Guard schaut den Snapshot nicht an; die Signatur von CanMatchFn verlangt ihn trotzdem.
const snapshot = {} as PartialMatchRouteSnapshot;

function provideAuthStore(store: Partial<AuthStore>) {
  TestBed.configureTestingModule({
    providers: [{ provide: AuthStore, useValue: store }],
  });
}

function runGuard(): Promise<boolean | UrlTree> {
  return TestBed.runInInjectionContext(
    () => authGuard(route, segments, snapshot) as Promise<boolean | UrlTree>,
  );
}

describe('authGuard', () => {
  it('laesst eingeloggte User mit der Rolle user durch', async () => {
    provideAuthStore({
      ready: Promise.resolve(),
      isAuthenticated: () => true,
      roles: () => ['user'],
    } as unknown as AuthStore);

    await expect(runGuard()).resolves.toBe(true);
  });

  it('schickt anonyme Besucher mit returnUrl auf die Login-Seite', async () => {
    provideAuthStore({
      ready: Promise.resolve(),
      isAuthenticated: () => false,
      roles: () => [],
    } as unknown as AuthStore);

    const result = await runGuard();

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Fadd-blog',
    );
  });

  it('schickt eingeloggte User ohne die Rolle user ebenfalls weg', async () => {
    provideAuthStore({
      ready: Promise.resolve(),
      isAuthenticated: () => true,
      roles: () => ['guest'],
    } as unknown as AuthStore);

    expect(await runGuard()).not.toBe(true);
  });

  it('wartet auf den laufenden Session-Check, statt zu pollen', async () => {
    let resolveReady!: () => void;
    const ready = new Promise<void>((resolve) => (resolveReady = resolve));
    let authenticated = false;

    provideAuthStore({
      ready,
      isAuthenticated: () => authenticated,
      roles: () => ['user'],
    } as unknown as AuthStore);

    const decision = runGuard();
    // Der Check laeuft noch: der Guard darf hier noch nicht entschieden haben.
    expect(await Promise.race([decision, Promise.resolve('pending')])).toBe('pending');

    authenticated = true;
    resolveReady();

    await expect(decision).resolves.toBe(true);
  });
});
