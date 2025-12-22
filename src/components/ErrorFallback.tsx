import React, { useEffect } from 'react';
import { Button } from '@components/ui/button';

export function ErrorFallback({ error, componentStack }: { error?: Error; componentStack?: string }) {
  useEffect(() => {
    // TEMP DEBUG: Log evidence for #426 diagnosis
    console.error('[TS_DEBUG] ErrorFallback triggered');
    console.error('[TS_DEBUG] Error:', error);
    console.error('[TS_DEBUG] Error message:', error?.message);
    console.error('[TS_DEBUG] Component stack:', componentStack);
    console.error('[TS_DEBUG] Last JS URL:', (window as any).__ts_last_js_url);
    console.error('[TS_DEBUG] Location:', window.location.href);
  }, [error, componentStack]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">We've been notified and will fix it soon.</p>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
      </div>
    </div>
  );
}
