import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  it('folgt der Media Query und entfernt den Listener beim Zerstoeren', () => {
    let listener: ((e: { matches: boolean }) => void) | undefined;
    const mql = {
      matches: true,
      addEventListener: vi.fn((_: string, fn: typeof listener) => (listener = fn)),
      removeEventListener: vi.fn(),
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql as unknown as MediaQueryList);

    TestBed.configureTestingModule({ imports: [SidebarComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SidebarComponent);
    const isMobile = (fixture.componentInstance as unknown as { isMobile: () => boolean }).isMobile;
    expect(isMobile()).toBe(true);

    listener?.({ matches: false });
    expect(isMobile()).toBe(false);

    fixture.destroy();
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', listener);
  });
});
