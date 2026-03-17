import { useState, useCallback } from 'react';
import { TestFormData } from '../components/TestInputPanel';

type FormErrors = Partial<Record<keyof TestFormData, string>>;

interface UseFormValidationReturn {
  errors: FormErrors;
  validate: (data: TestFormData) => boolean;
  clearErrors: () => void;
}

/**
 * Custom hook for validating the test input form.
 */
export function useFormValidation(): UseFormValidationReturn {
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((data: TestFormData): boolean => {
    const newErrors: FormErrors = {};

    if (!data.curlCommand.trim()) {
      newErrors.curlCommand = 'cURL command is required';
    } else if (!data.curlCommand.includes('curl')) {
      newErrors.curlCommand = 'Must be a valid cURL command starting with "curl"';
    } else if (!/https?:\/\//.test(data.curlCommand)) {
      newErrors.curlCommand = 'cURL command must contain a valid URL';
    }

    if (!data.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (data.platforms.length === 0) {
      newErrors.platforms = 'At least one platform must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  return { errors, validate, clearErrors };
}
