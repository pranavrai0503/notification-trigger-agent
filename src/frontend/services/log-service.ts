const BASE_URL = '/api';
export const logService = {
  async getLogs(sessionId: string): Promise<unknown[]> {
    const res = await fetch(`${BASE_URL}/logs/${sessionId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { data: unknown[] };
    return data.data;
  },
  async getLogsByEvent(sessionId: string, eventName: string): Promise<unknown[]> {
    const res = await fetch(`${BASE_URL}/logs/${sessionId}/event/${eventName}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { data: unknown[] };
    return data.data;
  },
};
