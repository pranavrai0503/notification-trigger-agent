import { TestConfig, TestSession, TestStatus } from '../types/test-session';

/** Database row representation of a TestSession. */
export interface TestSessionRow {
  id: string;
  status: string;
  config: TestConfig;
  phases: unknown[];
  screenshots: string[];
  android_session_id: string | null;
  ios_session_id: string | null;
  logs: unknown | null;
  error: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

/** Maps a database row to a TestSession domain object. */
export function rowToTestSession(row: TestSessionRow): TestSession {
  return {
    id: row.id,
    status: row.status as TestStatus,
    config: row.config,
    phases: row.phases as TestSession['phases'],
    screenshots: row.screenshots,
    androidSessionId: row.android_session_id ?? undefined,
    iosSessionId: row.ios_session_id ?? undefined,
    logs: row.logs,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}
