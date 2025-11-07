import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  AcademicCapIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

interface CurriculumTopic {
  id: string;
  course: string;
  phase: string;
  title: string;
  status: "not_started" | "in_progress" | "completed";
  teacherNote?: string;
  updatedBy: string;
  updatedAt: any;
  difficulty?: string;
  masteryLevel?: string;
}

interface Student {
  id: string;
  displayName: string;
  grade?: string;
}

export default function Progress() {
  const { childId } = useParams<{ childId: string }>();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPhase, setFilterPhase] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      if (!childId) return;
      
      setLoading(true);
      try {
        // Fetch student info
        const studentDoc = await getDoc(doc(db, "students", childId));
        if (studentDoc.exists()) {
          setStudent({
            id: studentDoc.id,
            displayName: studentDoc.data().displayName || "Student",
            grade: studentDoc.data().grade
          });
        }

        // Fetch curriculum topics
        const curriculumRef = collection(db, `students/${childId}/curriculum`);
        const curriculumSnap = await getDocs(curriculumRef);
        
        const topicsData: CurriculumTopic[] = [];
        curriculumSnap.forEach((doc) => {
          topicsData.push({
            id: doc.id,
            ...doc.data()
          } as CurriculumTopic);
        });

        // Sort by phase and title
        topicsData.sort((a, b) => {
          if (a.phase !== b.phase) {
            return a.phase.localeCompare(b.phase);
          }
          return a.title.localeCompare(b.title);
        });

        setTopics(topicsData);
      } catch (error) {
        console.error("Error fetching curriculum:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [childId]);

  const filteredTopics = topics.filter(topic => {
    if (filterStatus !== "all" && topic.status !== filterStatus) return false;
    if (filterPhase !== "all" && topic.phase !== filterPhase) return false;
    if (filterCourse !== "all" && topic.course !== filterCourse) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "not_started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case "not_started":
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleDownloadPDF = () => {
    // Simple implementation - in production, use jsPDF or similar
    const content = filteredTopics.map(topic => 
      `${topic.course} - ${topic.phase} - ${topic.title}: ${topic.status}`
    ).join('\n');
    
    const blob = new Blob([`CURRICULUM PROGRESS REPORT\n\nStudent: ${student?.displayName}\n\n${content}`], 
      { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student?.displayName || 'student'}-progress-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get unique values for filters
  const uniquePhases = Array.from(new Set(topics.map(t => t.phase))).sort();
  const uniqueCourses = Array.from(new Set(topics.map(t => t.course))).sort();

  // Calculate stats
  const stats = {
    total: topics.length,
    completed: topics.filter(t => t.status === "completed").length,
    inProgress: topics.filter(t => t.status === "in_progress").length,
    notStarted: topics.filter(t => t.status === "not_started").length
  };

  const completionPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Curriculum Progress</h1>
          <p className="text-gray-600 mt-1">
            {student?.displayName}'s learning journey across all subjects
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Download Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-3">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Topics</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-3">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 rounded-full p-3">
              <XCircleIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Not Started</p>
              <p className="text-2xl font-bold text-gray-600">{stats.notStarted}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow p-6 text-white">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8" />
            <div>
              <p className="text-sm opacity-90">Completion</p>
              <p className="text-3xl font-bold">{completionPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phase/Level
            </label>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Phases</option>
              {uniquePhases.map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Topics ({filteredTopics.length})
          </h2>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="p-12 text-center">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No topics found matching your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTopics.map((topic) => (
              <div key={topic.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(topic.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {topic.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                        {topic.course}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {topic.phase}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(topic.status)}`}>
                        {topic.status.replace('_', ' ')}
                      </span>
                      {topic.masteryLevel && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          {topic.masteryLevel}
                        </span>
                      )}
                    </div>

                    {topic.teacherNote && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Teacher Note:</strong> {topic.teacherNote}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {topic.updatedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
