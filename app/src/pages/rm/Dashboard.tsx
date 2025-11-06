import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRM } from "../../hooks/useRM";
import { useRMStudents } from "../../hooks/useRMStudents";
import { useRMTeachers } from "../../hooks/useRMTeachers";
import { getRMAlerts } from "../../services/rmService";
import type { Alert } from "../../types/rm";
import { 
  AcademicCapIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

export default function RMDashboard() {
  const { user } = useAuth();
  const { rm, stats, loading: rmLoading } = useRM(user?.uid || null);
  const { students, unassignedStudents } = useRMStudents(rm?.id || null);
  const { workloads } = useRMTeachers(rm?.id || null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      if (!rm?.id) return;
      
      try {
        setAlertsLoading(true);
        const data = await getRMAlerts(rm.id, 5);
        setAlerts(data);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setAlertsLoading(false);
      }
    }

    fetchAlerts();
  }, [rm?.id]);

  if (rmLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!rm) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Learning Partner profile not found.</p>
        </div>
      </div>
    );
  }

  const activeTeachers = workloads.filter(w => w.activeStudents > 0).length;
  const avgCompletionRate = workloads.length > 0
    ? Math.round(workloads.reduce((sum, w) => sum + w.completionRate, 0) / workloads.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold">Welcome back, {rm.displayName}!</h1>
        <p className="mt-2 text-orange-50">
          Managing {stats?.totalStudents || students.length} students and {stats?.totalTeachers || workloads.length} teachers
        </p>
        {rm.region && (
          <p className="mt-1 text-sm text-orange-100">Region: {rm.region}</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.activeStudents || students.length}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{activeTeachers}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {unassignedStudents.length}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{avgCompletionRate}%</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Panel */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-orange-600" />
              Recent Alerts
            </h2>
          </div>
          <div className="p-6">
            {alertsLoading ? (
              <p className="text-gray-500 text-center py-4">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">No pending alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border-l-4 p-4 rounded-r-lg ${
                      alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                      alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                      alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {alert.createdAt.toDate().toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Unassigned Students */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2 text-orange-600" />
              Pending Assignments
            </h2>
          </div>
          <div className="p-6">
            {unassignedStudents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">All students assigned to teachers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unassignedStudents.slice(0, 5).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 rounded-full h-10 w-10 flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">
                          {student.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{student.displayName}</h3>
                        {student.grade && (
                          <p className="text-xs text-gray-600">Grade {student.grade}</p>
                        )}
                      </div>
                    </div>
                    <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                      Assign
                    </button>
                  </div>
                ))}
                {unassignedStudents.length > 5 && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    +{unassignedStudents.length - 5} more
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Performance Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-orange-600" />
            Teacher Performance
          </h2>
        </div>
        <div className="p-6">
          {workloads.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No teacher data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workloads.slice(0, 5).map((workload) => {
                    const capacityPercentage = Math.round((workload.activeStudents / workload.maxStudents) * 100);
                    
                    return (
                      <tr key={workload.teacherId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-green-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-green-600">
                                {workload.teacherName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {workload.teacherName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {workload.activeStudents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {workload.completedSessions} / {workload.scheduledSessions + workload.completedSessions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                              <div
                                className={`h-full rounded-full ${
                                  workload.completionRate >= 80 ? 'bg-green-500' :
                                  workload.completionRate >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${workload.completionRate}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{workload.completionRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            capacityPercentage >= 90 ? 'bg-red-100 text-red-800' :
                            capacityPercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {capacityPercentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <BanknotesIcon className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{stats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Overdue Payments</p>
                <p className="text-xl font-bold text-gray-900">{stats.overduePayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
