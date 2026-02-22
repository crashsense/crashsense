import type { StackFrame } from '@crashsense/types';

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export function generateFingerprint(
  errorType: string,
  errorMessage: string,
  stackFrames: StackFrame[],
): string {
  const topFrames = stackFrames.slice(0, 3);
  const frameStr = topFrames
    .map((f) => `${f.filename}:${f.function}`)
    .join('|');
  const input = `${errorType}:${errorMessage}:${frameStr}`;
  const hash = djb2Hash(input);
  return hash.toString(16).padStart(8, '0');
}
