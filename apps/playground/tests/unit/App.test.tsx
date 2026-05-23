import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/App';

describe('App', () => {
  it('renders markmd-editor element', () => {
    render(<App />);
    expect(screen.getByTestId('markmd-editor')).toBeInTheDocument();
  });
});
