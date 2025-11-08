import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  HomeIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  DocumentTextIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

export default function ParentLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/parent/dashboard", icon: HomeIcon },
    { name: "My Children", href: "/parent/children", icon: UserGroupIcon },
    { name: "Schedule", href: "/parent/schedule", icon: CalendarIcon },
    { name: "Progress Reports", href: "/parent/reports", icon: DocumentTextIcon },
    { name: "Fees & Payments", href: "/parent/fees", icon: CreditCardIcon },
    { name: "Messages", href: "/parent/messages", icon: ChatBubbleLeftRightIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  console.log("[ParentLayout] Rendering for user:", user?.email);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/parent/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-indigo-600">TinySteps</span>
                <span className="ml-2 text-sm text-gray-500">Parent Portal</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {/* Profile Dropdown */}
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium text-gray-700">{user?.displayName || user?.email}</p>
                  <p className="text-gray-500">Parent</p>
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
                        ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700"
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
