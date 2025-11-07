import { Link } from "react-router-dom";
import { 
  AcademicCapIcon, 
  CalendarIcon,
  ChartBarIcon,
  ClockIcon 
} from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";
import type { Student, Session } from "../../types/student";

interface StudentSummaryCardProps {
  student: Student;
  nextSession?: Session | null;
  attendancePercentage?: number;
}

export default function StudentSummaryCard({ 
  student, 
  nextSession,
  attendancePercentage = 0 
}: StudentSummaryCardProps) {
  const summary = student.summary;
  
  // Calculate overall progress (average of all masteries)
  const overallProgress = summary 
    ? Math.round((summary.phonicsMastery + summary.grammarMastery + summary.speakingMastery) / 3)
    : 0;

  // Format next session date/time
  const formatSessionTime = (session: Session | null) => {
    if (!session || !session.scheduledAt) return "No upcoming class";
    
    const date = session.scheduledAt.toDate();
    const isToday = new Date().toDateString() === date.toDateString();
    const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString();
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {student.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{student.displayName}</h3>
              {student.grade && (
                <p className="text-indigo-100 text-sm">Grade {student.grade}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-white">
              <FireIcon className="w-5 h-5 mr-1 text-orange-300" />
              <span className="text-lg font-bold">{summary?.streakDays || 0}</span>
            </div>
            <p className="text-xs text-indigo-100">day streak</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-indigo-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Mastery Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary?.phonicsMastery || 0}%
            </div>
            <div className="text-xs text-gray-600">Phonics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {summary?.grammarMastery || 0}%
            </div>
            <div className="text-xs text-gray-600">Grammar</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {summary?.speakingMastery || 0}%
            </div>
            <div className="text-xs text-gray-600">Speaking</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {attendancePercentage}%
              </div>
              <div className="text-xs text-gray-500">Attendance</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {summary?.weeklyMinutes || 0} min
              </div>
              <div className="text-xs text-gray-500">This Week</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {summary?.totalSessionsCompleted || 0}
              </div>
              <div className="text-xs text-gray-500">Classes Done</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {summary?.worksheetsCompleted || 0}
              </div>
              <div className="text-xs text-gray-500">Worksheets</div>
            </div>
          </div>
        </div>

        {/* Next Class */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Next Class</div>
              <div className="text-sm font-medium text-gray-900">
                {formatSessionTime(nextSession || null)}
              </div>
              {nextSession && student.assignedTeacherName && (
                <div className="text-xs text-gray-500 mt-1">
                  with {student.assignedTeacherName}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link
              to={`/parent/child/${student.id}/progress`}
              className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors text-center"
            >
              Curriculum
            </Link>
            <Link
              to={`/parent/child/${student.id}/attendance`}
              className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors text-center"
            >
              Attendance
            </Link>
            <Link
              to={`/parent/child/${student.id}/worksheets`}
              className="px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors text-center"
            >
              Activities
            </Link>
            <Link
              to="/parent/schedule"
              className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Schedule
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
