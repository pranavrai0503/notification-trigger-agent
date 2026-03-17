import { LoginAutomator, LoginCredentials } from '../../src/backend/services/login-automator';

describe('LoginAutomator', () => {
  let automator: LoginAutomator;
  let mockDriver: Record<string, jest.Mock>;
  let mockUsernameField: Record<string, jest.Mock>;
  let mockPasswordField: Record<string, jest.Mock>;
  let mockSubmitButton: Record<string, jest.Mock>;

  const credentials: LoginCredentials = { username: 'testuser@example.com', password: 'secret123' };

  beforeEach(() => {
    automator = new LoginAutomator();

    mockUsernameField = { clear: jest.fn().mockResolvedValue(undefined), sendKeys: jest.fn().mockResolvedValue(undefined) };
    mockPasswordField = { clear: jest.fn().mockResolvedValue(undefined), sendKeys: jest.fn().mockResolvedValue(undefined) };
    mockSubmitButton = { click: jest.fn().mockResolvedValue(undefined) };

    mockDriver = {
      findElement: jest.fn().mockImplementation((_strategy: string, id: string) => {
        if (id === 'username_field') return Promise.resolve(mockUsernameField);
        if (id === 'password_field') return Promise.resolve(mockPasswordField);
        if (id === 'login_button') return Promise.resolve(mockSubmitButton);
        return Promise.reject(new Error(`Element not found: ${id}`));
      }),
      findElements: jest.fn().mockResolvedValue([]),
    };
  });

  describe('findLoginElements()', () => {
    it('finds and returns login UI elements', async () => {
      const elements = await automator.findLoginElements(mockDriver);
      expect(elements.usernameField).toBe(mockUsernameField);
      expect(elements.passwordField).toBe(mockPasswordField);
      expect(elements.submitButton).toBe(mockSubmitButton);
    });
  });

  describe('submitLogin()', () => {
    it('fills credentials and clicks submit', async () => {
      const elements = { usernameField: mockUsernameField, passwordField: mockPasswordField, submitButton: mockSubmitButton };
      await automator.submitLogin(mockDriver, elements, credentials);

      expect(mockUsernameField.clear).toHaveBeenCalled();
      expect(mockUsernameField.sendKeys).toHaveBeenCalledWith(credentials.username);
      expect(mockPasswordField.clear).toHaveBeenCalled();
      expect(mockPasswordField.sendKeys).toHaveBeenCalledWith(credentials.password);
      expect(mockSubmitButton.click).toHaveBeenCalled();
    });
  });

  describe('verifyLoginSuccess()', () => {
    it('returns true when home_screen element is found', async () => {
      mockDriver.findElements = jest.fn().mockResolvedValue([{ id: 'home' }]);
      const result = await automator.verifyLoginSuccess(mockDriver);
      expect(result).toBe(true);
    });

    it('returns false when home_screen element is not found', async () => {
      mockDriver.findElements = jest.fn().mockResolvedValue([]);
      const result = await automator.verifyLoginSuccess(mockDriver);
      expect(result).toBe(false);
    });

    it('returns false on driver error', async () => {
      mockDriver.findElements = jest.fn().mockRejectedValue(new Error('driver error'));
      const result = await automator.verifyLoginSuccess(mockDriver);
      expect(result).toBe(false);
    });
  });

  describe('handle2FA()', () => {
    it('returns false when no 2FA screen is present', async () => {
      mockDriver.findElements = jest.fn().mockResolvedValue([]);
      const result = await automator.handle2FA(mockDriver);
      expect(result).toBe(false);
    });

    it('returns true when 2FA screen is present', async () => {
      mockDriver.findElements = jest.fn().mockResolvedValue([{ id: '2fa' }]);
      const result = await automator.handle2FA(mockDriver);
      expect(result).toBe(true);
    });
  });

  describe('login()', () => {
    it('returns success:true on happy path', async () => {
      mockDriver.findElements = jest.fn().mockImplementation((_s: string, id: string) => {
        if (id === 'home_screen') return Promise.resolve([{ id: 'home' }]);
        return Promise.resolve([]);
      });

      const result = await automator.login(mockDriver, credentials);
      expect(result.success).toBe(true);
      expect(result.required2FA).toBe(false);
    });

    it('returns success:false when findElement throws', async () => {
      mockDriver.findElement = jest.fn().mockRejectedValue(new Error('element not found'));
      const result = await automator.login(mockDriver, credentials);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/element not found/);
    });
  });
});
