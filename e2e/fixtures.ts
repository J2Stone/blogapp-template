import { Page } from '@playwright/test';

const stamp = '2026-01-01T00:00:00.000Z';

export const blogs = [1, 2, 3].map((id) => ({
  id,
  title: `Blog ${id}`,
  author: id === 2 ? 'Linus' : 'Ada',
  likes: id,
  likedByMe: false,
  createdByMe: false,
  createdAt: stamp,
  updatedAt: stamp,
  contentPreview: `Vorschau ${id}`,
  comments: id === 1 ? 1 : 0,
}));

/** Ersetzt das Backend (BFF lokal, Azure in CI) durch feste Testdaten. */
export async function mockApi(page: Page): Promise<void> {
  await page.route(/\/entries$/, (route) =>
    route.fulfill({
      json: { data: blogs, pageIndex: 0, pageSize: 10, maxPageSize: 100, totalCount: blogs.length },
    }),
  );
  await page.route(/\/entries\/\d+$/, (route) => {
    const id = Number(route.request().url().split('/').pop());
    const blog = blogs.find((b) => b.id === id);
    if (!blog) return route.fulfill({ status: 404, json: {} });
    return route.fulfill({
      json: {
        ...blog,
        content: `Ganzer Inhalt von ${blog.title}`,
        comments:
          id === 1
            ? [
                {
                  id: 1,
                  author: 'Grace',
                  content: 'Toller Beitrag!',
                  createdAt: stamp,
                  updatedAt: stamp,
                },
              ]
            : [],
      },
    });
  });
}
