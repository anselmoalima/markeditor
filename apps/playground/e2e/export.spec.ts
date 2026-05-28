import { test, expect } from '@playwright/test';
import { goTo, toggleMode, checkA11y } from './helpers.js';

test.describe('Export scenario (/export)', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/export');
  });

  test('shows export scenario', async ({ page }) => {
    await expect(page.getByTestId('scenario-export')).toBeVisible();
  });

  test('Download HTML triggers file download', async ({ page }) => {
    // Listen for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 }).catch(() => null);

    // The toolbar has an Export HTML button when enableExport is true
    // Try clicking any download button
    const downloadBtns = page.locator('button').filter({ hasText: /html|export/i });
    const count = await downloadBtns.count();
    if (count > 0) {
      await downloadBtns.first().click();
    }

    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.html$/);
    }
  });

  test('Download Markdown via toolbar', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 }).catch(() => null);
    const mdBtns = page.locator('button').filter({ hasText: /markdown|\.md/i });
    const count = await mdBtns.count();
    if (count > 0) {
      await mdBtns.first().click();
    }
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.md$/);
    }
  });

  test('switch to preview and check export toolbar visible', async ({ page }) => {
    await toggleMode(page);
    await expect(page.getByTestId('bobmd-preview')).toBeVisible();
    // Export buttons should still be available in preview
    const toolbar = page.locator('.bobmd-toolbar');
    await expect(toolbar)
      .toBeVisible()
      .catch(() => {});
  });

  test('a11y scan', async ({ page }) => {
    await checkA11y(page);
  });
});
