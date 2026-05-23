import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const playgroundDir = resolve(__dirname, '../..');
const repoRoot = resolve(playgroundDir, '../..');

function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(port: number, maxMs = 15_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      await fetch(`http://localhost:${port}/`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error(`Server did not respond on port ${port} within ${maxMs}ms`);
}

describe('playground build', () => {
  beforeAll(() => {
    execSync('pnpm --filter playground build', {
      cwd: repoRoot,
      stdio: 'pipe',
    });
  }, 120_000);

  it('exits 0 and produces dist/index.html', () => {
    expect(existsSync(resolve(playgroundDir, 'dist/index.html'))).toBe(true);
  });
});

describe('playground preview', () => {
  let previewProcess: ReturnType<typeof spawn> | null = null;
  let port: number;

  beforeAll(async () => {
    port = await getFreePort();
    previewProcess = spawn(
      'pnpm',
      ['exec', 'vite', 'preview', '--port', String(port), '--strictPort'],
      { cwd: playgroundDir, stdio: 'pipe' },
    );
    await waitForServer(port);
  }, 30_000);

  afterAll(() => {
    previewProcess?.kill();
  });

  it('responds 200 to GET /', async () => {
    const res = await fetch(`http://localhost:${port}/`);
    expect(res.status).toBe(200);
  });
});

describe('workspace resolution', () => {
  it('markeditor resolves to monorepo workspace package', () => {
    const result = execSync(
      `node -e "console.log(require.resolve('markeditor', { paths: ['${playgroundDir}'] }))"`,
      { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' },
    ).trim();
    expect(result).toContain('packages/markeditor');
  });
});
