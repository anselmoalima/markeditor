/**
 * A11y scans for all 15 scenario routes.
 * Each route is scanned with @axe-core/playwright for WCAG 2.1 AA violations.
 */
import { test } from '@playwright/test';
import { goTo, checkA11y } from './helpers.js';

const ROUTES = [
  { path: '/', name: 'default' },
  { path: '/uncontrolled', name: 'uncontrolled' },
  { path: '/custom-toolbar', name: 'custom-toolbar' },
  { path: '/with-plugins', name: 'with-plugins' },
  { path: '/math', name: 'math' },
  { path: '/mermaid', name: 'mermaid' },
  { path: '/alerts', name: 'alerts' },
  { path: '/image-upload', name: 'image-upload' },
  { path: '/storage', name: 'storage' },
  { path: '/themes', name: 'themes' },
  { path: '/i18n', name: 'i18n' },
  { path: '/export', name: 'export' },
  { path: '/large-document', name: 'large-document' },
  { path: '/readonly', name: 'readonly' },
  { path: '/ssr-safe', name: 'ssr-safe' },
];

for (const route of ROUTES) {
  test(`a11y: ${route.name} (${route.path}) — WCAG 2.1 AA`, async ({ page }) => {
    await goTo(page, route.path);
    // Allow lazy content to load
    await page.waitForTimeout(300);
    await checkA11y(page);
  });
}
