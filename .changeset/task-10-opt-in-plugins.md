---
'bob-editor': minor
---

feat: opt-in built-in plugins — emoji, mentions, wordCount, tableOfContents (v0.4.0)

- `emojiPlugin` — remark plugin transforming `:shortcode:` to unicode emoji; includes emoji toolbar button; exported via `bob-editor/plugins/emoji`
- `createMentionsPlugin({ resolveMention })` — factory returning a plugin that transforms `@username` to a styled `<a class="bobmd-mention">` link; exported via `bob-editor/plugins/mentions`
- `wordCountPlugin` — `onChange` hook computing word/char count and calling `api.showNotification`; exported via `bob-editor/plugins/wordCount`
- `tableOfContentsPlugin` — `onAfterRender` hast transform prepending a `<nav aria-label="Table of contents"><ul>...</ul></nav>` built from heading slugs; exported via `bob-editor/plugins/tableOfContents`
- `src/plugins/index.ts` barrel re-exports all four opt-in plugins plus the five default built-ins
- Wire `onAfterRender` hooks as a unified rehype plugin (before `rehype-sanitize`) in `BobEditor.tsx`
- Fix `mergeSanitizeSchema`: plain-string attribute entries now correctly override tuple restrictions from base schema (`collapseUnrestrictedAttrs`)
