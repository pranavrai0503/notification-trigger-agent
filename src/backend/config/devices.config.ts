import { DeviceCapabilities } from './device-capabilities';

export interface DeviceConfig {
  name: string;
  platform: 'android' | 'ios';
  capabilities: DeviceCapabilities;
}

export const ANDROID_DEVICES: DeviceConfig[] = [
  {
    name: 'Samsung Galaxy S23',
    platform: 'android',
    capabilities: {
      device: 'Samsung Galaxy S23',
      os_version: '13.0',
      app: '',
      project: 'Notification Trigger Agent',
      build: 'Android Tests',
      autoGrantPermissions: true,
    },
  },
  {
    name: 'Google Pixel 7',
    platform: 'android',
    capabilities: {
      device: 'Google Pixel 7',
      os_version: '13.0',
      app: '',
      project: 'Notification Trigger Agent',
      build: 'Android Tests',
      autoGrantPermissions: true,
    },
  },
  {
    name: 'OnePlus 11',
    platform: 'android',
    capabilities: {
      device: 'OnePlus 11',
      os_version: '13.0',
      app: '',
      project: 'Notification Trigger Agent',
      build: 'Android Tests',
      autoGrantPermissions: true,
    },
  },
];

export const IOS_DEVICES: DeviceConfig[] = [
  {
    name: 'iPhone 14',
    platform: 'ios',
    capabilities: {
      device: 'iPhone 14',
      os_version: '16',
      app: '',
      project: 'Notification Trigger Agent',
      build: 'iOS Tests',
      autoAcceptAlerts: true,
    },
  },
  {
    name: 'iPhone 14 Pro',
    platform: 'ios',
    capabilities: {
      device: 'iPhone 14 Pro',
      os_version: '16',
      app: '',
      project: 'Notification Trigger Agent',
      build: 'iOS Tests',
      autoAcceptAlerts: true,
    },
  },
  {
    name: 'iPad Air 5',
    platform: 'ios',
    capabilities: {
      device: 'iPad Air 5',
      os_version: '16',
      app: '',
      project: 'Notification Trigger Agent',
      build: 'iOS Tests',
      autoAcceptAlerts: true,
    },
  },
];

export const ALL_DEVICES: DeviceConfig[] = [...ANDROID_DEVICES, ...IOS_DEVICES];
