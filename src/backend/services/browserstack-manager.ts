import axios from 'axios';
import { DeviceCapabilities, WebDriverSession } from '../config/device-capabilities';
import { getConfig } from '../config';

/**
 * Manages BrowserStack app upload, device provisioning, and session lifecycle.
 */
export class BrowserStackManager {
  private readonly apiUrl: string;
  private readonly username: string;
  private readonly accessKey: string;

  constructor() {
    const config = getConfig();
    this.apiUrl = config.browserstack.apiUrl;
    this.username = config.browserstack.username;
    this.accessKey = config.browserstack.accessKey;
  }

  private get authHeader(): string {
    const token = Buffer.from(`${this.username}:${this.accessKey}`).toString('base64');
    return `Basic ${token}`;
  }

  /**
   * Uploads an app binary to BrowserStack and returns the app_url.
   * @param filePath - Absolute path to the app binary (.apk or .ipa)
   */
  async uploadApp(filePath: string): Promise<string> {
    const FormData = (await import('form-data')).default;
    const fs = await import('fs');
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await axios.post<{ app_url: string }>(
      `${this.apiUrl}/app-automate/upload`,
      form,
      {
        headers: {
          Authorization: this.authHeader,
          ...form.getHeaders(),
        },
      }
    );

    return response.data.app_url;
  }

  /**
   * Provisions a device and starts a WebDriver session.
   * @param capabilities - Device and app capabilities
   */
  async provisionDevice(capabilities: DeviceCapabilities): Promise<WebDriverSession> {
    const sessionId = await this.createSession(capabilities);
    return {
      sessionId,
      capabilities,
      createdAt: new Date(),
    };
  }

  /**
   * Creates a new Appium session on BrowserStack.
   * @param capabilities - Device and app capabilities
   * @returns The session ID string
   */
  async createSession(capabilities: DeviceCapabilities): Promise<string> {
    const payload = {
      desiredCapabilities: {
        ...capabilities,
        'browserstack.user': this.username,
        'browserstack.key': this.accessKey,
      },
    };

    const response = await axios.post<{ sessionId: string }>(
      `${this.apiUrl}/wd/hub/session`,
      payload,
      {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.sessionId;
  }

  /**
   * Closes a BrowserStack Appium session.
   * @param sessionId - The session ID to close
   */
  async closeSession(sessionId: string): Promise<void> {
    await axios.delete(`${this.apiUrl}/wd/hub/session/${sessionId}`, {
      headers: { Authorization: this.authHeader },
    });
  }

  /**
   * Gets the current status of a BrowserStack session.
   * @param sessionId - The session ID to query
   */
  async getSessionStatus(sessionId: string): Promise<string> {
    const response = await axios.get<{ automation_session: { status: string } }>(
      `${this.apiUrl}/app-automate/sessions/${sessionId}.json`,
      {
        headers: { Authorization: this.authHeader },
      }
    );

    return response.data.automation_session.status;
  }
}
