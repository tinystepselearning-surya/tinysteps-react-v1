import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  HomeIcon, 
  UserGroupIcon,
  AcademicCapIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: "Overview", href: "/surya/dashboard", icon: HomeIcon },
    { name: "User Management", href: "/surya/users", icon: UserGroupIcon },
    { name: "Parents", href: "/surya/parents", icon: UserGroupIcon },
    { name: "Students", href: "/surya/students", icon: AcademicCapIcon },
    { name: "Teachers", href: "/surya/teachers", icon: AcademicCapIcon },
    { name: "Learning Partners", href: "/surya/learning-partners", icon: UserGroupIcon },
    { name: "Memberships", href: "/surya/memberships", icon: CreditCardIcon },
    { name: "Analytics", href: "/surya/analytics", icon: ChartBarIcon },
    { name: "Roles & Permissions", href: "/surya/roles", icon: ShieldCheckIcon },
    { name: "Settings", href: "/surya/settings", icon: Cog6ToothIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`
          bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300
          ${sidebarOpen ? "w-64" : "w-20"}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-sky-400 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${active
                    ? "bg-gradient-to-r from-orange-500 to-sky-500 text-white shadow-lg"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-700 p-4">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center"}`}>
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            className={`
              mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 
              rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 
              transition-colors
              ${!sidebarOpen && "px-2"}
            `}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
