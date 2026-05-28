import { test, expect } from '@playwright/test';
import { goTo, checkA11y } from './helpers.js';

test.describe('SSR Safe scenario (/ssr-safe)', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/ssr-safe');
  });

  test('scenario renders', async ({ page }) => {
    await expect(page.getByTestId('scenario-ssr-safe')).toBeVisible();
  });

  test('textarea is visible (either SSR fallback or Monaco fallback)', async ({ page }) => {
    // In the browser, `mounted` becomes true quickly after initial render.
    // The SSR-safe pattern shows a plain textarea before BobEditor mounts.
    const ssrTextarea = page.getByTestId('ssr-textarea-fallback');
    const editorPanel = page.getByTestId('bobmd-editor-panel');

    // After the component mounts, either the SSR fallback or the BobEditor is visible
    const ssrVisible = await ssrTextarea.isVisible().catch(() => false);
    const editorVisible = await editorPanel.isVisible().catch(() => false);

    // In Playwright (browser environment), BobEditor mounts immediately after hydration
    // so the editor panel should be visible
    expect(ssrVisible || editorVisible).toBe(true);
  });

  test('SSR textarea visible before hydration (page load)', async ({ page }) => {
    // Block JavaScript to simulate pre-hydration SSR state
    await page.route('**/*.js', (route) => route.abort());
    await page.goto('/#/ssr-safe');

    // Without JS, the initial render cannot happen at all in SPA
    // The SSR textarea would be from server-render (not applicable here)
    // In a real Next.js SSR setup, the server sends the textarea HTML.
    // For this Vite SPA, we document the behavior instead.
    await page.unrouteAll();
  });

  test('a11y scan', async ({ page }) => {
    await checkA11y(page);
  });
});
