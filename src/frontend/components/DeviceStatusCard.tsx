import React from 'react';
interface Props { platform: 'android' | 'ios'; status: string; sessionId?: string; }
const DeviceStatusCard: React.FC<Props> = ({ platform, status, sessionId }) => (
  <div data-testid={`device-status-${platform}`} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', margin: '8px 0' }}>
    <strong>{platform === 'android' ? '🤖 Android' : '🍎 iOS'}</strong>
    <span style={{ marginLeft: '12px', color: status === 'PASSED' ? 'green' : status === 'FAILED' ? 'red' : '#888' }}>{status}</span>
    {sessionId && <small style={{ display: 'block', color: '#6b7280' }}>Session: {sessionId}</small>}
  </div>
);
export default DeviceStatusCard;
