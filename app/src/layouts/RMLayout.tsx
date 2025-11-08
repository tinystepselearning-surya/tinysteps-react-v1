import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  HomeIcon, 
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

export default function RMLayout() {
  const { user, role, signOut, loading } = useAuth();
  const location = useLocation();

  console.log('[RMLayout] User:', user?.email, 'Role:', role, 'Loading:', loading, 'Path:', location.pathname);

  // Show loading while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not a learning-partner, show access denied
  if (role !== "learning-partner") {
    console.log('[RMLayout] Access denied for role:', role);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <UserCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the Learning Partner portal. 
            Your current role is: <span className="font-semibold text-red-600">{role || 'unknown'}</span>
          </p>
          <div className="space-y-3">
            {role === "admin" && (
              <Link
                to="/surya/learning-partners"
                className="block w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Go to Admin Learning Partners Page
              </Link>
            )}
            <button
              onClick={signOut}
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('[RMLayout] Access granted for learning-partner role');

  const navigation = [
    { name: "Dashboard", href: "/rm/dashboard", icon: HomeIcon },
    { name: "Students", href: "/rm/students", icon: UserGroupIcon },
    { name: "Teachers", href: "/rm/teachers", icon: AcademicCapIcon },
    { name: "Fees & Payments", href: "/rm/fees", icon: CurrencyDollarIcon },
    { name: "Analytics", href: "/rm/analytics", icon: ChartBarIcon },
    { name: "Reports", href: "/rm/reports", icon: DocumentTextIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/rm/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-orange-600">TinySteps</span>
                <span className="ml-2 text-sm text-gray-500">Learning Partner Portal</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Key Metrics */}
              <div className="hidden lg:flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Active Students</p>
                  <p className="font-bold text-orange-600">45</p>
                </div>
                <div className="text-center border-l pl-4">
                  <p className="text-gray-500">Teachers</p>
                  <p className="font-bold text-orange-600">8</p>
                </div>
                <div className="text-center border-l pl-4">
                  <p className="text-gray-500">Collection %</p>
                  <p className="font-bold text-orange-600">92%</p>
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {/* Profile */}
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium text-gray-700">{user?.displayName || user?.email}</p>
                  <p className="text-gray-500">Learning Partner</p>
                </div>
              </div>

              {/* Sign Out */}
              <button
                onClick={signOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.href)
                        ? "bg-orange-50 text-orange-700 border-l-4 border-orange-700"
                        : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Alerts Panel */}
            <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="text-sm font-semibold text-red-900 mb-3">Alerts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-red-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  3 pending payments
                </div>
                <div className="flex items-center text-red-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  2 low attendance
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="text-sm font-semibold text-orange-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-orange-700 hover:text-orange-900">
                  + Enroll Student
                </button>
                <button className="w-full text-left text-sm text-orange-700 hover:text-orange-900">
                  + Verify Payment
                </button>
                <button className="w-full text-left text-sm text-orange-700 hover:text-orange-900">
                  + Export Report
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
