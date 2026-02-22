import type { StackFrame } from '@crashsense/types';

// Chrome/V8: "    at functionName (filename:line:col)" or "    at filename:line:col"
const CHROME_PATTERN = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/;

// Firefox: "functionName@filename:line:col"
const FIREFOX_PATTERN = /^(.+?)@(.+?):(\d+):(\d+)$/;

const NON_APP_PATTERNS = [
  /node_modules/,
  /^https?:\/\/cdn\./,
  /^https?:\/\/unpkg\.com/,
  /^https?:\/\/cdnjs\./,
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,
  /^webpack\/runtime/,
  /^\[native code\]/,
];

function isInApp(filename: string): boolean {
  return !NON_APP_PATTERNS.some((p) => p.test(filename));
}

export function parseStackTrace(rawStack: string): StackFrame[] {
  const lines = rawStack.split('\n');
  const frames: StackFrame[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match = CHROME_PATTERN.exec(trimmed);
    if (match) {
      frames.push({
        function: match[1] || '<anonymous>',
        filename: match[2],
        lineno: parseInt(match[3], 10),
        colno: parseInt(match[4], 10),
        inApp: isInApp(match[2]),
      });
      continue;
    }

    match = FIREFOX_PATTERN.exec(trimmed);
    if (match) {
      frames.push({
        function: match[1] || '<anonymous>',
        filename: match[2],
        lineno: parseInt(match[3], 10),
        colno: parseInt(match[4], 10),
        inApp: isInApp(match[2]),
      });
    }
  }

  return frames;
}
