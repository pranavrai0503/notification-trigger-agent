export enum TestStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  ABORTED = 'ABORTED',
}

export enum TestPhase {
  SETUP = 'SETUP',
  LOGIN = 'LOGIN',
  APP_STATE = 'APP_STATE',
  TRIGGER = 'TRIGGER',
  VERIFY_PUSH = 'VERIFY_PUSH',
  VERIFY_INAPP = 'VERIFY_INAPP',
  TAP_VALIDATE = 'TAP_VALIDATE',
  LOG_EXTRACTION = 'LOG_EXTRACTION',
  REPORT = 'REPORT',
  TEARDOWN = 'TEARDOWN',
}

export interface PhaseResult {
  phase: TestPhase;
  status: TestStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  data?: unknown;
  error?: string;
}

export interface TestConfig {
  curlCommand: string;
  credentials: {
    username: string;
    password: string;
  };
  appState: 'FOREGROUND' | 'BACKGROUND' | 'KILLED';
  platforms: Array<'android' | 'ios'>;
  checkPushNotification: boolean;
  checkInAppNotification: boolean;
  checkLandingPage: boolean;
  extractLogs: boolean;
  deviceCapabilities?: Record<string, unknown>;
}

export interface TestSession {
  id: string;
  config: TestConfig;
  status: TestStatus;
  phases: PhaseResult[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  androidSessionId?: string;
  iosSessionId?: string;
  screenshots: string[];
  logs?: unknown;
  error?: string;
}
