const _en = {
  // Toolbar
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  heading4: 'Heading 4',
  heading5: 'Heading 5',
  heading6: 'Heading 6',
  link: 'Link',
  image: 'Image',
  code: 'Inline Code',
  codeblock: 'Code Block',
  blockquote: 'Blockquote',
  orderedList: 'Ordered List',
  unorderedList: 'Unordered List',
  taskList: 'Task List',
  undo: 'Undo',
  redo: 'Redo',
  moreOptions: 'More options',

  // Dialogs
  insertLink: 'Insert Link',
  insertImage: 'Insert Image',
  insertTable: 'Insert Table',
  url: 'URL',
  linkLabel: 'Label',
  altText: 'Alt Text',
  rows: 'Rows',
  columns: 'Columns',
  cancel: 'Cancel',
  insert: 'Insert',

  // ShortcutsHelp
  shortcutsHelp: 'Keyboard Shortcuts',
  shortcutKey: 'Key',
  shortcutAction: 'Action',

  // StatusBar
  wordCount: 'Words',
  saving: 'Saving...',
  saved: 'Saved',
  savedJustNow: 'Saved just now',
  savedSecondsAgo: 'Saved {n}s ago',
  savedMinutesAgo: 'Saved {n}m ago',
} satisfies Record<string, string>;

/** The shape of the en catalog — all keys map to string. */
export type EnCatalog = { [K in keyof typeof _en]: string };

/** All valid message keys. */
export type EnKey = keyof EnCatalog;

/** The default English catalog. */
export const en: EnCatalog = _en;
