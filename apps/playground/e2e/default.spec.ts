import { test, expect } from '@playwright/test';
import { goTo, toggleMode, checkA11y, typeInEditor, expectEditorVisible } from './helpers.js';

test.describe('Default scenario (/)', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/');
  });

  test('renders editor in edit mode', async ({ page }) => {
    await expect(page.getByTestId('scenario-default')).toBeVisible();
    // Either Monaco or textarea fallback should be visible
    await expectEditorVisible(page);
  });

  test('type # Hello → switch to preview → h1 visible', async ({ page }) => {
    await typeInEditor(page, '# Hello');
    await toggleMode(page);
    await expect(page.getByTestId('bobmd-preview')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Hello', exact: true })).toBeVisible();
  });

  test('edit→preview toggle changes mode button label', async ({ page }) => {
    const toggle = page.getByTestId('bobmd-mode-toggle');
    await expect(toggle).toHaveText('Preview');
    await toggle.click();
    await expect(toggle).toHaveText('Edit');
    await toggle.click();
    await expect(toggle).toHaveText('Preview');
  });

  test('a11y scan passes', async ({ page }) => {
    await checkA11y(page);
  });

  test('a11y scan passes in preview mode', async ({ page }) => {
    await toggleMode(page);
    await expect(page.getByTestId('bobmd-preview')).toBeVisible();
    await checkA11y(page);
  });
});
