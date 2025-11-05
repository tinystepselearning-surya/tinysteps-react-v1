import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db, ensureAdminReady } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      const adminAuth = localStorage.getItem("adminAuth");
      
      if (!user || !adminAuth) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Force-refresh admin claims first
        await ensureAdminReady();
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const hasAdminRole = userDoc.exists() && userDoc.data()?.role === "admin";
        setIsAdmin(hasAdminRole);
      } catch (error) {
        console.error("Admin check failed:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Verifying access...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/surya" replace />;
  }

  return <>{children}</>;
}
