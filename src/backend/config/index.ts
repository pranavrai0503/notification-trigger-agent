import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  nodeEnv: string;
  port: number;
  browserstack: {
    username: string;
    accessKey: string;
    apiUrl: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  app: {
    packageAndroid: string;
    packageIOS: string;
    activityAndroid: string;
  };
  test: {
    defaultTimeoutMs: number;
    sessionTimeoutMs: number;
    maxRetryAttempts: number;
    retryDelayMs: number;
  };
  ws: {
    port: number;
  };
}

let cachedConfig: AppConfig | null = null;

/** Loads and caches application configuration from environment variables. */
export function getConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  cachedConfig = {
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    browserstack: {
      username: process.env['BROWSERSTACK_USERNAME'] ?? '',
      accessKey: process.env['BROWSERSTACK_ACCESS_KEY'] ?? '',
      apiUrl: process.env['BROWSERSTACK_API_URL'] ?? 'https://api-cloud.browserstack.com',
    },
    database: {
      host: process.env['DB_HOST'] ?? 'localhost',
      port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
      name: process.env['DB_NAME'] ?? 'notification_agent',
      user: process.env['DB_USER'] ?? 'postgres',
      password: process.env['DB_PASSWORD'] ?? '',
    },
    app: {
      packageAndroid: process.env['APP_PACKAGE_ANDROID'] ?? 'com.example.app',
      packageIOS: process.env['APP_PACKAGE_IOS'] ?? 'com.example.app',
      activityAndroid:
        process.env['APP_ACTIVITY_ANDROID'] ?? 'com.example.app.MainActivity',
    },
    test: {
      defaultTimeoutMs: parseInt(process.env['DEFAULT_TIMEOUT_MS'] ?? '30000', 10),
      sessionTimeoutMs: parseInt(process.env['SESSION_TIMEOUT_MS'] ?? '300000', 10),
      maxRetryAttempts: parseInt(process.env['MAX_RETRY_ATTEMPTS'] ?? '3', 10),
      retryDelayMs: parseInt(process.env['RETRY_DELAY_MS'] ?? '2000', 10),
    },
    ws: {
      port: parseInt(process.env['WS_PORT'] ?? '3001', 10),
    },
  };

  return cachedConfig;
}

/** Resets the configuration cache (useful for tests). */
export function resetConfig(): void {
  cachedConfig = null;
}
