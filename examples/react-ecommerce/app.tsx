import React from 'react';
import { CrashSenseProvider } from '@crashsense/react';
import { createAIClient } from '@crashsense/ai';
import { Checkout } from './checkout';

// Initialize AI client (optional -- for root cause analysis)
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

        // Enable advanced monitoring
        enableIframeTracking: true,
        enablePreCrashWarning: true,

        // Debug mode in development
        debug: process.env.NODE_ENV !== 'production',

        // Handle crash reports
        onCrash: async (report) => {
          // 1. Send to your backend immediately
          await fetch('/api/crashes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report),
          });

          // 2. Get AI analysis for critical crashes
          if (report.event.severity === 'critical') {
            const analysis = await aiClient.analyze(report.event);
            if (analysis) {
              console.log('AI Root Cause:', analysis.rootCause);
              console.log('Explanation:', analysis.explanation);
              console.log('Suggested Fix:', analysis.fix?.code);
              console.log('Prevention:', analysis.prevention);

              // Send enriched report with AI analysis
              await fetch('/api/crashes/analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  crashId: report.event.id,
                  analysis,
                }),
              });
            }
          }
        },
      }}
      onCrash={(report) => {
        // This fires on React-caught errors (ErrorBoundary)
        console.error(
          '[CrashSense]',
          report.event.category,
          '/',
          report.event.subcategory,
          '--',
          report.event.error.message,
        );
      }}
    >
      <Checkout />
    </CrashSenseProvider>
  );
}
