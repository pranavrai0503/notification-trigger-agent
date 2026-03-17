/** Timeout values (ms) used throughout the test automation flows. */
export const TIMEOUTS = {
  /** Default element find timeout */
  ELEMENT_FIND: 10_000,
  /** Time to wait for app launch */
  APP_LAUNCH: 30_000,
  /** Time to wait after triggering a notification */
  NOTIFICATION_APPEAR: 15_000,
  /** Time to wait for page navigation after tapping */
  NAVIGATION: 10_000,
  /** How long to wait for 2FA screen */
  TWO_FA: 20_000,
  /** Default HTTP request timeout */
  HTTP_REQUEST: 30_000,
  /** BrowserStack session creation timeout */
  SESSION_CREATE: 60_000,
  /** Time to keep app in background */
  BACKGROUND_DEFAULT: 5,
  /** How long to wait for logcat results */
  LOGCAT: 15_000,
  /** Overall test session timeout */
  TEST_SESSION: 300_000,
} as const;

export type TimeoutKey = keyof typeof TIMEOUTS;
