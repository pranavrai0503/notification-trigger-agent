import express from 'express';
import request from 'supertest';
import curlRoutes from '../../src/backend/routes/curl.routes';
import { createLogsRouter } from '../../src/backend/routes/logs.routes';
import { ILogRepository } from '../../src/backend/repository/log.repository';
import { createTestsRouter } from '../../src/backend/routes/tests.routes';
import { ITestSessionRepository } from '../../src/backend/repository/test-session.repository';
import { TestSession, TestStatus } from '../../src/backend/types/test-session';

// uuid uses pure ESM in newer versions; mock it to stay in CommonJS mode,
// matching the pattern used in test-orchestrator.test.ts
let _uuidSeq = 0;
jest.mock('uuid', () => ({ v4: jest.fn().mockImplementation(() => `test-session-${++_uuidSeq}`) }));

// ---------------------------------------------------------------------------
// In-memory mock implementations (substitutes for real DB repositories)
// ---------------------------------------------------------------------------

class InMemoryLogRepository implements ILogRepository {
  private store = new Map<string, unknown[]>();

  async append(sessionId: string, entries: unknown[]): Promise<void> {
    const existing = this.store.get(sessionId) ?? [];
    this.store.set(sessionId, [...existing, ...entries]);
  }

  async findAll(sessionId: string): Promise<unknown[]> {
    return this.store.get(sessionId) ?? [];
  }

  async findByEvent(sessionId: string, eventName: string): Promise<unknown[]> {
    const logs = (this.store.get(sessionId) ?? []) as Array<{ eventName?: string }>;
    return logs.filter((l) => l.eventName === eventName);
  }
}

class InMemoryTestSessionRepository implements ITestSessionRepository {
  private store = new Map<string, TestSession>();

  async create(session: TestSession): Promise<TestSession> {
    this.store.set(session.id, session);
    return session;
  }

  async findById(id: string): Promise<TestSession | null> {
    return this.store.get(id) ?? null;
  }

  async update(session: TestSession): Promise<TestSession> {
    this.store.set(session.id, session);
    return session;
  }

