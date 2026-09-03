import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { AuthStore } from './shared/auth.store';

/** AuthStore, der im gewuenschten Zustand stehen bleibt, statt den BFF zu fragen. */
function authStoreStub(state: { loading: boolean; isAuthenticated: boolean }) {
  return {
    provide: AuthStore,
    useValue: {
      ready: Promise.resolve(),
      loading: () => state.loading,
      isAuthenticated: () => state.isAuthenticated,
      user: () => (state.isAuthenticated ? { preferred_username: 'ada', roles: ['user'] } : null),
    },
  };
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title in toolbar', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar')?.textContent).toContain(
      'HFTM Web Applications (IN353)',
    );
  });

  it('zeigt waehrend des Session-Checks weder Login noch Logout', async () => {
    TestBed.overrideProvider(AuthStore, {
      useValue: authStoreStub({ loading: true, isAuthenticated: false }).useValue,
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="login"]')).toBeNull();
    expect(compiled.querySelector('[data-testid="logout"]')).toBeNull();
  });

  it('zeigt nach dem Check den Login-Button fuer anonyme Besucher', async () => {
    TestBed.overrideProvider(AuthStore, {
      useValue: authStoreStub({ loading: false, isAuthenticated: false }).useValue,
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="login"]')).not.toBeNull();
    expect(compiled.querySelector('[data-testid="logout"]')).toBeNull();
  });

  it('zeigt eingeloggten Usern Namen und Logout', async () => {
    TestBed.overrideProvider(AuthStore, {
      useValue: authStoreStub({ loading: false, isAuthenticated: true }).useValue,
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="user-name"]')?.textContent).toContain('ada');
    expect(compiled.querySelector('[data-testid="logout"]')).not.toBeNull();
    expect(compiled.querySelector('[data-testid="login"]')).toBeNull();
  });
});
