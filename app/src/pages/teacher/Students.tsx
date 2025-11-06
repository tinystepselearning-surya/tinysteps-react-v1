import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTeacherStudents } from "../../hooks/useTeacherStudents";
import { getTeacher } from "../../services/teacherService";
import { 
  MagnifyingGlassIcon, 
  AcademicCapIcon,
  ChartBarIcon 
} from "@heroicons/react/24/outline";
import { useEffect } from "react";
import type { Teacher } from "../../types/teacher";

export default function TeacherStudents() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { students, loading } = useTeacherStudents(teacher?.id || null);

  useEffect(() => {
    async function fetchTeacher() {
      if (!user?.uid) return;
      try {
        const data = await getTeacher(user.uid);
        setTeacher(data);
      } catch (error) {
        console.error("Error fetching teacher:", error);
      }
    }
    fetchTeacher();
  }, [user?.uid]);

  const filteredStudents = students.filter(student =>
    student.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <div className="text-sm text-gray-600">
          {students.length} {students.length === 1 ? "student" : "students"}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search students by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery ? "No students found matching your search" : "No students assigned yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600">
                      {student.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.displayName}</h3>
                    {student.grade && (
                      <p className="text-sm text-gray-600">Grade {student.grade}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.status === 'active' ? 'bg-green-100 text-green-800' :
                  student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {student.status}
                </span>
              </div>

              {student.summary && (
                <div className="space-y-3">
                  {/* Progress Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Phonics</span>
                        <span>{student.summary.phonicsMastery}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{ width: `${student.summary.phonicsMastery}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Grammar</span>
                        <span>{student.summary.grammarMastery}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                          style={{ width: `${student.summary.grammarMastery}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Speaking</span>
                        <span>{student.summary.speakingMastery}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                          style={{ width: `${student.summary.speakingMastery}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Sessions</p>
                      <p className="text-lg font-bold text-gray-900">
                        {student.summary.totalSessionsCompleted}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Streak</p>
                      <p className="text-lg font-bold text-gray-900">
                        {student.summary.streakDays} days
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button className="mt-4 w-full bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                <ChartBarIcon className="h-4 w-4" />
                View Progress
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
