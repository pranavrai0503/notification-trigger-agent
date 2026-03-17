import React from 'react';
import styles from '../styles/ResultsPanel.module.css';
import DeviceStatusCard from './DeviceStatusCard';
import ProgressBar from './ProgressBar';

export interface PhaseResult { phase: string; status: string; durationMs: number; error?: string; }
export interface ResultsPanelProps { sessionId?: string; status: string; phases: PhaseResult[]; progress: number; isLoading?: boolean; }

const ResultsPanel: React.FC<ResultsPanelProps> = ({ sessionId, status, phases, progress, isLoading }) => (
  <div className={styles.panel}>
    <h2 className={styles.title}>Test Results</h2>
    {isLoading && <ProgressBar value={progress} />}
    {sessionId && <p className={styles.sessionId}>Session: {sessionId}</p>}
    <div className={styles.statusBadge} data-status={status}>{status}</div>
    <div className={styles.phases}>
      {phases.map((p) => (
        <div key={p.phase} className={styles.phaseRow}>
          <span className={styles.phaseName}>{p.phase}</span>
          <span className={styles.phaseStatus} data-status={p.status}>{p.status}</span>
          <span className={styles.phaseDuration}>{p.durationMs}ms</span>
          {p.error && <span className={styles.phaseError}>{p.error}</span>}
        </div>
      ))}
    </div>
    <DeviceStatusCard platform="android" status={status} />
    <DeviceStatusCard platform="ios" status={status} />
  </div>
);
export default ResultsPanel;
