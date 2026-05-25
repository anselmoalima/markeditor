import { describe, it, expect } from 'vitest';
import * as indexExports from '../../src/index.js';
import * as pluginsBarrel from '../../src/plugins/index.js';
import { emojiPlugin } from '../../src/plugins/emoji.js';
import { mentionsPlugin } from '../../src/plugins/mentions.js';
import { wordCountPlugin } from '../../src/plugins/wordCount.js';
import { tableOfContentsPlugin } from '../../src/plugins/tableOfContents.js';

describe('index public exports', () => {
  it('module resolves without error', () => {
    expect(indexExports).toBeDefined();
  });
});

describe('plugins barrel', () => {
  it('module resolves without error', () => {
    expect(pluginsBarrel).toBeDefined();
  });
});

describe('emoji plugin stub', () => {
  it('has name "emoji"', () => {
    expect(emojiPlugin.name).toBe('emoji');
  });

  it('has version defined', () => {
    expect(emojiPlugin.version).toBeDefined();
  });
});

describe('mentions plugin stub', () => {
  it('has name "mentions"', () => {
    expect(mentionsPlugin.name).toBe('mentions');
  });

  it('has version defined', () => {
    expect(mentionsPlugin.version).toBeDefined();
  });
});

describe('wordCount plugin stub', () => {
  it('has name "wordCount"', () => {
    expect(wordCountPlugin.name).toBe('wordCount');
  });

  it('has version defined', () => {
    expect(wordCountPlugin.version).toBeDefined();
  });
});

describe('tableOfContents plugin stub', () => {
  it('has name "tableOfContents"', () => {
    expect(tableOfContentsPlugin.name).toBe('tableOfContents');
  });

  it('has version defined', () => {
    expect(tableOfContentsPlugin.version).toBeDefined();
  });
});
