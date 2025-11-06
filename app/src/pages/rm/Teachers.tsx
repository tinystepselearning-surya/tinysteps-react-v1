import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRM } from "../../hooks/useRM";
import { useRMTeachers } from "../../hooks/useRMTeachers";
import { 
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";

export default function RMTeachers() {
  const { user } = useAuth();
  const { rm } = useRM(user?.uid || null);
  const { teachers, workloads, loading } = useRMTeachers(rm?.id || null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeachers = teachers.filter(teacher =>
    teacher.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            {teachers.length} total teachers
          </p>
        </div>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
          <UserPlusIcon className="h-5 w-5" />
          Add Teacher
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search teachers by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Teachers Grid */}
      {filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery ? "No teachers found matching your search" : "No teachers assigned yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => {
            const workload = workloads.find(w => w.teacherId === teacher.id);
            const capacityPercentage = workload 
              ? Math.round((workload.activeStudents / workload.maxStudents) * 100)
              : 0;

            return (
              <div key={teacher.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">
                        {teacher.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{teacher.displayName}</h3>
                      <p className="text-sm text-gray-600">{teacher.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                    teacher.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {teacher.status}
                  </span>
                </div>

                {/* Specializations */}
                {teacher.specialization && teacher.specialization.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Specializations</p>
                    <div className="flex flex-wrap gap-1">
                      {teacher.specialization.map((spec, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                {workload && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Students</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {workload.activeStudents} / {workload.maxStudents}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Capacity</span>
                        <span className="text-sm font-semibold text-gray-900">{capacityPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-full rounded-full ${
                            capacityPercentage >= 90 ? 'bg-red-500' :
                            capacityPercentage >= 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${capacityPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className={`text-sm font-semibold ${
                        workload.completionRate >= 80 ? 'text-green-600' :
                        workload.completionRate >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {workload.completionRate}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sessions</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {workload.completedSessions} / {workload.scheduledSessions + workload.completedSessions}
                      </span>
                    </div>
                  </div>
                )}

                {/* Hourly Rate */}
                {teacher.hourlyRate && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hourly Rate</span>
                      <span className="text-sm font-bold text-gray-900">₹{teacher.hourlyRate}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <ChartBarIcon className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
