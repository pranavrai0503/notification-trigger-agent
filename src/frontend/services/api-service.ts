const BASE_URL = '/api';
export const apiService = {
  async parseCurl(curl: string) {
    const res = await fetch(`${BASE_URL}/curl/parse`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ curl }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async startTest(config: unknown) {
    const res = await fetch(`${BASE_URL}/tests/start`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(config) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async getTestSession(id: string) {
    const res = await fetch(`${BASE_URL}/tests/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async getTestResults(id: string) {
    const res = await fetch(`${BASE_URL}/tests/${id}/results`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};
