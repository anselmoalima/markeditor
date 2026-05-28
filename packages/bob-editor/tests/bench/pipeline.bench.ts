import { bench, describe } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildProcessor, process as pipelineProcess } from '../../src/core/pipeline/builder.js';
import type { GenerationRef } from '../../src/core/pipeline/builder.js';

const FIXTURES = join(import.meta.dirname ?? __dirname, '../fixtures');

function readFixture(path: string): string {
  return readFileSync(join(FIXTURES, path), 'utf-8');
}

const md10k = readFixture('markdown/large/10k.md');
const md1k = md10k
  .split('\n')
  .slice(0, Math.floor(md10k.split('\n').length / 10))
  .join('\n');
const md5k = md10k
  .split('\n')
  .slice(0, Math.floor(md10k.split('\n').length / 2))
  .join('\n');

describe('pipeline performance', () => {
  bench(
    '1k-line document',
    async () => {
      const proc = buildProcessor();
      const ref: GenerationRef = { current: 0 };
      await pipelineProcess(md1k, proc, 0, ref);
    },
    { time: 2000 },
  );

  bench(
    '5k-line document',
    async () => {
      const proc = buildProcessor();
      const ref: GenerationRef = { current: 0 };
      await pipelineProcess(md5k, proc, 0, ref);
    },
    { time: 2000 },
  );

  bench(
    '10k-line document',
    async () => {
      const proc = buildProcessor();
      const ref: GenerationRef = { current: 0 };
      await pipelineProcess(md10k, proc, 0, ref);
    },
    { time: 3000 },
  );
});
