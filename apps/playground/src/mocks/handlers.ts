import { http, HttpResponse, delay } from 'msw';

/** Successful upload: returns a fixed placeholder image URL */
const uploadSuccess = http.post('/api/upload', async () => {
  await delay(200); // simulate network latency
  return HttpResponse.json({
    url: 'https://example.com/uploaded-image.png',
    alt: 'Uploaded image',
  });
});

/**
 * Failure upload: toggles between success and failure on each request.
 * The Playwright tests set the `X-MSW-Scenario` header to control behavior:
 *   - `success`: always return 200
 *   - `failure`: always return 500
 */
let uploadScenario: 'success' | 'failure' = 'success';

const uploadWithScenario = http.post('/api/upload', async ({ request }) => {
  const scenario =
    (request.headers.get('X-MSW-Scenario') as typeof uploadScenario | null) ?? uploadScenario;
  await delay(150);
  if (scenario === 'failure') {
    return new HttpResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return HttpResponse.json({
    url: 'https://example.com/uploaded-image.png',
    alt: 'Uploaded image',
  });
});

/** Control endpoint: set the upload scenario via POST /api/upload-scenario */
const setScenario = http.post('/api/upload-scenario', async ({ request }) => {
  const body = (await request.json()) as { scenario: typeof uploadScenario };
  uploadScenario = body.scenario;
  return HttpResponse.json({ ok: true });
});

export const handlers = [uploadWithScenario, setScenario];
