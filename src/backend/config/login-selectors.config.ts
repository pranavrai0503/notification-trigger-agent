/** Selectors for locating login screen elements across Android and iOS. */
export const LOGIN_SELECTORS = {
  android: {
    usernameField: {
      strategy: 'accessibility id' as const,
      value: 'username_field',
    },
    passwordField: {
      strategy: 'accessibility id' as const,
      value: 'password_field',
    },
    submitButton: {
      strategy: 'accessibility id' as const,
      value: 'login_button',
    },
    twoFAInput: {
      strategy: 'accessibility id' as const,
      value: 'two_fa_input',
    },
    homeIndicator: {
      strategy: 'accessibility id' as const,
      value: 'home_screen',
    },
    errorMessage: {
      strategy: 'id' as const,
      value: 'com.example.app:id/login_error',
    },
  },
  ios: {
    usernameField: {
      strategy: 'accessibility id' as const,
      value: 'username_field',
    },
    passwordField: {
      strategy: 'accessibility id' as const,
      value: 'password_field',
    },
    submitButton: {
      strategy: 'accessibility id' as const,
      value: 'login_button',
    },
    twoFAInput: {
      strategy: 'accessibility id' as const,
      value: 'two_fa_input',
    },
    homeIndicator: {
      strategy: 'accessibility id' as const,
      value: 'home_screen',
    },
    errorMessage: {
      strategy: '-ios predicate string' as const,
      value: 'label == "Invalid credentials"',
    },
  },
};
