export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  eventCode: string | null;
  userId: string | null;
}

/**
 * Parses cURL command strings into structured request objects.
 */
export class CurlParser {
  /**
   * Parses a raw cURL command string into a ParsedCurl object.
   * @param curlCommand - The raw cURL command string
   */
  parse(curlCommand: string): ParsedCurl {
    const normalized = curlCommand.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();

    return {
      method: this.extractMethod(normalized),
      url: this.extractUrl(normalized),
      headers: this.extractHeaders(normalized),
      body: this.extractBody(normalized),
      eventCode: this.extractEventCode(normalized),
      userId: this.extractUserId(normalized),
    };
  }

  /** Extracts the HTTP method from the cURL command. Defaults to GET. */
  private extractMethod(curl: string): string {
    const xMatch = curl.match(/-X\s+([A-Z]+)/);
    if (xMatch) return xMatch[1].toUpperCase();

    const requestMatch = curl.match(/--request\s+([A-Z]+)/);
    if (requestMatch) return requestMatch[1].toUpperCase();

    if (curl.includes('--data') || curl.includes('-d ')) return 'POST';

    return 'GET';
  }

  /** Extracts the URL from the cURL command. */
  private extractUrl(curl: string): string {
    // Try quoted URL patterns first
    const patterns = [
      /curl\s+(?:[^\s]+\s+)*['"]?(https?:\/\/[^\s'"]+)['"]?/,
      /--url\s+['"]?(https?:\/\/[^\s'"]+)['"]?/,
    ];

    for (const pattern of patterns) {
      const match = curl.match(pattern);
      if (match) return match[1];
    }

    // Fall back to any https?:// URL
    const urlMatch = curl.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
    return urlMatch ? urlMatch[1] : '';
  }

  /** Extracts all headers from -H / --header flags. */
  private extractHeaders(curl: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const pattern = /(?:-H|--header)\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(curl)) !== null) {
      const colonIdx = match[1].indexOf(':');
      if (colonIdx !== -1) {
        const key = match[1].substring(0, colonIdx).trim();
        const value = match[1].substring(colonIdx + 1).trim();
        headers[key] = value;
      }
    }

    return headers;
  }

  /** Extracts and parses the request body from --data / -d flags. */
  private extractBody(curl: string): Record<string, unknown> | null {
    const patterns = [
      /(?:--data-raw|--data|--data-binary|-d)\s+'([^']+)'/,
      /(?:--data-raw|--data|--data-binary|-d)\s+"([^"]+)"/,
    ];

    for (const pattern of patterns) {
      const match = curl.match(pattern);
      if (match) {
        try {
          return JSON.parse(match[1]) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  /** Extracts the eventCode field from the request body. */
  private extractEventCode(curl: string): string | null {
    const body = this.extractBody(curl);
    if (!body) return null;

    const value = body['eventCode'] ?? body['event_code'] ?? body['event'];
    return typeof value === 'string' ? value : null;
  }

  /** Extracts the userId field from the request body. */
  private extractUserId(curl: string): string | null {
    const body = this.extractBody(curl);
    if (!body) return null;

    const value = body['userId'] ?? body['user_id'] ?? body['uid'];
    return typeof value === 'string' ? value : null;
  }
}
