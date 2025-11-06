import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("adminAuth");
      localStorage.removeItem("adminUid");
      navigate("/surya");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigation = [
    { name: "Overview", href: "/surya/dashboard", icon: "📊" },
    { name: "User Management", href: "/surya/users", icon: "👥" },
    { name: "Courses", href: "/surya/courses", icon: "📚" },
    { name: "Parents", href: "/surya/parents", icon: "👨‍👩‍👧‍👦" },
    { name: "Students", href: "/surya/students", icon: "🎓" },
    { name: "Teachers", href: "/surya/teachers", icon: "👨‍🏫" },
    { name: "Learning Partners", href: "/surya/learning-partners", icon: "🤝" },
    { name: "Memberships", href: "/surya/memberships", icon: "💳" },
    { name: "Roles & Permissions", href: "/surya/roles", icon: "🔐" },
    { name: "Audit Logs", href: "/surya/audit-logs", icon: "📋" },
    { name: "System Settings", href: "/surya/settings", icon: "⚙️" },
  ];

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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${isActive
                    ? "bg-gradient-to-r from-orange-500 to-sky-500 text-white shadow-lg"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
