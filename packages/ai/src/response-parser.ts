import type { AIResponse } from '@crashsense/types';

function extractJsonFromMarkdown(raw: string): string {
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  return raw.trim();
}

function isValidAIResponse(obj: unknown): obj is AIResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;

  if (typeof o.rootCause !== 'string') return false;
  if (typeof o.explanation !== 'string') return false;
  if (typeof o.confidence !== 'number' || o.confidence < 0 || o.confidence > 1) return false;
  if (!Array.isArray(o.prevention)) return false;

  if (o.fix !== null && o.fix !== undefined) {
    const fix = o.fix as Record<string, unknown>;
    if (typeof fix.description !== 'string') return false;
    if (typeof fix.code !== 'string') return false;
    if (typeof fix.filename !== 'string') return false;
  }

  if (!Array.isArray(o.alternativeCauses)) return false;

  return true;
}

export function parseAIResponse(raw: string): AIResponse | null {
  try {
    const jsonStr = extractJsonFromMarkdown(raw);
    const parsed = JSON.parse(jsonStr);

    if (!isValidAIResponse(parsed)) return null;

    return {
      rootCause: parsed.rootCause,
      explanation: parsed.explanation,
      fix: parsed.fix ?? { description: '', code: '', filename: '' },
      prevention: parsed.prevention,
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
      alternativeCauses: parsed.alternativeCauses ?? [],
    };
  } catch {
    return null;
  }
}
