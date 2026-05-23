import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('mounts editor with no a11y violations', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('/');
  await expect(page.locator('[data-testid="markmd-editor"]')).toBeVisible({
    timeout: 5000,
  });

  expect(consoleErrors, `Unexpected console.error(s): ${consoleErrors.join('; ')}`).toHaveLength(0);

  const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  const seriousViolations = axeResults.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );

  expect(
    seriousViolations,
    `Axe found ${seriousViolations.length} serious/critical violation(s): ${seriousViolations.map((v) => `${v.id} (${v.impact})`).join(', ')}`,
  ).toHaveLength(0);
});
