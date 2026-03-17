import React, { useState } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import styles from '../styles/TestInputPanel.module.css';

export interface TestFormData {
  curlCommand: string;
  username: string;
  password: string;
  appState: 'FOREGROUND' | 'BACKGROUND' | 'KILLED';
  checkPushNotification: boolean;
  checkInAppNotification: boolean;
  checkLandingPage: boolean;
  extractLogs: boolean;
  platforms: Array<'android' | 'ios'>;
}

interface ExtractedParams {
  method?: string;
  url?: string;
  eventCode?: string | null;
  userId?: string | null;
}

interface TestInputPanelProps {
  onSubmit: (data: TestFormData) => void;
  isLoading?: boolean;
}

/**
 * Panel for inputting cURL command, credentials, and test options.
 */
const TestInputPanel: React.FC<TestInputPanelProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<TestFormData>({
    curlCommand: '',
    username: '',
    password: '',
    appState: 'FOREGROUND',
    checkPushNotification: true,
    checkInAppNotification: false,
    checkLandingPage: false,
    extractLogs: true,
    platforms: ['android'],
  });

  const [extractedParams, setExtractedParams] = useState<ExtractedParams>({});
  const { errors, validate } = useFormValidation();

  const handleCurlChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, curlCommand: value }));

    // Simple client-side extraction preview
    const urlMatch = value.match(/https?:\/\/[^\s'"]+/);
    const methodMatch = value.match(/-X\s+([A-Z]+)/);
    const eventMatch = value.match(/"eventCode"\s*:\s*"([^"]+)"/);
    const userMatch = value.match(/"userId"\s*:\s*"([^"]+)"/);

    setExtractedParams({
      url: urlMatch?.[0],
      method: methodMatch?.[1] ?? 'GET',
      eventCode: eventMatch?.[1] ?? null,
      userId: userMatch?.[1] ?? null,
    });
  };

  const handlePlatformChange = (platform: 'android' | 'ios', checked: boolean): void => {
    setFormData((prev) => ({
      ...prev,
      platforms: checked
        ? [...prev.platforms, platform]
        : prev.platforms.filter((p) => p !== platform),
    }));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (validate(formData)) {
      onSubmit(formData);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Test Configuration</h2>
      <form onSubmit={handleSubmit} noValidate>
        {/* cURL Input */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="curlInput">
            cURL Command
          </label>
          <textarea
            id="curlInput"
            className={`${styles.textarea} ${errors.curlCommand ? styles.inputError : ''}`}
            value={formData.curlCommand}
            onChange={handleCurlChange}
            placeholder="curl -X POST https://api.example.com/notify -H 'Content-Type: application/json' -d '{...}'"
            rows={6}
            aria-describedby="curlHelp"
          />
          {errors.curlCommand && (
            <span className={styles.errorText} role="alert">
              {errors.curlCommand}
            </span>
          )}
          <span id="curlHelp" className={styles.helpText}>
            Paste the cURL command from your notification API documentation.
          </span>
        </div>

        {/* Extracted Parameters Preview */}
        {extractedParams.url && (
          <div className={styles.extractedParams} aria-live="polite">
            <h3 className={styles.sectionTitle}>Extracted Parameters</h3>
            <dl className={styles.paramList}>
              <dt>Method</dt>
              <dd>{extractedParams.method}</dd>
              <dt>URL</dt>
              <dd className={styles.truncate}>{extractedParams.url}</dd>
              {extractedParams.eventCode && (
                <>
                  <dt>Event Code</dt>
                  <dd>{extractedParams.eventCode}</dd>
                </>
              )}
              {extractedParams.userId && (
                <>
                  <dt>User ID</dt>
                  <dd>{extractedParams.userId}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        {/* Credentials */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="username">
              Username / Email
            </label>
            <input
              id="username"
              type="text"
              className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
              value={formData.username}
              onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
              autoComplete="username"
            />
            {errors.username && (
              <span className={styles.errorText} role="alert">
                {errors.username}
              </span>
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              autoComplete="current-password"
            />
            {errors.password && (
              <span className={styles.errorText} role="alert">
                {errors.password}
              </span>
            )}
          </div>
        </div>

        {/* App State */}
        <div className={styles.fieldGroup}>
          <span className={styles.label}>App State</span>
          <div className={styles.radioGroup}>
            {(['FOREGROUND', 'BACKGROUND', 'KILLED'] as const).map((state) => (
              <label key={state} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="appState"
                  value={state}
                  checked={formData.appState === state}
                  onChange={() => setFormData((p) => ({ ...p, appState: state }))}
                />
                {state.charAt(0) + state.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
        </div>

        {/* Platforms */}
        <div className={styles.fieldGroup}>
          <span className={styles.label}>Platforms</span>
          <div className={styles.checkboxGroup}>
            {(['android', 'ios'] as const).map((platform) => (
              <label key={platform} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.platforms.includes(platform)}
                  onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                />
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </label>
            ))}
          </div>
          {errors.platforms && (
            <span className={styles.errorText} role="alert">
              {errors.platforms}
            </span>
          )}
        </div>

        {/* Notification Options */}
        <div className={styles.fieldGroup}>
          <span className={styles.label}>Verification Options</span>
          <div className={styles.checkboxGroup}>
            {(
              [
                { key: 'checkPushNotification', label: 'Push Notification' },
                { key: 'checkInAppNotification', label: 'In-App Notification' },
                { key: 'checkLandingPage', label: 'Landing Page' },
                { key: 'extractLogs', label: 'Extract UBA Logs' },
              ] as const
            ).map(({ key, label }) => (
              <label key={key} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData[key]}
                  onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Running Test…' : 'Run Test'}
        </button>
      </form>
    </div>
  );
};

export default TestInputPanel;
