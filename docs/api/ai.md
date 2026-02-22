# AI API

The `@crashsense/ai` package provides AI-powered crash analysis. Bring your own LLM — CrashSense formats crash data into structured prompts and parses AI responses.

## createAIClient

Factory function that creates an AI client configured to communicate with your LLM endpoint.

```ts
import { createAIClient } from '@crashsense/ai';

const ai = createAIClient({
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
});
```

### Configuration

| Option | Type | Required | Description |
|---|---|---|---|
| `endpoint` | `string` | Yes | The API endpoint URL for your LLM provider |
| `apiKey` | `string` | Yes | API key for authentication |
| `model` | `string` | Yes | Model identifier (e.g., `'gpt-4'`, `'claude-3-sonnet'`, `'gemini-pro'`) |

## analyze

Analyzes a crash event and returns a structured diagnosis.

```ts
const analysis = await ai.analyze(report.event);

if (analysis) {
  console.log('Root cause:', analysis.rootCause);
  console.log('Explanation:', analysis.explanation);
  console.log('Fix:', analysis.fix?.code);
  console.log('Prevention:', analysis.prevention);
}
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `crashEvent` | `CrashEvent` | The crash event object from a CrashSense report |

### Return Value

Returns `Promise<AIAnalysis | null>`. Returns `null` if the AI request fails or the response cannot be parsed.

```ts
interface AIAnalysis {
  rootCause: string;        // What caused the crash
  explanation: string;      // Detailed explanation of the root cause
  fix: {
    code: string;           // Suggested fix code
  };
  prevention: string;       // How to prevent this class of crash
}
```

## Supported Providers

CrashSense works with any LLM endpoint that accepts OpenAI-compatible chat completion requests:

| Provider | Endpoint |
|---|---|
| OpenAI | `https://api.openai.com/v1/chat/completions` |
| Anthropic (via proxy) | Any OpenAI-compatible proxy |
| Google (via proxy) | Any OpenAI-compatible proxy |
| Azure OpenAI | `https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions` |
| Local LLMs | `http://localhost:11434/v1/chat/completions` (Ollama) |
| Any OpenAI-compatible | Any endpoint that accepts the chat completions format |

## How It Works

1. **Payload building** — CrashSense extracts the relevant fields from the crash event (category, error, system state, breadcrumbs, contributing factors) and builds a token-optimized JSON payload. PII is scrubbed before sending.

2. **Request** — The payload is sent to your configured endpoint with the appropriate headers and model specification.

3. **Response parsing** — The AI response is parsed and validated against the expected schema. If the response does not match the expected format, `null` is returned.

## Example: Full Integration

```ts
import { createCrashSense } from '@crashsense/core';
import { createAIClient } from '@crashsense/ai';

const ai = createAIClient({
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
});

const cs = createCrashSense({
  appId: 'my-app',
  onCrash: async (report) => {
    // Only analyze critical crashes to save API costs
    if (report.event.severity === 'critical') {
      const analysis = await ai.analyze(report.event);
      if (analysis) {
        console.log('Root cause:', analysis.rootCause);
        console.log('Fix:', analysis.fix?.code);

        // Send both crash report and AI analysis to your backend
        await fetch('/api/crashes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report, analysis }),
        });
      }
    }
  },
});
```

::: tip
AI analysis adds latency (typically 2–10 seconds depending on your LLM provider). Consider running it asynchronously and only for high-severity crashes to minimize impact on user experience.
:::
