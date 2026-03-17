import { UBALog } from '../services/android-log-extractor';

/** Database row representation of a UBA log entry. */
export interface LogRow {
  id: string;
  session_id: string;
  platform: 'android' | 'ios';
  event_name: string;
  user_id: string | null;
  referrer: string | null;
  payload: Record<string, unknown>;
  raw: string | null;
  timestamp: Date;
}

/** Maps a UBALog + metadata to a database-ready row. */
export function logToRow(
  log: UBALog,
  sessionId: string,
  platform: 'android' | 'ios'
): Omit<LogRow, 'id'> {
  return {
    session_id: sessionId,
    platform,
    event_name: log.eventName,
    user_id: log.userId ?? null,
    referrer: log.referrer ?? null,
    payload: log.payload,
    raw: log.raw,
    timestamp: new Date(log.timestamp),
  };
}

/** Maps a database row to a UBALog domain object. */
export function rowToLog(row: LogRow): UBALog {
  return {
    timestamp: row.timestamp.toISOString(),
    eventName: row.event_name,
    userId: row.user_id ?? undefined,
    referrer: row.referrer ?? undefined,
    payload: row.payload,
    raw: row.raw ?? '',
  };
}
