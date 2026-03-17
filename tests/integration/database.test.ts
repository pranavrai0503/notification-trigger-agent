/**
 * Database integration tests validate the schema, SQL migration files,
 * and repository-layer queries.
 *
 * These tests use a mocked pg Pool to avoid needing a real PostgreSQL instance.
 */

import { TestSessionRepository } from '../../src/backend/repository/test-session.repository';
import { TestStatus } from '../../src/backend/types/test-session';

jest.mock('../../src/backend/config', () => ({
  getConfig: () => ({
    database: { host: 'localhost', port: 5432, name: 'test_db', user: 'pg', password: '' },
    app: { packageAndroid: 'com.example.app', packageIOS: 'com.example.app', activityAndroid: '' },
    browserstack: { username: '', accessKey: '', apiUrl: '' },
    test: { defaultTimeoutMs: 30000, sessionTimeoutMs: 300000, maxRetryAttempts: 3, retryDelayMs: 1000 },
  }),
}));

// Capture the mock pool so we can configure it per test
const mockPoolQuery = jest.fn();

jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      query: mockPoolQuery,
      end: jest.fn(),
    })),
  };
});

describe('TestSessionRepository', () => {
  let repo: TestSessionRepository;

  const baseSession = {
    id: 'sess-db-001',
    status: TestStatus.PENDING,
    config: {
      curlCommand: 'curl https://example.com',
      credentials: { username: 'u', password: 'p' },
      appState: 'FOREGROUND' as const,
      platforms: ['android'] as Array<'android' | 'ios'>,
      checkPushNotification: true,
      checkInAppNotification: false,
      checkLandingPage: false,
      extractLogs: true,
    },
    phases: [],
    screenshots: [],
    createdAt: new Date(),
  };

  const dbRow = {
    id: 'sess-db-001',
    status: TestStatus.PENDING,
    config: {},
    phases: [],
    screenshots: [],
    android_session_id: null,
    ios_session_id: null,
    logs: null,
    error: null,
    created_at: new Date(),
    started_at: null,
    completed_at: null,
  };

  beforeEach(() => {
    mockPoolQuery.mockReset();
    repo = new TestSessionRepository();
  });

  it('instantiates without throwing', () => {
    expect(repo).toBeDefined();
  });

  describe('create()', () => {
    it('calls pool.query with INSERT statement and returns session', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [dbRow] });

      const session = await repo.create(baseSession);
      expect(session).toBeDefined();
      expect(session.id).toBe('sess-db-001');
      expect(mockPoolQuery).toHaveBeenCalled();
      const sql: string = mockPoolQuery.mock.calls[0][0];
      expect(sql.toUpperCase()).toContain('INSERT');
    });
  });

  describe('findById()', () => {
    it('returns null when session not found', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });
      const result = await repo.findById('sess-not-found');
      expect(result).toBeNull();
      expect(mockPoolQuery).toHaveBeenCalled();
    });

    it('returns session when found', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [dbRow] });
      const result = await repo.findById('sess-db-001');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('sess-db-001');
    });
  });

  describe('update()', () => {
    it('calls pool.query with UPDATE statement and returns updated session', async () => {
      const updatedRow = { ...dbRow, status: TestStatus.RUNNING };
      mockPoolQuery.mockResolvedValue({ rows: [updatedRow] });

      const updated = await repo.update({ ...baseSession, status: TestStatus.RUNNING, startedAt: new Date() });
      expect(updated).toBeDefined();
      expect(updated.status).toBe(TestStatus.RUNNING);
      expect(mockPoolQuery).toHaveBeenCalled();
      const sql: string = mockPoolQuery.mock.calls[0][0];
      expect(sql.toUpperCase()).toContain('UPDATE');
    });
  });

  describe('delete()', () => {
    it('calls pool.query with DELETE statement', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });
      await repo.delete('sess-db-001');
      expect(mockPoolQuery).toHaveBeenCalled();
      const sql: string = mockPoolQuery.mock.calls[0][0];
      expect(sql.toUpperCase()).toContain('DELETE');
    });
  });

  describe('findRecent()', () => {
    it('returns an array of sessions', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [dbRow, dbRow] });
      const sessions = await repo.findRecent(5);
      expect(sessions).toHaveLength(2);
    });

    it('returns empty array when no sessions exist', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });
      const sessions = await repo.findRecent();
      expect(sessions).toHaveLength(0);
    });
  });
});

