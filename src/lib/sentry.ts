export async function initSentry() {
  // Only initialize if DSN is provided
  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  try {
    // Dynamically import Sentry only when needed to avoid bundling it into
    // the public landing/main bundle when no DSN is configured.
    const Sentry = await import('@sentry/react');
    const { BrowserTracing } = await import('@sentry/tracing');

    Sentry.init({
      dsn,
      integrations: [new BrowserTracing() as any] as any,
      tracesSampleRate: (import.meta as any).env?.PROD ? 0.1 : 1.0,
      environment: (import.meta as any).env?.MODE,
    });
  } catch (err) {
    // If Sentry package is missing or fails to load, fail silently.
    // This prevents the monitoring lib from blocking runtime.
    console.warn('Sentry init failed', err);
  }
}
