import { Pool } from 'pg';
import { getConfig } from '../config';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const config = getConfig();
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    });
  }
  return pool;
}

/**
 * Interface satisfied by both the real LogRepository and test doubles so that
 * log routes can accept either via dependency injection.
 */
export interface ILogRepository {
  append(sessionId: string, entries: unknown[]): Promise<void>;
  findAll(sessionId: string): Promise<unknown[]>;
  findByEvent(sessionId: string, eventName: string): Promise<unknown[]>;
}

/**
 * PostgreSQL-backed repository for persisting and querying session log entries.
 *
 * Log entries are stored as JSONB payloads in the `logs` table so that
 * arbitrary structured events (UBA, custom) can be persisted and replayed
 * without schema migrations for every new field.
 */
export class LogRepository implements ILogRepository {
  /**
   * Appends one or more log entries for a session.
   * Metadata fields (`eventName`, `platform`, `userId`, `referrer`,
   * `timestamp`) are extracted for indexed columns when present;
   * the full entry object is stored in the `payload` JSONB column.
   * @param sessionId - Test session ID
   * @param entries - Array of log entry objects to store
   */
  async append(sessionId: string, entries: unknown[]): Promise<void> {
    if (entries.length === 0) return;
    const db = getPool();
    for (const entry of entries) {
      const e = entry as Record<string, unknown>;
      const eventName = typeof e['eventName'] === 'string' ? e['eventName'] : '';
      const platform =
        typeof e['platform'] === 'string' ? e['platform'] : 'android';
      const userId =
        typeof e['userId'] === 'string' ? e['userId'] : null;
      const referrer =
        typeof e['referrer'] === 'string' ? e['referrer'] : null;
      const raw =
        typeof e['raw'] === 'string' ? e['raw'] : null;
      let timestamp: Date;
      try {
        timestamp =
          typeof e['timestamp'] === 'string'
            ? new Date(e['timestamp'])
            : new Date();
        if (isNaN(timestamp.getTime())) timestamp = new Date();
      } catch {
        timestamp = new Date();
      }

      await db.query(
        `INSERT INTO logs
           (session_id, platform, event_name, user_id, referrer, payload, raw, timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          sessionId,
          platform,
          eventName,
          userId,
          referrer,
          JSON.stringify(entry),
          raw,
          timestamp,
        ]
      );
    }
  }

  /**
   * Returns all log entries for a session in ascending timestamp order.
   * @param sessionId - Test session ID
   */
  async findAll(sessionId: string): Promise<unknown[]> {
    const db = getPool();
    const result = await db.query<{ payload: unknown }>(
      'SELECT payload FROM logs WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );
    return result.rows.map((row) => row.payload);
  }

  /**
   * Returns log entries for a session filtered by exact event name match.
   * @param sessionId - Test session ID
   * @param eventName - Event name to filter by
   */
  async findByEvent(
    sessionId: string,
    eventName: string
  ): Promise<unknown[]> {
    const db = getPool();
    const result = await db.query<{ payload: unknown }>(
      `SELECT payload FROM logs
       WHERE session_id = $1 AND event_name = $2
       ORDER BY timestamp ASC`,
      [sessionId, eventName]
    );
    return result.rows.map((row) => row.payload);
  }
}
