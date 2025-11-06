import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTeacherStudents } from "../../hooks/useTeacherStudents";
import { useTeacherSessions } from "../../hooks/useTeacherSessions";
import { getTeacher, getTeacherStudentCount } from "../../services/teacherService";
import { getSessionStats } from "../../services/sessionService";
import type { Teacher } from "../../types/teacher";
import { 
  AcademicCapIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  ClockIcon,
  VideoCameraIcon 
} from "@heroicons/react/24/outline";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({ total: 0, scheduled: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const { students } = useTeacherStudents(teacher?.id || null);
  const { todaySessions, upcomingSessions } = useTeacherSessions(teacher?.id || null);

  useEffect(() => {
    async function fetchTeacherData() {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const teacherData = await getTeacher(user.uid);
        setTeacher(teacherData);

        if (teacherData?.id) {
          const [count, stats] = await Promise.all([
            getTeacherStudentCount(teacherData.id),
            getSessionStats(teacherData.id),
          ]);
          setStudentCount(count);
          setSessionStats(stats);
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeacherData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Teacher profile not found.</p>
        </div>
      </div>
    );
  }

  const completionRate = sessionStats.total > 0 
    ? Math.round((sessionStats.completed / sessionStats.total) * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold">Welcome back, {teacher.displayName}!</h1>
        <p className="mt-2 text-green-50">
          You have {todaySessions.length} {todaySessions.length === 1 ? "class" : "classes"} scheduled today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{studentCount}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessionStats.scheduled}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessionStats.completed}</p>
            </div>
            <div className="bg-emerald-100 rounded-full p-3">
              <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <CheckCircleIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ClockIcon className="h-6 w-6 mr-2 text-green-600" />
            Today's Classes
          </h2>
        </div>
        <div className="p-6">
          {todaySessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No classes scheduled for today</p>
          ) : (
            <div className="space-y-4">
              {todaySessions.map((session) => {
                const student = students.find(s => s.id === session.studentId);
                const sessionTime = session.scheduledAt.toDate();
                const now = new Date();
                const isUpcoming = sessionTime > now;
                const isPast = sessionTime < now;
                
                return (
                  <div 
                    key={session.id} 
                    className={`border rounded-lg p-4 ${
                      isUpcoming ? 'border-green-200 bg-green-50' : 
                      isPast ? 'border-gray-200 bg-gray-50' : 
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {student?.displayName || "Student"}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {sessionTime.toLocaleTimeString("en-US", { 
                            hour: "numeric", 
                            minute: "2-digit" 
                          })} • {session.duration} minutes
                        </p>
                        {session.notes && (
                          <p className="text-sm text-gray-500 mt-1">{session.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </span>
                        {session.zoomLink && isUpcoming && (
                          <a
                            href={session.zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                          >
                            <VideoCameraIcon className="h-4 w-4" />
                            Join Class
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2 text-green-600" />
            Upcoming Sessions
          </h2>
        </div>
        <div className="p-6">
          {upcomingSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming sessions</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const student = students.find(s => s.id === session.studentId);
                const sessionTime = session.scheduledAt.toDate();
                
                return (
                  <div key={session.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {student?.displayName || "Student"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {sessionTime.toLocaleDateString("en-US", { 
                          weekday: "short",
                          month: "short", 
                          day: "numeric" 
                        })} at {sessionTime.toLocaleTimeString("en-US", { 
                          hour: "numeric", 
                          minute: "2-digit" 
                        })}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {session.duration} min
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
