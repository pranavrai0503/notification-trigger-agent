import { CurlParser, ParsedCurl } from '../../src/backend/services/curl-parser';
import { validateCurlCommand, validateParsedCurl } from '../../src/backend/utils/curl-validator';

describe('CurlParser', () => {
  let parser: CurlParser;

  beforeEach(() => {
    parser = new CurlParser();
  });

  describe('parse()', () => {
    it('parses a simple GET request', () => {
      const result = parser.parse("curl 'https://api.example.com/users'");
      expect(result.method).toBe('GET');
      expect(result.url).toBe('https://api.example.com/users');
      expect(result.headers).toEqual({});
      expect(result.body).toBeNull();
    });

    it('parses a POST request with -X flag', () => {
      const result = parser.parse(
        "curl -X POST 'https://api.example.com/notify'"
      );
      expect(result.method).toBe('POST');
      expect(result.url).toBe('https://api.example.com/notify');
    });

    it('parses method from --request flag', () => {
      const result = parser.parse(
        "curl --request PUT 'https://api.example.com/resource'"
      );
      expect(result.method).toBe('PUT');
    });

    it('infers POST when -d is present', () => {
      const result = parser.parse(
        "curl 'https://api.example.com/notify' -d '{\"key\":\"value\"}'"
      );
      expect(result.method).toBe('POST');
    });

    it('extracts headers from -H flags', () => {
      const result = parser.parse(
        "curl -H 'Content-Type: application/json' -H 'Authorization: Bearer token123' 'https://api.example.com'"
      );
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Authorization']).toBe('Bearer token123');
    });

    it('extracts JSON body from --data flag', () => {
      const result = parser.parse(
        "curl -X POST 'https://api.example.com' --data '{\"eventCode\":\"PUSH_001\",\"userId\":\"user42\"}'"
      );
      expect(result.body).toEqual({ eventCode: 'PUSH_001', userId: 'user42' });
    });

    it('extracts eventCode from body', () => {
      const result = parser.parse(
        "curl -X POST 'https://api.example.com' -d '{\"eventCode\":\"CLICK_HOME\"}'"
      );
      expect(result.eventCode).toBe('CLICK_HOME');
    });

    it('extracts userId from body', () => {
      const result = parser.parse(
        "curl -X POST 'https://api.example.com' -d '{\"userId\":\"abc123\"}'"
      );
      expect(result.userId).toBe('abc123');
    });

    it('returns null eventCode when body has none', () => {
      const result = parser.parse(
        "curl 'https://api.example.com'"
      );
      expect(result.eventCode).toBeNull();
    });

    it('returns null body when data is not valid JSON', () => {
      const result = parser.parse(
        "curl -X POST 'https://api.example.com' -d 'not-json'"
      );
      expect(result.body).toBeNull();
    });

    it('handles multi-line curl with line continuations', () => {
      const curl = "curl -X POST \\\n  'https://api.example.com' \\\n  -H 'Content-Type: application/json'";
      const result = parser.parse(curl);
      expect(result.method).toBe('POST');
      expect(result.url).toBe('https://api.example.com');
    });

    it('supports --data-raw flag', () => {
      const result = parser.parse(
        "curl -X POST 'https://api.example.com' --data-raw '{\"event_code\":\"TEST\"}'"
      );
      expect(result.eventCode).toBe('TEST');
    });

    it('extracts alternate userId keys (user_id)', () => {
      const result = parser.parse(
        "curl -X POST 'https://api.example.com' -d '{\"user_id\":\"xyz\"}'"
      );
      expect(result.userId).toBe('xyz');
    });

    it('handles DELETE method', () => {
      const result = parser.parse(
        "curl -X DELETE 'https://api.example.com/resource/1'"
      );
      expect(result.method).toBe('DELETE');
    });
  });
});

describe('validateCurlCommand()', () => {
  it('returns true for a valid curl command', () => {
    expect(validateCurlCommand("curl 'https://api.example.com'")).toBe(true);
  });

  it('returns false when curl keyword is missing', () => {
    expect(validateCurlCommand("wget 'https://api.example.com'")).toBe(false);
  });

  it('returns false when URL is missing', () => {
    expect(validateCurlCommand('curl -X POST')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateCurlCommand('')).toBe(false);
  });

  it('returns false for non-string input', () => {
    expect(validateCurlCommand(null as unknown as string)).toBe(false);
  });
});

describe('validateParsedCurl()', () => {
  const valid: ParsedCurl = {
    method: 'POST',
    url: 'https://api.example.com/notify',
    headers: { 'Content-Type': 'application/json' },
    body: { eventCode: 'PUSH_001' },
    eventCode: 'PUSH_001',
    userId: 'user42',
  };

  it('returns valid for a well-formed ParsedCurl', () => {
    const result = validateParsedCurl(valid);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error when URL is empty', () => {
    const result = validateParsedCurl({ ...valid, url: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/URL/i);
  });

  it('returns error when URL is not valid', () => {
    const result = validateParsedCurl({ ...valid, url: 'not-a-url' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Invalid URL/i);
  });

  it('returns error when HTTP method is invalid', () => {
    const result = validateParsedCurl({ ...valid, method: 'INVALID' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/method/i);
  });

  it('returns error when body present with non-JSON Content-Type', () => {
    const result = validateParsedCurl({
      ...valid,
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/content-type/i);
  });

  it('passes when no body is present even with non-JSON Content-Type', () => {
    const result = validateParsedCurl({
      ...valid,
      body: null,
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(result.valid).toBe(true);
  });
});
