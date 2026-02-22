import { describe, it, expect } from 'vitest';
import { generateFingerprint } from '../fingerprint';
import type { StackFrame } from '@crashsense/types';

function makeFrame(fn: string, file: string): StackFrame {
  return { function: fn, filename: file, lineno: 1, colno: 1, inApp: true };
}

describe('generateFingerprint', () => {
  it('returns an 8-character hex string', () => {
    const fp = generateFingerprint('TypeError', 'x is not a function', []);
    expect(fp).toMatch(/^[0-9a-f]{8}$/);
  });

  it('produces same fingerprint for identical input', () => {
    const frames = [makeFrame('foo', 'app.js')];
    const fp1 = generateFingerprint('TypeError', 'msg', frames);
    const fp2 = generateFingerprint('TypeError', 'msg', frames);
    expect(fp1).toBe(fp2);
  });

  it('produces different fingerprint for different error types', () => {
    const frames = [makeFrame('foo', 'app.js')];
    const fp1 = generateFingerprint('TypeError', 'msg', frames);
    const fp2 = generateFingerprint('ReferenceError', 'msg', frames);
    expect(fp1).not.toBe(fp2);
  });

  it('produces different fingerprint for different messages', () => {
    const fp1 = generateFingerprint('Error', 'message A', []);
    const fp2 = generateFingerprint('Error', 'message B', []);
    expect(fp1).not.toBe(fp2);
  });

  it('produces different fingerprint for different stack frames', () => {
    const fp1 = generateFingerprint('Error', 'msg', [makeFrame('foo', 'a.js')]);
    const fp2 = generateFingerprint('Error', 'msg', [makeFrame('bar', 'b.js')]);
    expect(fp1).not.toBe(fp2);
  });

  it('handles empty stack frames', () => {
    const fp = generateFingerprint('Error', 'msg', []);
    expect(fp).toMatch(/^[0-9a-f]{8}$/);
  });

  it('only uses first 3 stack frames', () => {
    const frames = [
      makeFrame('f1', 'a.js'),
      makeFrame('f2', 'b.js'),
      makeFrame('f3', 'c.js'),
      makeFrame('f4', 'd.js'),
    ];
    const fpWith4 = generateFingerprint('Error', 'msg', frames);
    const fpWith3 = generateFingerprint('Error', 'msg', frames.slice(0, 3));
    expect(fpWith4).toBe(fpWith3);
  });
});
