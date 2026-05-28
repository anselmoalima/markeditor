/**
 * Shared helpers for all playground E2E specs.
 */
import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Navigate to a playground scenario using the hash router.
 * @param path - e.g. '/', '/math', '/uncontrolled'
 */
export async function goTo(page: Page, path: string): Promise<void> {
  await page.goto(`/#${path}`);
  // Wait for the scenario panel to be visible (generous timeout for Firefox/WebKit)
  await expect(page.getByTestId('scenario-panel')).toBeVisible({ timeout: 15_000 });
}

/**
 * Run an axe accessibility scan on the current page state.
 * Fails the test if any WCAG 2.1 AA violations are found.
 */
export async function checkA11y(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

/**
 * Wait for the MSW service worker to be active before running a test.
 * The worker is registered by main.tsx when VITE_MSW=true.
 */
export async function waitForMsw(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, {
    timeout: 10_000,
  });
}

/**
 * Click the mode-toggle button to switch between edit and preview modes.
 */
export async function toggleMode(page: Page): Promise<void> {
  await page.getByTestId('bobmd-mode-toggle').click();
}

/**
 * Wait for the editor to be ready (either Monaco or textarea fallback).
 * Returns 'monaco' or 'textarea'.
 * Prefers Monaco — waits up to 6s for it before falling back to textarea.
 */
export async function waitForEditor(page: Page): Promise<'monaco' | 'textarea'> {
  // First, wait for the editor panel itself
  await expect(page.getByTestId('bobmd-editor-panel')).toBeVisible({ timeout: 10_000 });

  // Try to wait for Monaco specifically (it loads asynchronously via Suspense)
  try {
    await page.waitForSelector('[data-testid="bobmd-editor-panel"] .monaco-editor', {
      timeout: 6000,
      state: 'visible',
    });
    return 'monaco';
  } catch {
    // Monaco didn't load — check if textarea is visible instead
    const hasTextarea = await page.locator('[data-testid="bobmd-textarea"]').isVisible();
    return hasTextarea ? 'textarea' : 'monaco';
  }
}

/**
 * Press select-all in the editor, using the correct shortcut for the current browser.
 * (WebKit uses Meta+A; others use Ctrl+A.)
 */
export async function selectAllInEditor(page: Page): Promise<void> {
  const ua: string = await page.evaluate(() => navigator.userAgent);
  const isWebKit = ua.includes('WebKit') && !ua.includes('Chromium') && !ua.includes('Chrome');
  await page.keyboard.press(isWebKit ? 'Meta+a' : 'Control+a');
}

/**
 * Type text into the editor. Works with both Monaco and the textarea fallback.
 * Clears existing content first.
 */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  const editorType = await waitForEditor(page);

  if (editorType === 'monaco') {
    // Click the Monaco view-lines area to properly focus the editor
    const viewLines = page.locator('[data-testid="bobmd-editor-panel"] .view-lines').first();
    const hasViewLines = (await viewLines.count()) > 0;
    if (hasViewLines) {
      await viewLines.click();
    } else {
      await page.locator('[data-testid="bobmd-editor-panel"]').click();
    }
    // Brief wait for focus to register
    await page.waitForTimeout(100);
    // Detect WebKit by user-agent to choose the right select-all shortcut.
    // In WebKit (Safari), Ctrl+A moves cursor to line start; Meta+A (Cmd+A) selects all.
    const ua: string = await page.evaluate(() => navigator.userAgent);
    const isWebKit = ua.includes('WebKit') && !ua.includes('Chromium') && !ua.includes('Chrome');
    const selectAll = isWebKit ? 'Meta+a' : 'Control+a';
    await page.keyboard.press(selectAll);
    await page.keyboard.type(text);
    // Wait for Monaco's onChange debounce to fire
    await page.waitForTimeout(200);
  } else {
    const ta = page.getByTestId('bobmd-textarea');
    await ta.click();
    await ta.fill(text);
  }
}

/**
 * Type text into the textarea fallback (used before Monaco loads or in SSR tests).
 * @deprecated prefer typeInEditor which handles both Monaco and textarea.
 */
export async function typeInTextarea(page: Page, text: string): Promise<void> {
  return typeInEditor(page, text);
}

/**
 * Assert that the editor panel is visible (Monaco or textarea fallback).
 */
export async function expectEditorVisible(page: Page): Promise<void> {
  const editorPanel = page.getByTestId('bobmd-editor-panel');
  await expect(editorPanel).toBeVisible();
}

/**
 * Wait for the preview to finish rendering (loading indicator hidden).
 */
export async function waitForPreview(page: Page): Promise<void> {
  await expect(page.getByTestId('bobmd-preview')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('bobmd-preview-loading'))
    .toBeHidden({ timeout: 5000 })
    .catch(() => {
      // If loading indicator doesn't exist, that's fine too
    });
  // Brief wait for any async rendering to complete
  await page.waitForTimeout(200);
}
