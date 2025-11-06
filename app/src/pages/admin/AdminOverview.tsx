import { useSystemStats } from "../../hooks/useSystemStats";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { 
  UserGroupIcon,
  AcademicCapIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

export default function AdminOverview() {
  const { stats, activity, loading } = useSystemStats();
  const { logs } = useAuditLogs(10);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">Failed to load system statistics</p>
        </div>
      </div>
    );
  }

  // Calculate growth indicators
  const userGrowthRate = stats.newUsersThisMonth > 0 
    ? ((stats.newUsersThisMonth / Math.max(stats.totalUsers - stats.newUsersThisMonth, 1)) * 100).toFixed(1)
    : "0.0";
  
  const activeRate = stats.totalUsers > 0 
    ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
        <p className="text-gray-400">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm text-green-400 flex items-center gap-1">
              <ArrowTrendingUpIcon className="h-4 w-4" />
              {userGrowthRate}%
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</div>
          <div className="text-sm text-gray-400">Total Users</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.newUsersThisMonth} new this month
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm text-green-400">{activeRate}%</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.activeUsers}</div>
          <div className="text-sm text-gray-400">Active Users</div>
          <div className="text-xs text-gray-500 mt-2">
            {activity.activeToday} active today
          </div>
        </div>

        {/* Students */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.totalStudents}</div>
          <div className="text-sm text-gray-400">Total Students</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.totalParents} parents
          </div>
        </div>

        {/* Teachers */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.totalTeachers}</div>
          <div className="text-sm text-gray-400">Total Teachers</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.totalLearningPartners} RMs
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-white">User Growth</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Today</span>
              <span className="text-sm font-medium text-white">{stats.newUsersToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">This Week</span>
              <span className="text-sm font-medium text-white">{stats.newUsersThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">This Month</span>
              <span className="text-sm font-medium text-white">{stats.newUsersThisMonth}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-white">Sessions</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Total</span>
              <span className="text-sm font-medium text-white">{stats.totalSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Active</span>
              <span className="text-sm font-medium text-white">{stats.activeSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Completed</span>
              <span className="text-sm font-medium text-white">{stats.completedSessions}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-white">Revenue</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Total</span>
              <span className="text-sm font-medium text-white">
                ₹{stats.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">This Month</span>
              <span className="text-sm font-medium text-white">
                ₹{stats.monthlyRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ClockIcon className="h-6 w-6" />
          Recent Activity
        </h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{log.userName}</span>
                    <span className="text-xs text-gray-400">({log.userRole})</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{log.details}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  log.action.includes('created') ? 'bg-green-500/20 text-green-400' :
                  log.action.includes('deleted') ? 'bg-red-500/20 text-red-400' :
                  log.action.includes('updated') ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {log.action.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
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
