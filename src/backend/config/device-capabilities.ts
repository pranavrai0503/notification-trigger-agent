export interface DeviceCapabilities {
  device: string;
  os_version: string;
  app: string;
  project?: string;
  build?: string;
  name?: string;
  autoAcceptAlerts?: boolean;
  autoGrantPermissions?: boolean;
  [key: string]: unknown;
}

export interface WebDriverSession {
  sessionId: string;
  capabilities: DeviceCapabilities;
  createdAt: Date;
}

export const DEFAULT_ANDROID_CAPABILITIES: Partial<DeviceCapabilities> = {
  os_version: '13.0',
  device: 'Samsung Galaxy S23',
  autoGrantPermissions: true,
  project: 'Notification Trigger Agent',
  build: 'Android Tests',
};

export const DEFAULT_IOS_CAPABILITIES: Partial<DeviceCapabilities> = {
  os_version: '16',
  device: 'iPhone 14',
  autoAcceptAlerts: true,
  project: 'Notification Trigger Agent',
  build: 'iOS Tests',
};
