import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useChildren } from "../../hooks/useChildren";
import { useStudent } from "../../hooks/useStudent";
import StudentSummaryCard from "../../components/parent/StudentSummaryCard";
import { UserGroupIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function ParentDashboard() {
  const { user } = useAuth();
  const { children, loading: childrenLoading, error: childrenError } = useChildren(user?.uid || null);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const selectedChild = children[selectedChildIndex];
  const { 
    nextSession, 
    attendancePercentage,
    loading: studentLoading 
  } = useStudent(selectedChild?.id || null);

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading your children...</p>
        </div>
      </div>
    );
  }

  if (childrenError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
        <p className="text-red-600">{childrenError.message}</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <UserGroupIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-xl font-semibold text-gray-900">No Children Enrolled</h3>
        <p className="mt-2 text-gray-600">
          Contact your learning partner to enroll your child in the program.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your {children.length > 1 ? "children" : "child"}'s learning journey.
        </p>
      </div>

      {/* Multi-Child Switcher (if more than 1 child) */}
      {children.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Viewing progress for:
          </label>
          <div className="flex flex-wrap gap-2">
            {children.map((child, index) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildIndex(index)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all
                  ${selectedChildIndex === index
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {child.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Student Summary Card */}
      {selectedChild && (
        <div>
          {studentLoading ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading progress...</p>
            </div>
          ) : (
            <StudentSummaryCard 
              student={selectedChild}
              nextSession={nextSession}
              attendancePercentage={attendancePercentage}
            />
          )}
        </div>
      )}

      {/* Quick Tips Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-indigo-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What to practice this week
            </h3>
            {selectedChild?.summary && (
              <div className="space-y-2 text-sm text-gray-700">
                {selectedChild.summary.phonicsMastery < 70 && (
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <span>Focus on phonics - try the sound blending games!</span>
                  </div>
                )}
                {selectedChild.summary.grammarMastery < 70 && (
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span>Practice grammar - complete sentence building activities</span>
                  </div>
                )}
                {selectedChild.summary.speakingMastery < 70 && (
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    <span>Work on speaking - record story narrations</span>
                  </div>
                )}
                {selectedChild.summary.phonicsMastery >= 70 && 
                 selectedChild.summary.grammarMastery >= 70 && 
                 selectedChild.summary.speakingMastery >= 70 && (
                  <div className="flex items-center text-green-700 font-medium">
                    <span className="mr-2">🎉</span>
                    <span>Excellent progress! Keep up the great work!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {selectedChild?.summary?.totalSessionsCompleted || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Learning Streak</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {selectedChild?.summary?.streakDays || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {selectedChild?.summary?.weeklyMinutes || 0}
                <span className="text-lg text-gray-500 ml-1">min</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
