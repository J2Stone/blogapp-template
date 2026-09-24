// Polyfill IntersectionObserver for jsdom (used by Angular's @defer on viewport)
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds = [0];
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    observe() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unobserve() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof globalThis.IntersectionObserver;
}

// Polyfill matchMedia for jsdom (used by the sidebar's isMobile signal); defaults to desktop.
if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      addEventListener() {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      removeEventListener() {},
    }) as unknown as MediaQueryList;
}