  async findRecent(limit = 20): Promise<TestSession[]> {
    return Array.from(this.store.values()).slice(0, limit);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

// ---------------------------------------------------------------------------
// Express apps wired with mock repositories
// ---------------------------------------------------------------------------

const mockLogRepo = new InMemoryLogRepository();
const mockSessionRepo = new InMemoryTestSessionRepository();

// Minimal orchestrator mock – POST /start triggers it but we just need it to
// not throw so we can test the HTTP layer.
const mockOrchestrator = {
  runTest: jest.fn().mockResolvedValue({
    id: 'mock-id',
    config: {},
    status: TestStatus.PASSED,
    phases: [],
    createdAt: new Date(),
    screenshots: [],
  }),
} as unknown as import('../../src/backend/services/test-orchestrator').TestOrchestrator;

const app = express();
app.use(express.json());
app.use('/api/curl', curlRoutes);
app.use('/api/logs', createLogsRouter(mockLogRepo));
app.use('/api/tests', createTestsRouter(mockSessionRepo, mockOrchestrator));

// ---------------------------------------------------------------------------
// /api/curl
// ---------------------------------------------------------------------------

describe('API Routes – /api/curl', () => {
  describe('POST /api/curl/parse', () => {
    it('returns 400 when curl field is missing', async () => {
      const res = await request(app).post('/api/curl/parse').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/curl field is required/i);
    });

    it('returns 400 for invalid cURL command', async () => {
      const res = await request(app)
        .post('/api/curl/parse')
        .send({ curl: 'wget https://example.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid cURL/i);
    });

    it('returns 200 with parsed data for a valid cURL command', async () => {
      const res = await request(app)
        .post('/api/curl/parse')
        .send({
          curl: "curl -X POST 'https://api.example.com/notify' -H 'Content-Type: application/json' -d '{\"eventCode\":\"PUSH_001\",\"userId\":\"u1\"}'",
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.method).toBe('POST');
      expect(res.body.data.url).toBe('https://api.example.com/notify');
      expect(res.body.data.eventCode).toBe('PUSH_001');
    });

    it('returns 422 when parsed cURL has an invalid URL', async () => {
      const res = await request(app)
        .post('/api/curl/parse')
        .send({ curl: 'curl ftp://bad-protocol/path' });
      expect([400, 422]).toContain(res.status);
    });
  });
});

// ---------------------------------------------------------------------------
// /api/logs
// ---------------------------------------------------------------------------

describe('API Routes – /api/logs', () => {
  const sessionId = 'test-session-routes';

  it('GET /api/logs/:id returns empty array for new session', async () => {
    const res = await request(app).get(`/api/logs/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('POST /api/logs/:id stores logs', async () => {
    const logs = [
      { eventName: 'PUSH_RECEIVED', platform: 'android', timestamp: '2024-01-01' },
    ];
    const res = await request(app)
      .post(`/api/logs/${sessionId}`)
      .send(logs);
    expect(res.status).toBe(201);
    expect(res.body.count).toBe(1);
  });

  it('GET /api/logs/:id returns stored logs', async () => {
    const res = await request(app).get(`/api/logs/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/logs/:id/event/:eventName filters by event name', async () => {
    await request(app)
      .post(`/api/logs/${sessionId}`)
      .send([
        { eventName: 'SCREEN_VIEW', platform: 'ios', timestamp: '2024-01-02' },
      ]);

    const res = await request(app).get(`/api/logs/${sessionId}/event/SCREEN_VIEW`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((l: { eventName: string }) => l.eventName === 'SCREEN_VIEW')).toBe(true);
  });

  it('POST /api/logs/:id stores single object (not array)', async () => {
    const sessionId2 = 'test-session-single';
    const res = await request(app)
      .post(`/api/logs/${sessionId2}`)
      .send({ eventName: 'CLICK', platform: 'android', timestamp: '2024-01-03' });
    expect(res.status).toBe(201);
    expect(res.body.count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// /api/tests
// ---------------------------------------------------------------------------

describe('API Routes – /api/tests', () => {
  it('GET /api/tests/:id returns 404 for unknown session', async () => {
    const res = await request(app).get('/api/tests/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/session not found/i);
  });

  it('POST /api/tests/start returns 202 with sessionId', async () => {
    const config = {
      curlCommand: "curl -X POST 'https://api.example.com/notify' -d '{}'",
      credentials: { username: 'u', password: 'p' },
      appState: 'FOREGROUND',
      platforms: ['android'],
      checkPushNotification: false,
      checkInAppNotification: false,
      checkLandingPage: false,
      extractLogs: false,
    };
    const res = await request(app).post('/api/tests/start').send(config);
    expect(res.status).toBe(202);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.status).toBe(TestStatus.PENDING);
  });

  it('GET /api/tests/:id returns session after start', async () => {
    // First create a session
    const config = {
      curlCommand: "curl -X POST 'https://api.example.com/notify' -d '{}'",
      credentials: { username: 'u', password: 'p' },
      appState: 'FOREGROUND',
      platforms: ['android'],
      checkPushNotification: false,
      checkInAppNotification: false,
      checkLandingPage: false,
      extractLogs: false,
    };
    const startRes = await request(app).post('/api/tests/start').send(config);
    const { sessionId } = startRes.body as { sessionId: string };

    const getRes = await request(app).get(`/api/tests/${sessionId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(sessionId);
    expect(getRes.body.data.status).toBe(TestStatus.PENDING);
  });

  it('GET /api/tests/:id/results returns 404 for unknown session', async () => {
    const res = await request(app).get('/api/tests/unknown-id/results');
    expect(res.status).toBe(404);
  });

  it('GET /api/tests/:id/results returns session data', async () => {
    const config = {
      curlCommand: "curl -X POST 'https://api.example.com/notify' -d '{}'",
      credentials: { username: 'u', password: 'p' },
      appState: 'FOREGROUND',
      platforms: ['android'],
      checkPushNotification: false,
      checkInAppNotification: false,
      checkLandingPage: false,
      extractLogs: false,
    };
    const startRes = await request(app).post('/api/tests/start').send(config);
    const { sessionId } = startRes.body as { sessionId: string };

    const resultsRes = await request(app).get(`/api/tests/${sessionId}/results`);
    expect(resultsRes.status).toBe(200);
    expect(resultsRes.body.data.session).toBeDefined();
    expect(resultsRes.body.data.phases).toBeDefined();
  });
});
