import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../src/frontend/pages/Dashboard';

// Mock child components to keep test fast and focused
jest.mock('../../src/frontend/components/TestInputPanel', () => ({
  __esModule: true,
  default: ({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => void }) => (
    <div data-testid="test-input-panel">
      <button onClick={() => onSubmit({ curlCommand: 'curl https://ex.com', username: 'u', password: 'p', appState: 'FOREGROUND', platforms: ['android'], checkPushNotification: true, checkInAppNotification: false, checkLandingPage: false, extractLogs: false })}>Run Test</button>
    </div>
  ),
}));

jest.mock('../../src/frontend/components/ResultsPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="results-panel">Results</div>,
}));

jest.mock('../../src/frontend/components/LogViewer', () => ({
  __esModule: true,
  default: () => <div data-testid="log-viewer">Log Viewer</div>,
}));

jest.mock('../../src/frontend/services/api-service', () => ({
  apiService: {
    parseCurl: jest.fn(),
    startTest: jest.fn().mockResolvedValue({
      id: 'mock-sess',
      status: 'PASSED',
      config: {},
      phases: [],
      screenshots: [],
      createdAt: new Date(),
    }),
    getTestSession: jest.fn().mockResolvedValue({
      id: 'mock-sess',
      status: 'PASSED',
      config: {},
      phases: [],
      screenshots: [],
      createdAt: new Date(),
    }),
    getTestResults: jest.fn(),
  },
}));

describe('Dashboard integration', () => {
  it('renders without crashing', () => {
    render(<Dashboard />);
  });

  it('renders the TestInputPanel', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('test-input-panel')).toBeInTheDocument();
  });

  it('has the application heading', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Notification Trigger Agent/i)).toBeInTheDocument();
  });

  it('shows ResultsPanel and LogViewer after a test is started', async () => {
    render(<Dashboard />);

    const button = screen.getByRole('button', { name: /run test/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('results-panel')).toBeInTheDocument();
      expect(screen.getByTestId('log-viewer')).toBeInTheDocument();
    });
  });

  it('does not show ResultsPanel or LogViewer before a test is started', () => {
    render(<Dashboard />);
    expect(screen.queryByTestId('results-panel')).toBeNull();
    expect(screen.queryByTestId('log-viewer')).toBeNull();
  });
});
