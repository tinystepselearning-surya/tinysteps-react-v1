import React from 'react';
import { Button } from '@components/ui/button';

export function ErrorFallback() {
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
