import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../firebase";

export default function TestAuth() {
  const { user, role, loading } = useAuth();

  const handleRefreshToken = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.getIdToken(true);
        const tokenResult = await auth.currentUser.getIdTokenResult();
        alert(`Token refreshed! Role: ${tokenResult.claims.role}`);
        window.location.reload();
      } catch (error: any) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Logged In:</span>
                <span className={user ? "text-green-600" : "text-red-600"}>
                  {user ? "✅ Yes" : "❌ No"}
                </span>
              </div>

              {user && (
                <>
                  <div>
                    <span className="font-medium">Email:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-medium">UID:</span> 
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm">
                      {user.uid}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Display Name:</span> {user.displayName || "Not set"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Role (Custom Claim):</span>
                    <span className={role ? "text-green-600 font-semibold" : "text-red-600"}>
                      {role || "❌ NOT SET"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {user && !role && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Missing Role Claim</h3>
              <p className="text-yellow-700 text-sm mb-3">
                Your account doesn't have a role custom claim set. This will prevent access to role-specific pages.
              </p>
              <button
                onClick={handleRefreshToken}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Refresh Token
              </button>
            </div>
          )}

          {user && role && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Authentication Working</h3>
              <p className="text-green-700 text-sm">
                You are logged in as <strong>{role}</strong>. You should be able to access role-specific pages.
              </p>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Quick links:</p>
                <div className="space-y-1">
                  {role === "parent" && (
                    <a href="/parent/dashboard" className="block text-blue-600 hover:underline">
                      → Go to Parent Dashboard
                    </a>
                  )}
                  {role === "teacher" && (
                    <a href="/teacher/dashboard" className="block text-blue-600 hover:underline">
                      → Go to Teacher Dashboard
                    </a>
                  )}
                  {role === "learning-partner" && (
                    <a href="/rm/dashboard" className="block text-blue-600 hover:underline">
                      → Go to Learning Partner Dashboard
                    </a>
                  )}
                  {role === "student" && (
                    <a href="/kids/home" className="block text-blue-600 hover:underline">
                      → Go to Kids Portal
                    </a>
                  )}
                  {role === "admin" && (
                    <a href="/surya/dashboard" className="block text-blue-600 hover:underline">
                      → Go to Admin Dashboard
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
