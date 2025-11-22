import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
export function initSentry() {
    var _a, _b, _c;
    // Only initialize if DSN is provided
    const dsn = (_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.VITE_SENTRY_DSN;
    if (!dsn)
        return;
    Sentry.init({
        dsn,
        // BrowserTracing's types can conflict; cast to any to avoid type issues
        integrations: [new BrowserTracing()],
        tracesSampleRate: ((_b = import.meta.env) === null || _b === void 0 ? void 0 : _b.PROD) ? 0.1 : 1.0,
        environment: (_c = import.meta.env) === null || _c === void 0 ? void 0 : _c.MODE,
    });
}
