import React, { useEffect, useState } from 'react';
import { logService } from '../services/log-service';
import styles from '../styles/LogViewer.module.css';

interface LogEntry { timestamp: string; eventName: string; platform: string; payload: Record<string, unknown>; }
interface Props { sessionId: string; }

const LogViewer: React.FC<Props> = ({ sessionId }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setIsLoading(true);
    logService.getLogs(sessionId).then((data) => { setLogs(data as LogEntry[]); setIsLoading(false); }).catch(() => setIsLoading(false));
  }, [sessionId]);

  const filtered = filter ? logs.filter((l) => l.eventName.toLowerCase().includes(filter.toLowerCase())) : logs;

  return (
    <div className={styles.viewer}>
      <div className={styles.header}>
        <h2 className={styles.title}>UBA Logs</h2>
        <input className={styles.filter} placeholder="Filter by event…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      {isLoading && <p className={styles.loading}>Loading logs…</p>}
      <div className={styles.logList}>
        {filtered.map((log, i) => (
          <div key={i} className={styles.logEntry}>
            <span className={styles.ts}>{log.timestamp}</span>
            <span className={`${styles.platform} ${styles[log.platform]}`}>{log.platform}</span>
            <span className={styles.event}>{log.eventName}</span>
            <pre className={styles.payload}>{JSON.stringify(log.payload, null, 2)}</pre>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && <p className={styles.empty}>No logs found.</p>}
      </div>
    </div>
  );
};
export default LogViewer;
