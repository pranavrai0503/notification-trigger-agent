import React from 'react';
interface Props { value: number; max?: number; label?: string; }
const ProgressBar: React.FC<Props> = ({ value, max = 100, label }) => (
  <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} style={{ width: '100%', background: '#e5e7eb', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
    <div style={{ width: `${(value / max) * 100}%`, background: '#6366f1', height: '100%', transition: 'width 0.3s' }} />
    {label && <span>{label}</span>}
  </div>
);
export default ProgressBar;
