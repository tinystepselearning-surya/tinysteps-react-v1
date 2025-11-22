// React import removed (unused; using new JSX transform)

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">403 - Unauthorized</h1>
        <p className="text-gray-600 mb-6">You don't have access to this page.</p>
        <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-blue-600 text-white rounded">Go Home</button>
      </div>
    </div>
  );
}