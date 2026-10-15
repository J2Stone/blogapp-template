import { test, expect } from '@playwright/test';
import { blogs, mockApi } from './fixtures';

// Akzeptanzkriterien: Blog-Liste
// 1. Wenn die Seite geladen wird, werden Blog-Einträge angezeigt.
// 2. Jeder Blog-Eintrag zeigt einen Titel und eine Zusammenfassung.
// 3. Die Anzahl der Beiträge wird angezeigt, und der Autor-Filter zeigt nur Beiträge dieses Autors.
// 4. Schlägt das Laden fehl, erscheint eine Fehlermeldung mit "Erneut versuchen".

test.describe('Blog-Liste', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('zeigt Blog-Einträge nach dem Laden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-blog-card')).toHaveCount(blogs.length);
  });

  test('zeigt Titel und Zusammenfassung pro Eintrag', async ({ page }) => {
    await page.goto('/');
    for (const blog of blogs) {
      const card = page.locator('app-blog-card').filter({ hasText: blog.title });
      await expect(card.getByRole('link', { name: blog.title })).toBeVisible();
      await expect(card).toContainText(blog.contentPreview);
    }
  });

  test('zeigt die Anzahl und filtert nach Autor', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('3 Blog-Beiträge')).toBeVisible();

    await page.getByRole('combobox', { name: 'Autor' }).click();
    await page.getByRole('option', { name: 'Linus' }).click();

    await expect(page.locator('app-blog-card')).toHaveCount(1);
    await expect(page.getByText('(1 gefiltert)')).toBeVisible();
  });

  test('zeigt eine Fehlermeldung, wenn das Backend nicht antwortet', async ({ page }) => {
    await page.route(/\/entries$/, (route) => route.fulfill({ status: 500 }));
    await page.goto('/');

    await expect(page.getByRole('alert')).toContainText('konnten nicht geladen werden');
    await expect(page.getByRole('button', { name: 'Erneut versuchen' })).toBeVisible();
  });
});
