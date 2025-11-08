import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // No specific roles required - any authenticated user can access
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has one of the allowed roles
  if (role && allowedRoles.includes(role)) {
    console.log(`[ProtectedRoute] Access granted for role "${role}" to ${allowedRoles.join(', ')} routes`);
    return <>{children}</>;
  }

  // User doesn't have permission - redirect based on their role
  console.log(`[ProtectedRoute] Access denied for role "${role}" to ${allowedRoles.join(', ')} routes`);
  const roleRedirects: Record<UserRole, string> = {
    admin: "/surya/dashboard",
    "learning-partner": "/rm/dashboard",
    teacher: "/teacher/dashboard",
    parent: "/parent/dashboard",
    student: "/kids/games",
  };

  const userRedirect = role ? roleRedirects[role] : "/";
  console.log(`[ProtectedRoute] Redirecting to ${userRedirect}`);
  return <Navigate to={userRedirect} replace />;
}
