import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogViewer from '../../src/frontend/components/LogViewer';
import { logService } from '../../src/frontend/services/log-service';

jest.mock('../../src/frontend/services/log-service', () => ({
  logService: {
    getLogs: jest.fn(),
  },
}));

const mockLogs = [
  { timestamp: '2024-01-01T00:00:01Z', eventName: 'PUSH_RECEIVED', platform: 'android', payload: { screen: 'home' } },
  { timestamp: '2024-01-01T00:00:02Z', eventName: 'SCREEN_VIEW', platform: 'ios', payload: { screen: 'product' } },
];

describe('LogViewer', () => {
  const mockedGetLogs = logService.getLogs as jest.Mock;

  beforeEach(() => {
    mockedGetLogs.mockClear();
    mockedGetLogs.mockResolvedValue(mockLogs);
  });

  it('renders the UBA Logs title', async () => {
    render(<LogViewer sessionId="sess-001" />);
    expect(screen.getByText('UBA Logs')).toBeInTheDocument();
  });

  it('renders the filter input', () => {
    render(<LogViewer sessionId="sess-001" />);
    expect(screen.getByPlaceholderText(/Filter by event/i)).toBeInTheDocument();
  });

  it('calls logService.getLogs with the sessionId on mount', async () => {
    render(<LogViewer sessionId="sess-001" />);
    await waitFor(() => expect(mockedGetLogs).toHaveBeenCalledWith('sess-001'));
  });

  it('renders log entries after loading', async () => {
    render(<LogViewer sessionId="sess-001" />);
    await waitFor(() => {
      expect(screen.getByText('PUSH_RECEIVED')).toBeInTheDocument();
      expect(screen.getByText('SCREEN_VIEW')).toBeInTheDocument();
    });
  });

  it('filters log entries when text is typed in filter input', async () => {
    render(<LogViewer sessionId="sess-001" />);
    await waitFor(() => screen.getByText('PUSH_RECEIVED'));

    const filter = screen.getByPlaceholderText(/Filter by event/i);
    await userEvent.type(filter, 'PUSH');

    expect(screen.getByText('PUSH_RECEIVED')).toBeInTheDocument();
    expect(screen.queryByText('SCREEN_VIEW')).toBeNull();
  });

  it('shows "No logs found" when filter matches nothing', async () => {
    render(<LogViewer sessionId="sess-001" />);
    await waitFor(() => screen.getByText('PUSH_RECEIVED'));

    const filter = screen.getByPlaceholderText(/Filter by event/i);
    await userEvent.type(filter, 'NONEXISTENT');

    expect(screen.getByText('No logs found.')).toBeInTheDocument();
  });

  it('shows "No logs found" when API returns empty array', async () => {
    mockedGetLogs.mockResolvedValue([]);
    render(<LogViewer sessionId="sess-001" />);
    await waitFor(() => expect(screen.getByText('No logs found.')).toBeInTheDocument());
  });

  it('handles API error gracefully', async () => {
    mockedGetLogs.mockRejectedValue(new Error('API error'));
    render(<LogViewer sessionId="sess-001" />);
    await waitFor(() => expect(screen.getByText('No logs found.')).toBeInTheDocument());
  });
});
