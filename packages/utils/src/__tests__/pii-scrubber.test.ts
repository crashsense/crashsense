import { describe, it, expect } from 'vitest';
import { scrubPII, scrubObject } from '../pii-scrubber';

describe('scrubPII', () => {
  it('scrubs email addresses', () => {
    expect(scrubPII('Contact user@example.com for help')).toBe(
      'Contact [EMAIL] for help',
    );
  });

  it('scrubs multiple emails', () => {
    expect(scrubPII('a@b.com and c@d.org')).toBe('[EMAIL] and [EMAIL]');
  });

  it('scrubs IPv4 addresses', () => {
    expect(scrubPII('Server 192.168.1.1 is down')).toBe(
      'Server [IP] is down',
    );
  });

  it('scrubs Bearer tokens', () => {
    expect(scrubPII('Bearer eyJhbGciOiJIUzI1NiJ9.abc')).toBe(
      'Bearer [TOKEN]',
    );
  });

  it('scrubs credit card numbers', () => {
    expect(scrubPII('Card: 4111 1111 1111 1111')).toBe('Card: [CARD]');
    expect(scrubPII('Card: 4111-1111-1111-1111')).toBe('Card: [CARD]');
  });

  it('leaves normal text unchanged', () => {
    const text = 'No PII in this message about error handling';
    expect(scrubPII(text)).toBe(text);
  });

  it('handles empty string', () => {
    expect(scrubPII('')).toBe('');
  });
});

describe('scrubObject', () => {
  it('scrubs string values', () => {
    const result = scrubObject({ email: 'user@test.com' });
    expect(result.email).toBe('[EMAIL]');
  });

  it('recurses into nested objects', () => {
    const result = scrubObject({
      user: { email: 'a@b.com', name: 'John' },
    });
    expect((result.user as Record<string, unknown>).email).toBe('[EMAIL]');
    expect((result.user as Record<string, unknown>).name).toBe('John');
  });

  it('handles arrays of strings', () => {
    const result = scrubObject({ items: ['user@a.com', 'normal text'] });
    expect(result.items).toEqual(['[EMAIL]', 'normal text']);
  });

  it('preserves non-string, non-object values', () => {
    const result = scrubObject({ count: 42, active: true, data: null });
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.data).toBeNull();
  });
});
