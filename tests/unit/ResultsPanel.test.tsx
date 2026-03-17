import React from 'react';
import { render, screen } from '@testing-library/react';
import ResultsPanel, { ResultsPanelProps } from '../../src/frontend/components/ResultsPanel';

const defaultProps: ResultsPanelProps = {
  sessionId: 'sess-001',
  status: 'PASSED',
  phases: [
    { phase: 'SETUP', status: 'PASSED', durationMs: 1200 },
    { phase: 'LOGIN', status: 'PASSED', durationMs: 3400 },
    { phase: 'TRIGGER', status: 'FAILED', durationMs: 500, error: 'Timeout' },
  ],
  progress: 100,
  isLoading: false,
};

describe('ResultsPanel', () => {
  it('renders the panel title', () => {
    render(<ResultsPanel {...defaultProps} />);
    expect(screen.getByText('Test Results')).toBeInTheDocument();
  });

  it('renders the session ID', () => {
    render(<ResultsPanel {...defaultProps} />);
    expect(screen.getByText(/sess-001/)).toBeInTheDocument();
  });

  it('renders the overall status badge', () => {
    render(<ResultsPanel {...defaultProps} />);
    const badge = document.querySelector('[data-status="PASSED"]');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe('PASSED');
  });

  it('renders all phase rows', () => {
    render(<ResultsPanel {...defaultProps} />);
    expect(screen.getByText('SETUP')).toBeInTheDocument();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
    expect(screen.getByText('TRIGGER')).toBeInTheDocument();
  });

  it('renders phase duration', () => {
    render(<ResultsPanel {...defaultProps} />);
    expect(screen.getByText('1200ms')).toBeInTheDocument();
  });

  it('renders phase error when present', () => {
    render(<ResultsPanel {...defaultProps} />);
    expect(screen.getByText('Timeout')).toBeInTheDocument();
  });

  it('renders ProgressBar when isLoading is true', () => {
    render(<ResultsPanel {...defaultProps} isLoading={true} progress={50} />);
    // ProgressBar renders with role progressbar
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not render ProgressBar when not loading', () => {
    render(<ResultsPanel {...defaultProps} isLoading={false} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('renders device status cards for android and ios', () => {
    render(<ResultsPanel {...defaultProps} />);
    expect(screen.getByText(/android/i)).toBeInTheDocument();
    expect(screen.getByText(/ios/i)).toBeInTheDocument();
  });

  it('works without sessionId', () => {
    render(<ResultsPanel {...defaultProps} sessionId={undefined} />);
    expect(screen.queryByText(/Session:/)).toBeNull();
  });
});
