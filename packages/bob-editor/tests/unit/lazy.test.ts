import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LazyRegistry } from '../../src/core/lazy/registry.js';
import { detectFeatures } from '../../src/core/lazy/detector.js';

describe('LazyRegistry', () => {
  beforeEach(() => {
    LazyRegistry._reset();
  });

  it('get called multiple times in parallel fires loader exactly once', async () => {
    const loader = vi.fn().mockResolvedValue({ loaded: true });
    LazyRegistry.register('math', loader);

    const [r1, r2, r3] = await Promise.all([
      LazyRegistry.get('math'),
      LazyRegistry.get('math'),
      LazyRegistry.get('math'),
    ]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(r1).toEqual({ loaded: true });
    expect(r2).toEqual({ loaded: true });
    expect(r3).toEqual({ loaded: true });
  });

  it('prime fires loader at most once', async () => {
    const loader = vi.fn().mockResolvedValue('module');
    await LazyRegistry.prime('code', loader);
    await LazyRegistry.prime('code', loader);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('get throws if name not registered', () => {
    expect(() => LazyRegistry.get('unknown')).toThrow('unknown');
  });

  it('isLoaded returns false before register, true after', async () => {
    expect(LazyRegistry.isLoaded('mermaid')).toBe(false);
    LazyRegistry.register('mermaid', () => Promise.resolve({}));
    expect(LazyRegistry.isLoaded('mermaid')).toBe(true);
  });

  it('parallel calls share the same Promise', async () => {
    const loader = vi
      .fn()
      .mockImplementation(() => new Promise<string>((res) => setTimeout(() => res('done'), 10)));
    LazyRegistry.register('highlight', loader);
    const p1 = LazyRegistry.get<string>('highlight');
    const p2 = LazyRegistry.get<string>('highlight');

    expect(p1).toBe(p2);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe('detectFeatures', () => {
  it('detects inline math $...$', () => {
    expect(detectFeatures('Here is $x^2$ inline')).toContain('math');
  });

  it('detects display math $$...$$', () => {
    expect(detectFeatures('$$\n\\int dx\n$$')).toContain('math');
  });

  it('detects mermaid fenced block', () => {
    const md = '```mermaid\ngraph TD\n  A --> B\n```';
    expect(detectFeatures(md)).toContain('mermaid');
  });

  it('does not detect math in plain text', () => {
    expect(detectFeatures('no special syntax here')).not.toContain('math');
  });

  it('does not detect mermaid in plain text', () => {
    expect(detectFeatures('no special syntax here')).not.toContain('mermaid');
  });

  it('returns empty Set for no special syntax', () => {
    const features = detectFeatures('no special syntax');
    expect(features.size).toBe(0);
  });

  it('detects code fenced block with language tag', () => {
    const md = '```javascript\nconsole.log(1);\n```';
    expect(detectFeatures(md)).toContain('code');
  });

  it('detects multiple features in same document', () => {
    const md = '$x^2$ and ```mermaid\ngraph TD\n```';
    const features = detectFeatures(md);
    expect(features).toContain('math');
    expect(features).toContain('mermaid');
  });

  it('detects \\(...\\) math syntax', () => {
    const md = 'Here is \\(E = mc^2\\) inline';
    expect(detectFeatures(md)).toContain('math');
  });
});
