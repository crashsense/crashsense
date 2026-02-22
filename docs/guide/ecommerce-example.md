# Full E-Commerce Example

A complete walkthrough of integrating CrashSense in a React e-commerce checkout flow with AI-powered crash analysis.

## Setup

```bash
npm install @crashsense/core @crashsense/react @crashsense/ai
```

## Complete Implementation

```tsx
import React, { useState, useEffect } from 'react';
import { CrashSenseProvider, useCrashSense, useRenderTracker } from '@crashsense/react';
import { createAIClient } from '@crashsense/ai';

// Initialize AI client for crash analysis
const aiClient = createAIClient({
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: process.env.REACT_APP_OPENAI_KEY!,
  model: 'gpt-4',
});

export function App() {
  return (
    <CrashSenseProvider
      config={{
        appId: 'ecommerce-app',
        environment: process.env.NODE_ENV,
        release: '2.3.1',
        enableIframeTracking: true,
        enablePreCrashWarning: true,
        onCrash: async (report) => {
          // Send every crash to your backend
          await fetch('/api/crashes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report),
          });

          // For critical crashes, get AI analysis
          if (report.event.severity === 'critical') {
            const analysis = await aiClient.analyze(report.event);
            console.log('AI fix:', analysis?.fix?.code);
          }
        },
      }}
    >
      <Checkout />
    </CrashSenseProvider>
  );
}

function Checkout() {
  const { captureException, addBreadcrumb, core } = useCrashSense();
  useRenderTracker('Checkout'); // flags if this component re-renders excessively
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Set user context for crash reports
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) core?.setUser({ id: user.id, plan: user.plan });
  }, [core]);

  async function handleCheckout() {
    // Track user actions as breadcrumbs
    addBreadcrumb({ type: 'click', message: 'User clicked checkout' });

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });
      if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
    } catch (error) {
      // Manually capture with context
      captureException(error, { action: 'checkout', cartSize: String(cart.length) });
    }
  }

  return <button onClick={handleCheckout}>Complete Purchase</button>;
}
```

## What's Happening

### CrashSenseProvider

The provider wraps the entire application (or a subtree). It:

- Initializes the CrashSense core with your configuration
- Acts as a React Error Boundary — catches rendering errors automatically
- Provides context to child components via `useCrashSense`
- Enables iframe tracking and pre-crash warnings for this e-commerce checkout

### useCrashSense Hook

Components use this hook to access:

- `captureException(error, context?)` — manually capture errors with optional metadata
- `addBreadcrumb(breadcrumb)` — track user actions that lead up to a crash
- `core` — direct access to the CrashSense instance for advanced operations like `setUser`

### useRenderTracker

Monitors how many times the Checkout component renders per second. If it exceeds 50 renders/second, CrashSense flags it as a potential infinite re-render loop — a common React bug in checkout flows where state updates trigger cascading re-renders.

### AI Analysis on Critical Crashes

When a critical crash occurs (e.g., the checkout flow crashes due to a memory leak while processing payment), the AI client:

1. Receives the full crash event with system state, breadcrumbs, and classification
2. Sends a token-optimized payload to your configured LLM endpoint
3. Returns a structured analysis with root cause, explanation, fix code, and prevention advice

## Example Crash Report

When the checkout button triggers a crash, CrashSense produces a report like:

```js
{
  category: "network_induced",
  subcategory: "api_failure",
  confidence: 0.91,
  severity: "error",

  contributingFactors: [
    { factor: "failed_request", weight: 0.95, evidence: "POST /api/checkout → 500 (timeout)" },
    { factor: "network_degradation", weight: 0.4, evidence: "3 failed requests in last 60s" },
  ],

  breadcrumbs: [
    { type: "navigation", message: "User navigated to /checkout" },
    { type: "click", message: "User clicked checkout" },
    { type: "network", message: "POST /api/checkout → 500 (12043ms)" },
  ],

  meta: {
    appId: "ecommerce-app",
    environment: "production",
    release: "2.3.1",
  }
}
```

## Source Code

See the full source: [`examples/react-ecommerce/`](https://github.com/crashsense/crashsense/tree/main/examples/react-ecommerce)
