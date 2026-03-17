export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginElements {
  usernameField: unknown;
  passwordField: unknown;
  submitButton: unknown;
  twoFAField?: unknown;
}

export interface LoginResult {
  success: boolean;
  required2FA: boolean;
  error?: string;
}

/**
 * Automates login flow on mobile apps via Appium WebDriver.
 */
export class LoginAutomator {
  /**
   * Performs the full login flow: find elements, submit, verify, handle 2FA.
   * @param driver - Appium WebDriver instance
   * @param credentials - User credentials
   */
  async login(driver: unknown, credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const elements = await this.findLoginElements(driver);
      await this.submitLogin(driver, elements, credentials);

      const required2FA = await this.handle2FA(driver);
      const success = await this.verifyLoginSuccess(driver);

      return { success, required2FA };
    } catch (error) {
      return {
        success: false,
        required2FA: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Locates username, password, and submit elements on the login screen.
   * @param driver - Appium WebDriver instance
   */
  async findLoginElements(driver: unknown): Promise<LoginElements> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown>>;
    const [usernameField, passwordField, submitButton] = await Promise.all([
      d['findElement']('accessibility id', 'username_field'),
      d['findElement']('accessibility id', 'password_field'),
      d['findElement']('accessibility id', 'login_button'),
    ]);

    return { usernameField, passwordField, submitButton };
  }

  /**
   * Fills credentials and taps the submit button.
   * @param driver - Appium WebDriver instance
   * @param elements - Located login UI elements
   * @param credentials - User credentials
   */
  async submitLogin(
    driver: unknown,
    elements: LoginElements,
    credentials: LoginCredentials
  ): Promise<void> {
    const username = elements.usernameField as Record<string, (...a: unknown[]) => Promise<void>>;
    const password = elements.passwordField as Record<string, (...a: unknown[]) => Promise<void>>;
    const submit = elements.submitButton as Record<string, (...a: unknown[]) => Promise<void>>;
    void driver;

    await username['clear']();
    await username['sendKeys'](credentials.username);
    await password['clear']();
    await password['sendKeys'](credentials.password);
    await submit['click']();
  }

  /**
   * Checks whether login succeeded by looking for a home screen indicator.
   * @param driver - Appium WebDriver instance
   */
  async verifyLoginSuccess(driver: unknown): Promise<boolean> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    try {
      const homeElements = await d['findElements']('accessibility id', 'home_screen');
      return homeElements.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Handles 2FA if the screen is displayed; submits a blank/skip action.
   * @param driver - Appium WebDriver instance
   * @returns true if 2FA screen was encountered
   */
  async handle2FA(driver: unknown): Promise<boolean> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    try {
      const twoFAElements = await d['findElements']('accessibility id', 'two_fa_input');
      if (twoFAElements.length === 0) return false;

      // In a real implementation, retrieve OTP from email/SMS and submit.
      return true;
    } catch {
      return false;
    }
  }
}
