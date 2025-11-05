import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

interface Stats {
  totalUsers: number;
  parents: number;
  students: number;
  teachers: number;
  activeSubscriptions: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    parents: 0,
    students: 0,
    teachers: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get all users
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get all students
      const studentsSnap = await getDocs(collection(db, "students"));

      // Calculate stats
      const parentCount = users.filter((u: any) => u.role === "parent").length;
      const teacherCount = users.filter((u: any) => u.role === "teacher").length;
      const activeSubCount = users.filter((u: any) => 
        u.role === "parent" && u.subscription?.status === "active"
      ).length;

      setStats({
        totalUsers: users.length,
        parents: parentCount,
        students: studentsSnap.size,
        teachers: teacherCount,
        activeSubscriptions: activeSubCount,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "from-blue-500 to-cyan-500" },
    { label: "Parents", value: stats.parents, icon: "👨‍👩‍👧‍👦", color: "from-green-500 to-emerald-500" },
    { label: "Students", value: stats.students, icon: "🎓", color: "from-orange-500 to-amber-500" },
    { label: "Teachers", value: stats.teachers, icon: "👨‍🏫", color: "from-purple-500 to-pink-500" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: "💳", color: "from-sky-500 to-indigo-500" },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-gray-400">Welcome to the Tinysteps Admin Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
          >
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${stat.color} mb-4`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-white font-semibold hover:shadow-lg transition-all">
            + Create User
          </button>
          <button className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white font-semibold hover:shadow-lg transition-all">
            + Add Parent
          </button>
          <button className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-semibold hover:shadow-lg transition-all">
            + Add Student
          </button>
          <button className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:shadow-lg transition-all">
            + Add Teacher
          </button>
        </div>
      </div>
    </div>
  );
}
