import { ParsedCurl } from '../services/curl-parser';

/**
 * Validates that a raw cURL string contains the required elements.
 * @param curl - Raw cURL command string
 */
export function validateCurlCommand(curl: string): boolean {
  if (!curl || typeof curl !== 'string') return false;
  const trimmed = curl.trim();
  if (!trimmed.startsWith('curl')) return false;
  return /https?:\/\//.test(trimmed);
}

/**
 * Validates a parsed cURL object for required fields and correctness.
 * @param parsed - ParsedCurl object to validate
 */
export function validateParsedCurl(parsed: ParsedCurl): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!parsed.url || parsed.url.trim() === '') {
    errors.push('URL is required');
  } else {
    try {
      new URL(parsed.url);
    } catch {
      errors.push(`Invalid URL: ${parsed.url}`);
    }
  }

  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  if (!validMethods.includes(parsed.method.toUpperCase())) {
    errors.push(`Invalid HTTP method: ${parsed.method}`);
  }

  const contentType = parsed.headers['Content-Type'] || parsed.headers['content-type'];
  if (parsed.body && contentType && !contentType.includes('application/json')) {
    errors.push('Body provided but Content-Type is not application/json');
  }

  return { valid: errors.length === 0, errors };
}
