import { Pool } from 'pg';
import { getConfig } from '../config';
import { TestSession } from '../types/test-session';
import { TestSessionRow, rowToTestSession } from '../models/TestSession';

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
 * Repository for TestSession persistence operations.
 */
export class TestSessionRepository {
  /**
   * Persists a new TestSession record.
   * @param session - TestSession to insert
   */
  async create(session: TestSession): Promise<TestSession> {
    const db = getPool();
    const result = await db.query<TestSessionRow>(
      `INSERT INTO test_sessions
         (id, status, config, phases, screenshots, android_session_id, ios_session_id, logs, error, created_at, started_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        session.id,
        session.status,
        JSON.stringify(session.config),
        JSON.stringify(session.phases),
        session.screenshots,
        session.androidSessionId ?? null,
        session.iosSessionId ?? null,
        session.logs ? JSON.stringify(session.logs) : null,
        session.error ?? null,
        session.createdAt,
        session.startedAt ?? null,
        session.completedAt ?? null,
      ]
    );
    return rowToTestSession(result.rows[0]);
  }

  /**
   * Retrieves a TestSession by ID.
   * @param id - Session UUID
   */
  async findById(id: string): Promise<TestSession | null> {
    const db = getPool();
    const result = await db.query<TestSessionRow>(
      'SELECT * FROM test_sessions WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToTestSession(result.rows[0]) : null;
  }

  /**
   * Returns the most recent N test sessions.
   * @param limit - Maximum results to return (default 20)
   */
  async findRecent(limit = 20): Promise<TestSession[]> {
    const db = getPool();
    const result = await db.query<TestSessionRow>(
      'SELECT * FROM test_sessions ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows.map(rowToTestSession);
  }

  /**
   * Updates the status and completion fields of an existing session.
   * @param session - Updated TestSession
   */
  async update(session: TestSession): Promise<TestSession> {
    const db = getPool();
    const result = await db.query<TestSessionRow>(
      `UPDATE test_sessions
       SET status=$2, phases=$3, screenshots=$4, android_session_id=$5, ios_session_id=$6,
           logs=$7, error=$8, started_at=$9, completed_at=$10
       WHERE id=$1
       RETURNING *`,
      [
        session.id,
        session.status,
        JSON.stringify(session.phases),
        session.screenshots,
        session.androidSessionId ?? null,
        session.iosSessionId ?? null,
        session.logs ? JSON.stringify(session.logs) : null,
        session.error ?? null,
        session.startedAt ?? null,
        session.completedAt ?? null,
      ]
    );
    return rowToTestSession(result.rows[0]);
  }

  /**
   * Deletes a session record by ID.
   * @param id - Session UUID
   */
  async delete(id: string): Promise<void> {
    const db = getPool();
    await db.query('DELETE FROM test_sessions WHERE id = $1', [id]);
  }
}
