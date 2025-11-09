import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  // Only initialize if DSN is provided
  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    // BrowserTracing's types can conflict; cast to any to avoid type issues
    integrations: [new BrowserTracing() as any] as any,
    tracesSampleRate: (import.meta as any).env?.PROD ? 0.1 : 1.0,
    environment: (import.meta as any).env?.MODE,
  });
}
