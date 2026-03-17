import axios, { AxiosInstance } from 'axios';
import { getConfig } from '../config';

/** Creates an authenticated axios instance for BrowserStack API calls. */
export function createBrowserStackClient(): AxiosInstance {
  const config = getConfig();
  const token = Buffer.from(
    `${config.browserstack.username}:${config.browserstack.accessKey}`
  ).toString('base64');

  return axios.create({
    baseURL: config.browserstack.apiUrl,
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
}

/**
 * Lists all uploaded apps for the account.
 */
export async function listUploadedApps(): Promise<unknown[]> {
  const client = createBrowserStackClient();
  const response = await client.get<unknown[]>('/app-automate/recent_apps');
  return response.data;
}

/**
 * Retrieves details for a specific session.
 * @param sessionId - BrowserStack session identifier
 */
export async function getSessionDetails(sessionId: string): Promise<unknown> {
  const client = createBrowserStackClient();
  const response = await client.get(`/app-automate/sessions/${sessionId}.json`);
  return response.data;
}

/**
 * Fetches device logs (logcat) for an App Automate session.
 * @param sessionId - BrowserStack App Automate session identifier
 */
export async function getDeviceLogs(sessionId: string): Promise<string> {
  const client = createBrowserStackClient();
  const response = await client.get<string>(
    `/app-automate/sessions/${sessionId}/devicelogs`
  );
  return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
}
export async function markSessionStatus(
  sessionId: string,
  status: 'passed' | 'failed',
  reason: string
): Promise<void> {
  const client = createBrowserStackClient();
  await client.put(`/app-automate/sessions/${sessionId}.json`, { status, reason });
}
