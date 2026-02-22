const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IPV4_PATTERN = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+\/]+/g;
const CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

export function scrubPII(text: string): string {
  return text
    .replace(EMAIL_PATTERN, '[EMAIL]')
    .replace(BEARER_PATTERN, 'Bearer [TOKEN]')
    .replace(CARD_PATTERN, '[CARD]')
    .replace(IPV4_PATTERN, '[IP]');
}

export function scrubObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = scrubPII(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = scrubObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? scrubPII(item)
          : item !== null && typeof item === 'object'
            ? scrubObject(item as Record<string, unknown>)
            : item,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}
