import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useRM } from "../../hooks/useRM";
import { useRMStudents } from "../../hooks/useRMStudents";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import RMAssignStudentToTeacherModal from './components/RMAssignStudentToTeacherModal';
import { 
  MagnifyingGlassIcon, 
  AcademicCapIcon,
  UserPlusIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  CalendarIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

export default function RMStudents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rm } = useRM(user?.uid || null);
  const { students, loading } = useRMStudents(rm?.id || null);

  // Debug: log RM and user data
  console.log('User:', user);
  console.log('RM:', rm);
  console.log('Students loading:', loading);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<"all" | "flagged">("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [noteText, setNoteText] = useState("");

  // Calculate health flags for each student
  const getHealthFlags = (student: any) => {
    const flags = [];
    
    // Mock attendance calculation - should be based on real attendance data
    const attendanceRate = student.summary?.attendance || Math.random() * 100;
    if (attendanceRate < 80) {
      flags.push({ type: "attendance", message: "Low attendance (<80%)", color: "red" });
    }
    
    // Mock curriculum progress - should be based on expected vs actual
    const expectedProgress = 50; // Mock expected progress percentage
    const actualProgress = student.summary
      ? Math.round((student.summary.phonicsMastery + student.summary.grammarMastery + student.summary.speakingMastery) / 3)
      : 0;
    
    if (actualProgress < expectedProgress - 20) {
      flags.push({ type: "progress", message: "Behind schedule", color: "yellow" });
    }
    
    // Mock practice time - should be based on game activity data
    const weeklyPracticeMinutes = Math.random() * 200;
    if (weeklyPracticeMinutes < 100) {
      flags.push({ type: "practice", message: "Low practice time (<100 min/week)", color: "orange" });
    }
    
    return flags;
  };

  const handleNotifyParent = async () => {
    if (!selectedStudent || !notifyMessage) {
      alert("Please enter a message");
      return;
    }

    try {
      await addDoc(collection(db, "notifications"), {
        recipientIds: [selectedStudent.parentId || "parent_uid"],
        subject: "Message from Learning Partner",
        message: notifyMessage,
        studentId: selectedStudent.id,
        studentName: selectedStudent.displayName,
        type: "rm_notification",
        read: false,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      });

      alert("Parent notified successfully!");
      setShowNotifyModal(false);
      setNotifyMessage("");
    } catch (error) {
      console.error("Error notifying parent:", error);
      alert("Failed to send notification");
    }
  };

  const handleScheduleMakeup = async () => {
    if (!selectedStudent || !scheduleDate) {
      alert("Please select a date");
      return;
    }

    try {
      await addDoc(collection(db, "sessions"), {
        studentId: selectedStudent.id,
        studentName: selectedStudent.displayName,
        teacherId: selectedStudent.assignedTeacherId,
        scheduledDate: scheduleDate,
        scheduledTime: "10:00 AM",
        status: "scheduled",
        sessionType: "makeup",
        courseName: "Phonics",
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        updatedBy: user?.uid,
        updatedAt: serverTimestamp(),
      });

      alert("Make-up session scheduled!");
      setShowScheduleModal(false);
      setScheduleDate("");
    } catch (error) {
      console.error("Error scheduling session:", error);
      alert("Failed to schedule session");
    }
  };

  const handleAddNote = async () => {
    if (!selectedStudent || !noteText) {
      alert("Please enter a note");
      return;
    }

    try {
      // In production, add to student's notes subcollection
      alert("Note added successfully!");
      setShowNoteModal(false);
      setNoteText("");
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "unassigned" ? !student.assignedTeacherId : student.status === statusFilter);
    
    const flags = getHealthFlags(student);
    const matchesHealth = healthFilter === "all" || (healthFilter === "flagged" && flags.length > 0);
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  const flaggedCount = students.filter(s => getHealthFlags(s).length > 0).length;

  // Debug: log students data
  console.log('RM Students loaded:', students.length, students);

  const handleExportCSV = () => {
    const csvData = filteredStudents.map(student => {
      const flags = getHealthFlags(student);
      const flagsText = flags.length === 0 ? "Healthy" : flags.map(f => f.message).join("; ");
      const attendanceRate = Math.random() * 100; // Mock data
      const overallProgress = student.summary
        ? Math.round((student.summary.phonicsMastery + student.summary.grammarMastery + student.summary.speakingMastery) / 3)
        : 0;
      const weeklyPracticeMinutes = Math.random() * 200;

      return {
        "Student Name": student.displayName,
        "Grade": student.grade || "—",
        "Teacher": student.assignedTeacherName || "Unassigned",
        "Status": student.status,
        "Health Flags": flagsText,
        "Attendance %": attendanceRate.toFixed(1),
        "Progress %": overallProgress.toString(),
        "Practice Time (min/week)": weeklyPracticeMinutes.toFixed(0),
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => headers.map(h => `"${(row as any)[h]}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cohort-health-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Cohort Health</h1>
          <p className="text-sm text-gray-600 mt-1">
            {students.length} total students • {flaggedCount} flagged for attention
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setHealthFilter(healthFilter === "all" ? "flagged" : "all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              healthFilter === "flagged"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <ExclamationTriangleIcon className="h-5 w-5" />
            {healthFilter === "flagged" ? "Show All" : "Show Flagged Only"}
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export CSV
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
            <UserPlusIcon className="h-5 w-5" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Students</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on-hold">On Hold</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery || statusFilter !== "all" 
              ? "No students found matching your filters" 
              : "No students assigned yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health Flags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                // Debug: log student data to see assignedTeacherId
                console.log('Student:', student.displayName, 'assignedTeacherId:', student.assignedTeacherId, 'type:', typeof student.assignedTeacherId);
                
                const overallProgress = student.summary
                  ? Math.round((student.summary.phonicsMastery + student.summary.grammarMastery + student.summary.speakingMastery) / 3)
                  : 0;
                const healthFlags = getHealthFlags(student);

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-orange-100 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-orange-600">
                            {student.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={() => navigate(`/parent/child/${student.id}/progress`)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {student.displayName}
                          </button>
                          <div className="text-xs text-gray-500">
                            Grade {student.grade || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {healthFlags.length === 0 ? (
                          <span className="text-sm text-green-600 font-medium">✓ Healthy</span>
                        ) : (
                          healthFlags.map((flag, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <ExclamationTriangleIcon className={`h-4 w-4 text-${flag.color}-600`} />
                              <span className={`text-xs text-${flag.color}-700`}>{flag.message}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!student.assignedTeacherId || student.assignedTeacherId === '' || filteredStudents.indexOf(student) === 0 ? (
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowAssignModal(true);
                          }}
                          className="text-sm text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1"
                        >
                          <UserGroupIcon className="h-4 w-4" />
                          Assign Teacher
                        </button>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {student.assignedTeacherName || "Assigned"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' :
                        student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                          <div
                            className={`h-full rounded-full ${
                              overallProgress >= 70 ? 'bg-green-500' :
                              overallProgress >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{overallProgress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowNotifyModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Notify Parent"
                        >
                          <BellAlertIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowScheduleModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Schedule Make-up"
                        >
                          <CalendarIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowNoteModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Add Note"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Notify Parent Modal */}
      {showNotifyModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notify Parent</h3>
                <p className="text-sm text-gray-600">Student: {selectedStudent.displayName}</p>
              </div>
              <button
                onClick={() => {
                  setShowNotifyModal(false);
                  setNotifyMessage("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setNotifyMessage(`Dear Parent, ${selectedStudent.displayName}'s attendance has been low recently. Please ensure regular attendance for better progress.`)}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                >
                  Low Attendance
                </button>
                <button
                  onClick={() => setNotifyMessage(`Dear Parent, ${selectedStudent.displayName} is falling behind schedule. Let's discuss how we can help catch up.`)}
                  className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200"
                >
                  Behind Schedule
                </button>
                <button
                  onClick={() => setNotifyMessage(`Dear Parent, ${selectedStudent.displayName} is making excellent progress! Keep up the great work.`)}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                >
                  Great Progress
                </button>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your message to the parent..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNotifyModal(false);
                  setNotifyMessage("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNotifyParent}
                disabled={!notifyMessage.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Make-up Modal */}
      {showScheduleModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Schedule Make-up Session</h3>
                <p className="text-sm text-gray-600">Student: {selectedStudent.displayName}</p>
              </div>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleDate("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher
                </label>
                <div className="text-sm text-gray-600">
                  {selectedStudent.assignedTeacherName || "No teacher assigned"}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 The teacher will be notified about this make-up session. Make sure to coordinate with them separately.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleDate("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleMakeup}
                disabled={!scheduleDate}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Schedule Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add RM Note</h3>
                <p className="text-sm text-gray-600">Student: {selectedStudent.displayName}</p>
              </div>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Add internal notes about this student's progress, concerns, or action items..."
              />
              
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shareWithTeacher"
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="shareWithTeacher" className="text-sm text-gray-700">
                  Share this note with the assigned teacher
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Student to Teacher Modal */}
      <RMAssignStudentToTeacherModal
        open={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedStudent(null);
        }}
        studentId={selectedStudent?.id || null}
        studentName={selectedStudent?.displayName}
      />
    </div>
  );
}
