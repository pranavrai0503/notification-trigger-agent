import express from 'express';
import request from 'supertest';
import curlRoutes from '../../src/backend/routes/curl.routes';
import logsRoutes from '../../src/backend/routes/logs.routes';

const app = express();
app.use(express.json());
app.use('/api/curl', curlRoutes);
app.use('/api/logs', logsRoutes);

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
    // Store two different events
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
