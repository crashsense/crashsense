import { describe, it, expect } from 'vitest';
import { parseStackTrace } from '../stack-parser';

describe('parseStackTrace', () => {
  it('parses Chrome/V8 stack format', () => {
    const raw = `Error: something broke
    at handleClick (http://localhost:3000/src/App.tsx:15:10)
    at HTMLButtonElement.dispatch (http://localhost:3000/node_modules/react-dom/cjs/react-dom.development.js:3942:16)`;

    const frames = parseStackTrace(raw);
    expect(frames).toHaveLength(2);
    expect(frames[0].function).toBe('handleClick');
    expect(frames[0].filename).toBe('http://localhost:3000/src/App.tsx');
    expect(frames[0].lineno).toBe(15);
    expect(frames[0].colno).toBe(10);
    expect(frames[0].inApp).toBe(true);
    expect(frames[1].inApp).toBe(false); // node_modules
  });

  it('parses Chrome format without function name', () => {
    const raw = `Error: x
    at http://localhost:3000/src/index.ts:5:3`;

    const frames = parseStackTrace(raw);
    expect(frames).toHaveLength(1);
    expect(frames[0].function).toBe('<anonymous>');
    expect(frames[0].lineno).toBe(5);
  });

  it('parses Firefox stack format', () => {
    const raw = `handleClick@http://localhost:3000/src/App.tsx:15:10
dispatch@http://localhost:3000/node_modules/react-dom/cjs/react-dom.development.js:3942:16`;

    const frames = parseStackTrace(raw);
    expect(frames).toHaveLength(2);
    expect(frames[0].function).toBe('handleClick');
    expect(frames[0].filename).toBe('http://localhost:3000/src/App.tsx');
    expect(frames[0].lineno).toBe(15);
    expect(frames[1].inApp).toBe(false);
  });

  it('marks CDN resources as not in-app', () => {
    const raw = `    at loadScript (https://cdn.example.com/lib.js:1:1)`;
    const frames = parseStackTrace(raw);
    expect(frames[0].inApp).toBe(false);
  });

  it('returns empty array for empty stack', () => {
    expect(parseStackTrace('')).toEqual([]);
  });

  it('skips non-matching lines', () => {
    const raw = `Error: oops
This is not a stack frame
    at realFrame (app.js:1:1)`;
    const frames = parseStackTrace(raw);
    expect(frames).toHaveLength(1);
    expect(frames[0].function).toBe('realFrame');
  });
});
