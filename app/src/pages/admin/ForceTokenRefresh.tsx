import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function ForceTokenRefresh() {
  const { user, role } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (!user) {
      alert("You must be logged in first!");
      return;
    }

    setRefreshing(true);
    setResult(null);

    try {
      // Force token refresh
      await user.getIdToken(true);
      
      // Get new token result
      const tokenResult = await user.getIdTokenResult();
      
      setResult(JSON.stringify(tokenResult.claims, null, 2));
      
      alert("✅ Token refreshed! Please reload the page.");
      
      // Reload page to update auth context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error("Error refreshing token:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Force Token Refresh</h1>
          <p className="mt-2 text-gray-600">
            Refresh your authentication token to get updated permissions
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Current Status</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Current Role:</strong> {role || "(none)"}</p>
                  <p className="mt-2">
                    If your role was just updated and you're getting permission errors,
                    use this tool to force refresh your authentication token.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing || !user}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {refreshing ? "Refreshing Token..." : "Refresh Authentication Token"}
          </button>

          {result && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">New Token Claims</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs">
                {result}
              </pre>
              <p className="mt-3 text-sm text-green-600 font-semibold">
                ✅ Page will reload in a moment to apply new permissions...
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p className="mb-2"><strong>When to use this:</strong></p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Getting "You do not have permission" errors</li>
            <li>Role was just updated in Firestore</li>
            <li>Custom claims were just set via Cloud Function</li>
            <li>Alternative to logging out and back in</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
