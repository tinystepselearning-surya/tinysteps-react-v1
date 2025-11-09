import React from 'react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-6">This page doesn't exist.</p>
        <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-blue-600 text-white rounded">Go Home</button>
      </div>
    </div>
  );
}