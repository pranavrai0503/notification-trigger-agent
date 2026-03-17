import React, { useEffect, useState } from 'react';
import TestInputPanel from '../components/TestInputPanel';
import ResultsPanel from '../components/ResultsPanel';
import LogViewer from '../components/LogViewer';
import { apiService } from '../services/api-service';
import { TestSession, TestStatus } from '../../backend/types/test-session';
import { TestFormData } from '../components/TestInputPanel';

const Dashboard: React.FC = () => {
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (formData: TestFormData) => {
    setLoading(true);
    setError(null);
    try {
      const newSession = await apiService.startTest(formData);
      setSession(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !session ||
      session.status === TestStatus.PASSED ||
      session.status === TestStatus.FAILED ||
      session.status === TestStatus.ABORTED
    )
      return;
    const interval = setInterval(async () => {
      try {
        const updated = await apiService.getTestSession(session.id);
        setSession(updated);
      } catch {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Notification Trigger Agent</h1>
      </header>
      <main className="dashboard-main">
        <section className="dashboard-left">
          <TestInputPanel onSubmit={handleStart} isLoading={loading} />
        </section>
        <section className="dashboard-right">
          {error && <div className="error-banner">{error}</div>}
          {session && (
            <ResultsPanel
              sessionId={session.id}
              status={session.status}
              phases={(session.phases ?? []).map((p) => ({
                phase: p.phase,
                status: p.status,
                durationMs: p.durationMs ?? 0,
                error: p.error,
              }))}
              progress={loading ? 50 : 100}
              isLoading={loading}
            />
          )}
          {session && <LogViewer sessionId={session.id} />}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
