import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hat kein Passwort-Feld – das Passwort wird bei Keycloak getippt', async () => {
    await fixture.whenStable();

    const html: HTMLElement = fixture.nativeElement;
    expect(html.querySelector('input[type="password"]')).toBeNull();
    expect(html.querySelector('form')).toBeNull();
  });

  it('navigiert zum Login-Endpoint des BFF und haengt die returnUrl an', async () => {
    const location = { href: '' };
    vi.stubGlobal('location', location);
    fixture.componentRef.setInput('returnUrl', '/add-blog');
    await fixture.whenStable();

    fixture.componentInstance.signIn();

    expect(location.href).toBe('/api/auth/login?returnUrl=%2Fadd-blog');
  });

  it('zeigt bekannte Fehlercodes als Meldung an', async () => {
    fixture.componentRef.setInput('error', 'access_denied');
    await fixture.whenStable();

    const message = fixture.nativeElement.querySelector('[data-testid="login-error"]');
    expect(message?.textContent).toContain('abgebrochen');
  });

  it('faellt bei unbekannten Fehlercodes auf die generische Meldung zurueck', async () => {
    fixture.componentRef.setInput('error', 'something-odd');
    await fixture.whenStable();

    const message = fixture.nativeElement.querySelector('[data-testid="login-error"]');
    expect(message?.textContent).toContain('fehlgeschlagen');
  });
});
