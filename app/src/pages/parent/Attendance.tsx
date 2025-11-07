import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, query, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "cancelled" | "rescheduled";
  reason?: string;
  markedBy: string;
  markedByRole: string;
  markedAt: any;
  sessionId?: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface RescheduleRequest {
  currentDate: string;
  newDate: string;
  reason: string;
}

interface LeaveRequest {
  startDate: string;
  endDate: string;
  reason: string;
}

const ParentAttendance: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [rescheduleData, setRescheduleData] = useState<RescheduleRequest>({
    currentDate: "",
    newDate: "",
    reason: "",
  });
  const [leaveData, setLeaveData] = useState<LeaveRequest>({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (childId) {
      fetchStudentAndAttendance();
    }
  }, [childId, currentDate]);

  const fetchStudentAndAttendance = async () => {
    if (!childId) return;

    try {
      setLoading(true);

      // Fetch student details
      const studentDoc = await getDoc(doc(db, "students", childId));
      if (studentDoc.exists()) {
        setStudent({
          id: studentDoc.id,
          firstName: studentDoc.data().firstName,
          lastName: studentDoc.data().lastName,
        });
      }

      // Fetch attendance records for current month
      const attendanceRef = collection(db, `students/${childId}/attendance`);
      const attendanceSnap = await getDocs(attendanceRef);

      const records: AttendanceRecord[] = [];
      attendanceSnap.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data(),
        } as AttendanceRecord);
      });

      setAttendance(records);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getAttendanceForDate = (date: Date): AttendanceRecord | undefined => {
    const dateKey = formatDateKey(date);
    return attendance.find((record) => record.date === dateKey);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 border-green-500 text-green-800";
      case "absent":
        return "bg-red-100 border-red-500 text-red-800";
      case "cancelled":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "rescheduled":
        return "bg-blue-100 border-blue-500 text-blue-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "absent":
        return <XCircleIcon className="h-4 w-4" />;
      case "cancelled":
      case "rescheduled":
        return <ClockIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleRescheduleRequest = (dateKey: string) => {
    setSelectedDate(dateKey);
    setRescheduleData({
      currentDate: dateKey,
      newDate: "",
      reason: "",
    });
    setShowRescheduleModal(true);
  };

  const handleLeaveRequest = () => {
    setLeaveData({
      startDate: "",
      endDate: "",
      reason: "",
    });
    setShowLeaveModal(true);
  };

  const submitRescheduleRequest = async () => {
    if (!childId || !rescheduleData.newDate || !rescheduleData.reason) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);

      // Create a ticket for reschedule request
      await addDoc(collection(db, "tickets"), {
        type: "reschedule",
        studentId: childId,
        currentDate: rescheduleData.currentDate,
        newDate: rescheduleData.newDate,
        reason: rescheduleData.reason,
        status: "pending",
        createdBy: "current-parent-uid", // TODO: Get from auth context
        createdAt: serverTimestamp(),
        updatedBy: "current-parent-uid",
        updatedAt: serverTimestamp(),
      });

      alert("Reschedule request submitted successfully! Your teacher will be notified.");
      setShowRescheduleModal(false);
      setRescheduleData({ currentDate: "", newDate: "", reason: "" });
    } catch (error) {
      console.error("Error submitting reschedule request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitLeaveRequest = async () => {
    if (!childId || !leaveData.startDate || !leaveData.endDate || !leaveData.reason) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);

      // Create a ticket for leave request
      await addDoc(collection(db, "tickets"), {
        type: "leave",
        studentId: childId,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason,
        status: "pending",
        createdBy: "current-parent-uid", // TODO: Get from auth context
        createdAt: serverTimestamp(),
        updatedBy: "current-parent-uid",
        updatedAt: serverTimestamp(),
      });

      alert("Leave request submitted successfully! Your teacher and RM will be notified.");
      setShowLeaveModal(false);
      setLeaveData({ startDate: "", endDate: "", reason: "" });
    } catch (error) {
      console.error("Error submitting leave request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = formatDateKey(date);
      const record = getAttendanceForDate(date);
      const isToday = dateKey === formatDateKey(new Date());

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-2 ${
            isToday ? "ring-2 ring-purple-500 bg-purple-50" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? "text-purple-700" : "text-gray-700"}`}>
              {day}
            </span>
          </div>

          {record && (
            <div className="group relative">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded border ${getStatusColor(
                  record.status
                )}`}
              >
                {getStatusIcon(record.status)}
                <span className="text-xs font-medium capitalize">{record.status}</span>
              </div>

              {/* Tooltip */}
              <div className="hidden group-hover:block absolute z-10 left-0 top-full mt-1 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg">
                <p className="font-semibold mb-1">Status: {record.status}</p>
                {record.reason && <p className="mb-1">Reason: {record.reason}</p>}
                <p>Marked by: {record.markedByRole}</p>
                {record.status === "absent" && (
                  <button
                    onClick={() => handleRescheduleRequest(dateKey)}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                  >
                    Request Reschedule
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const stats = {
    present: attendance.filter((r) => r.status === "present").length,
    absent: attendance.filter((r) => r.status === "absent").length,
    cancelled: attendance.filter((r) => r.status === "cancelled").length,
    rescheduled: attendance.filter((r) => r.status === "rescheduled").length,
  };

  const attendancePercentage =
    attendance.length > 0 ? Math.round((stats.present / attendance.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Attendance - {student?.firstName} {student?.lastName}
                </h1>
                <p className="text-sm text-gray-600 mt-1">Track class attendance and schedule changes</p>
              </div>
            </div>
            <button
              onClick={handleLeaveRequest}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Request Leave
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Overall Attendance</div>
            <div className="text-2xl font-bold text-purple-600">{attendancePercentage}%</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Present</div>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Absent</div>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Cancelled</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.cancelled}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Rescheduled</div>
            <div className="text-2xl font-bold text-blue-600">{stats.rescheduled}</div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">{monthYear}</h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
            {renderCalendar()}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-100 border border-green-500"></div>
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-100 border border-red-500"></div>
              <span className="text-sm text-gray-600">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-yellow-100 border border-yellow-500"></div>
              <span className="text-sm text-gray-600">Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 border border-blue-500"></div>
              <span className="text-sm text-gray-600">Rescheduled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Request Reschedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Date
                </label>
                <input
                  type="date"
                  value={rescheduleData.currentDate}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred New Date
                </label>
                <input
                  type="date"
                  value={rescheduleData.newDate}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, newDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={rescheduleData.reason}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, reason: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Please provide a reason for rescheduling..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRescheduleModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRescheduleRequest}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Request Leave</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={leaveData.startDate}
                  onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={leaveData.endDate}
                  onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Please provide a reason for leave..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLeaveModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitLeaveRequest}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentAttendance;
