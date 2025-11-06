import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  HomeIcon, 
  CalendarDaysIcon,
  UserGroupIcon, 
  DocumentTextIcon,
  BookmarkIcon,
  ChartBarIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

export default function TeacherLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/teacher/dashboard", icon: HomeIcon },
    { name: "My Calendar", href: "/teacher/calendar", icon: CalendarDaysIcon },
    { name: "My Students", href: "/teacher/students", icon: UserGroupIcon },
    { name: "Sessions", href: "/teacher/sessions", icon: DocumentTextIcon },
    { name: "Resources", href: "/teacher/resources", icon: BookmarkIcon },
    { name: "Performance", href: "/teacher/performance", icon: ChartBarIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/teacher/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-green-600">TinySteps</span>
                <span className="ml-2 text-sm text-gray-500">Teacher Portal</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Today's Classes</p>
                  <p className="font-bold text-green-600">4</p>
                </div>
                <div className="text-center border-l pl-4">
                  <p className="text-gray-500">Students</p>
                  <p className="font-bold text-green-600">12</p>
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
                  <p className="text-gray-500">Teacher</p>
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
                        ? "bg-green-50 text-green-700 border-l-4 border-green-700"
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

            {/* Quick Actions */}
            <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-green-700 hover:text-green-900">
                  + Create Session Note
                </button>
                <button className="w-full text-left text-sm text-green-700 hover:text-green-900">
                  + Assign Worksheet
                </button>
                <button className="w-full text-left text-sm text-green-700 hover:text-green-900">
                  + Update Progress
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
