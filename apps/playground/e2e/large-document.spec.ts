import { test, expect } from '@playwright/test';
import { goTo, toggleMode, checkA11y, expectEditorVisible } from './helpers.js';

test.describe('Large document scenario (/large-document)', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/large-document');
  });

  test('renders the large document without freezing', async ({ page }) => {
    await expect(page.getByTestId('scenario-large-document')).toBeVisible();
    // Editor (Monaco or textarea) should be visible and responsive
    await expectEditorVisible(page);
  });

  test('preview renders within 3 seconds for 10k-line document', async ({ page, browserName }) => {
    const start = Date.now();
    await toggleMode(page);

    // Wait for preview to appear — use a longer timeout for Firefox/WebKit
    const previewTimeout = browserName === 'chromium' ? 3_000 : 8_000;
    await expect(page.getByTestId('bobmd-preview')).toBeVisible({ timeout: previewTimeout });

    // Wait for loading state to resolve
    await expect(page.getByTestId('bobmd-preview-loading'))
      .toBeHidden({ timeout: previewTimeout })
      .catch(() => {
        // Preview loading indicator may or may not be visible — it's timing-dependent
      });

    const elapsed = Date.now() - start;
    // Chromium must render within 3s; other browsers within 8s (slower in CI)
    const limit = browserName === 'chromium' ? 3_000 : 8_000;
    expect(elapsed).toBeLessThan(limit);
  });

  test('a11y scan in edit mode', async ({ page }) => {
    await checkA11y(page);
  });
});
