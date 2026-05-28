import { useState, useEffect, type ComponentType } from 'react';
import 'bob-editor/styles';

// --- lazy imports for each scenario ---
import { Default } from './scenarios/Default.js';
import { Uncontrolled } from './scenarios/Uncontrolled.js';
import { CustomToolbar } from './scenarios/CustomToolbar.js';
import { WithPlugins } from './scenarios/WithPlugins.js';
import { MathScenario } from './scenarios/MathScenario.js';
import { MermaidScenario } from './scenarios/MermaidScenario.js';
import { AlertsScenario } from './scenarios/AlertsScenario.js';
import { ImageUpload } from './scenarios/ImageUpload.js';
import { StorageScenario } from './scenarios/StorageScenario.js';
import { ThemesScenario } from './scenarios/ThemesScenario.js';
import { I18nScenario } from './scenarios/I18nScenario.js';
import { ExportScenario } from './scenarios/ExportScenario.js';
import { LargeDocument } from './scenarios/LargeDocument.js';
import { Readonly as ReadonlyScenario } from './scenarios/Readonly.js';
import { SsrSafe } from './scenarios/SsrSafe.js';

interface Route {
  path: string;
  label: string;
  component: ComponentType;
}

const ROUTES: Route[] = [
  { path: '/', label: 'Default', component: Default },
  { path: '/uncontrolled', label: 'Uncontrolled', component: Uncontrolled },
  { path: '/custom-toolbar', label: 'Custom Toolbar', component: CustomToolbar },
  { path: '/with-plugins', label: 'With Plugins', component: WithPlugins },
  { path: '/math', label: 'Math', component: MathScenario },
  { path: '/mermaid', label: 'Mermaid', component: MermaidScenario },
  { path: '/alerts', label: 'Alerts', component: AlertsScenario },
  { path: '/image-upload', label: 'Image Upload', component: ImageUpload },
  { path: '/storage', label: 'Storage', component: StorageScenario },
  { path: '/themes', label: 'Themes', component: ThemesScenario },
  { path: '/i18n', label: 'i18n', component: I18nScenario },
  { path: '/export', label: 'Export', component: ExportScenario },
  { path: '/large-document', label: 'Large Document', component: LargeDocument },
  { path: '/readonly', label: 'Readonly', component: ReadonlyScenario },
  { path: '/ssr-safe', label: 'SSR Safe', component: SsrSafe },
];

function getHash(): string {
  const hash = window.location.hash.slice(1) || '/';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(getHash);

  useEffect(() => {
    const handler = () => setCurrentPath(getHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const activeRoute = ROUTES.find((r) => r.path === currentPath) ?? ROUTES[0]!;
  const ScenarioComponent = activeRoute.component;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* DevTools sidebar */}
      <nav
        data-testid="devtools-sidebar"
        style={{
          width: '200px',
          flexShrink: 0,
          borderRight: '1px solid #d0d0d0',
          background: '#f8f8f8',
          overflowY: 'auto',
          padding: '0.5rem 0',
        }}
        aria-label="Scenario navigation"
      >
        <div
          style={{ padding: '0.5rem 1rem', fontWeight: 'bold', fontSize: '0.75rem', color: '#666' }}
        >
          bob-editor playground
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {ROUTES.map((route) => (
            <li key={route.path}>
              <button
                type="button"
                data-testid={`nav-${route.path.replace('/', '').replace(/\//g, '-') || 'default'}`}
                aria-current={currentPath === route.path ? 'page' : undefined}
                onClick={() => navigate(route.path)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.4rem 1rem',
                  textAlign: 'left',
                  background: currentPath === route.path ? '#e0e8ff' : 'transparent',
                  border: 'none',
                  borderLeft:
                    currentPath === route.path ? '3px solid #0066cc' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: currentPath === route.path ? '#0066cc' : '#333',
                }}
              >
                {route.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Scenario panel */}
      <main
        data-testid="scenario-panel"
        style={{ flex: 1, overflow: 'auto', padding: '1rem', minWidth: 0 }}
      >
        <h2
          style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#444' }}
          data-testid="scenario-title"
        >
          {activeRoute.label}
        </h2>
        <ScenarioComponent />
      </main>
    </div>
  );
}
