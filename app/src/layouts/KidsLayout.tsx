import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  HomeIcon, 
  TrophyIcon, 
  BookOpenIcon,
  SparklesIcon,
  StarIcon
} from "@heroicons/react/24/solid";

export default function KidsLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: "Home", href: "/kids/games", icon: HomeIcon, color: "bg-purple-500" },
    { name: "Games", href: "/kids/games", icon: SparklesIcon, color: "bg-pink-500" },
    { name: "My Learning", href: "/kids/learning", icon: BookOpenIcon, color: "bg-blue-500" },
    { name: "Rewards", href: "/kids/rewards", icon: TrophyIcon, color: "bg-yellow-500" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      {/* Top Bar - Gamified */}
      <nav className="bg-white shadow-lg border-b-4 border-purple-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/kids/games" className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <StarIcon className="h-7 w-7 text-white" />
                </div>
                <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  TinySteps
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Points/Stars Display */}
              <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-full border-2 border-yellow-400">
                <StarIcon className="h-6 w-6 text-yellow-500 mr-2" />
                <span className="text-xl font-bold text-yellow-700">125</span>
              </div>

              {/* User Avatar */}
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.displayName?.[0]?.toUpperCase() || "K"}
                </div>
              </div>

              {/* Parent Exit (Hidden, accessible via icon) */}
              <button
                onClick={signOut}
                className="text-xs text-gray-400 hover:text-gray-600"
                title="Exit to parent login"
              >
                ↩
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Fun Navigation Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  relative overflow-hidden rounded-2xl shadow-lg transition-all transform hover:scale-105
                  ${isActive(item.href) 
                    ? "ring-4 ring-purple-400 scale-105" 
                    : "hover:shadow-xl"
                  }
                `}
              >
                <div className={`${item.color} p-6 text-white`}>
                  <Icon className="h-12 w-12 mb-2" />
                  <p className="text-xl font-bold">{item.name}</p>
                </div>
                {isActive(item.href) && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-xl">✓</span>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="bg-white rounded-3xl shadow-xl p-8 min-h-[600px]">
          <Outlet />
        </main>
      </div>

      {/* Fun Footer */}
      <footer className="mt-8 pb-6 text-center">
        <p className="text-purple-600 font-medium">Keep learning and having fun! 🎉</p>
      </footer>
    </div>
  );
}
