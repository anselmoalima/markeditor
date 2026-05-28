import { useState } from 'react';
import { BobEditor } from 'bob-editor';

type Locale = 'en' | 'pt-BR';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português (BR)',
};

export function I18nScenario() {
  const [locale, setLocale] = useState<Locale>('en');

  return (
    <div data-testid="scenario-i18n" style={{ height: 'calc(100vh - 80px)' }}>
      <div
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}
      >
        <span style={{ fontSize: '0.85rem', color: '#666' }}>Locale:</span>
        {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
          <button
            key={loc}
            type="button"
            data-testid={`locale-btn-${loc}`}
            aria-pressed={locale === loc}
            onClick={() => setLocale(loc)}
            style={{
              padding: '0.25rem 0.75rem',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              background: locale === loc ? '#0066cc' : '#fff',
              color: locale === loc ? '#fff' : '#333',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {LOCALE_LABELS[loc]}
          </button>
        ))}
      </div>
      <BobEditor
        defaultValue={`# i18n Demo\n\nHover over toolbar buttons to see tooltips in **${LOCALE_LABELS[locale]}**.`}
        locale={locale}
      />
    </div>
  );
}
