import { test, expect } from '@playwright/test';
import { mockApi } from './fixtures';

// Akzeptanzkriterien: Blog-Detail
// 1. Ein Klick auf den Titel in der Liste öffnet die Detailseite /blog/:id.
// 2. Die Detailseite zeigt Titel, Autor und den ganzen Inhalt.
// 3. Die Kommentare werden mit Anzahl, Autor und Text angezeigt.
// 4. Ohne Kommentare erscheint "Noch keine Kommentare."
// 5. Eine unbekannte ID zeigt "Blog-Post nicht gefunden."

test.describe('Blog-Detail', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('öffnet die Detailseite über den Titel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Blog 1' }).click();

    await expect(page).toHaveURL(/\/blog\/1$/);
    await expect(page.locator('mat-card-title')).toHaveText('Blog 1');
  });

  test('zeigt Titel, Autor, Inhalt und Kommentare', async ({ page }) => {
    await page.goto('/blog/1');

    await expect(page.locator('mat-card-title')).toHaveText('Blog 1');
    await expect(page.locator('mat-card-subtitle')).toHaveText('Ada');
    await expect(page.getByText('Ganzer Inhalt von Blog 1')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kommentare (1)' })).toBeVisible();
    await expect(page.locator('.comment')).toContainText('Grace');
    await expect(page.locator('.comment')).toContainText('Toller Beitrag!');
  });

  test('zeigt einen Hinweis ohne Kommentare', async ({ page }) => {
    await page.goto('/blog/2');
    await expect(page.getByText('Noch keine Kommentare.')).toBeVisible();
  });

  test('zeigt "nicht gefunden" bei unbekannter ID', async ({ page }) => {
    await page.goto('/blog/999');
    await expect(page.getByText('Blog-Post nicht gefunden.')).toBeVisible();
  });
});
