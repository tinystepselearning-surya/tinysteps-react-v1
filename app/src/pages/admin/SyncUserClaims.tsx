import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";

export default function SyncUserClaims() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSync = async () => {
    if (!confirm("This will sync custom claims for ALL users from their Firestore roles. Continue?")) {
      return;
    }

    setSyncing(true);
    setResult(null);

    try {
      const syncFn = httpsCallable(functions, "syncAllUserClaims");
      const response = await syncFn({});
      setResult(response.data);
      alert("✅ User claims synced successfully!");
    } catch (error: any) {
      console.error("Error syncing claims:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sync User Claims</h1>
          <p className="mt-2 text-gray-600">
            Sync Firebase Auth custom claims from Firestore user roles
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This operation will read all users from Firestore and update their
                    Firebase Auth custom claims to match their role field.
                  </p>
                  <p className="mt-2">
                    <strong>Use this when:</strong>
                  </p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Users can't login to their role-specific dashboards</li>
                    <li>Custom claims are missing or out of sync</li>
                    <li>After manually updating user roles in Firestore</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {syncing ? "Syncing..." : "Sync All User Claims"}
          </button>

          {result && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Results</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Users:</span>
                  <span className="font-semibold">{result.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Successfully Synced:</span>
                  <span className="font-semibold text-green-600">{result.synced}</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-600">Failed:</span>
                    <span className="font-semibold text-red-600">{result.failed}</span>
                  </div>
                )}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-red-600 mb-2">Errors:</h4>
                  <div className="max-h-60 overflow-y-auto rounded bg-red-50 p-3">
                    {result.errors.map((err: any, idx: number) => (
                      <div key={idx} className="text-xs text-red-700 mb-2">
                        <strong>{err.email}</strong>: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p className="mb-2"><strong>Technical Details:</strong></p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Reads from <code className="bg-gray-100 px-1 rounded">/users</code> collection</li>
            <li>Updates custom claims in Firebase Auth</li>
            <li>Users may need to logout/login to see updated permissions</li>
            <li>Safe to run multiple times</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
