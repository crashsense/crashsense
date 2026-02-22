import { describe, it, expect } from 'vitest';
import { generateId } from '../uuid';

describe('generateId', () => {
  it('returns a string in UUID v4 format', () => {
    const id = generateId();
    // UUID v4: 8-4-4-4-12 hex chars, version digit = 4, variant = 8/9/a/b
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('has correct length', () => {
    const id = generateId();
    expect(id.length).toBe(36); // 32 hex + 4 dashes
  });
});
