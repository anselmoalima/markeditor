import { BobEditor } from 'bob-editor';

const INITIAL_MARKDOWN = `# Math Rendering

Inline math: $E = mc^2$ and $\\pi \\approx 3.14159$

Block math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

The quadratic formula:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
`;

export function MathScenario() {
  return (
    <div data-testid="scenario-math" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        KaTeX math rendering — switch to Preview to see equations.
      </p>
      <BobEditor defaultValue={INITIAL_MARKDOWN} />
    </div>
  );
}
