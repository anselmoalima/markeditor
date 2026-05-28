import { BobEditor } from 'bob-editor';

const INITIAL_MARKDOWN = `# GitHub-Style Alerts

Switch to Preview to see styled callouts.

> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.
`;

export function AlertsScenario() {
  return (
    <div data-testid="scenario-alerts" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        GitHub-style alert callouts — switch to Preview.
      </p>
      <BobEditor defaultValue={INITIAL_MARKDOWN} />
    </div>
  );
}
