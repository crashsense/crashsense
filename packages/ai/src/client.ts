import type { AIConfig, AIResponse, CrashEvent } from '@crashsense/types';
import { buildAIPayload } from './payload-builder';
import { buildMessages } from './prompt';
import { parseAIResponse } from './response-parser';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createAIClient(config: AIConfig) {
  const timeout = config.timeout ?? 30000;
  const maxRetries = config.retries ?? 2;

  async function sendRequest(event: CrashEvent): Promise<string | null> {
    const payload = buildAIPayload(event);
    const messages = buildMessages(payload);

    const body: Record<string, unknown> = {
      messages,
      temperature: config.temperature ?? 0.1,
      max_tokens: config.maxTokens ?? 2000,
    };

    if (config.model) {
      body.model = config.model;
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (attempt < maxRetries) {
            await sleep(1000 * (attempt + 1));
            continue;
          }
          return null;
        }

        const data = await response.json() as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        return data.choices?.[0]?.message?.content ?? null;
      } catch {
        clearTimeout(timeoutId);
        if (attempt < maxRetries) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        return null;
      }
    }

    return null;
  }

  return {
    async analyze(event: CrashEvent): Promise<AIResponse | null> {
      const rawResponse = await sendRequest(event);
      if (!rawResponse) return null;
      return parseAIResponse(rawResponse);
    },
  };
}
