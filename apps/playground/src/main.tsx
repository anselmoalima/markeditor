/// <reference types="vite/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';

async function enableMocking(): Promise<void> {
  if (typeof window === 'undefined') return;
  // Only start MSW in development or when explicitly requested
  if (!import.meta.env.DEV && !import.meta.env.VITE_MSW) return;
  const { worker } = await import('./mocks/browser.js');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

void enableMocking().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
