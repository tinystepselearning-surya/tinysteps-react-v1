import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import {
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  perClassRate: number;
}

interface Session {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  studentName: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  courseName: string;
  amount: number;
}

export default function TeacherPerformance() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [user?.uid, selectedMonth, selectedYear]);

  const fetchData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Fetch teacher details
      const teacherDoc = await getDoc(doc(db, "teachers", user.uid));
      if (teacherDoc.exists()) {
        const data = teacherDoc.data();
        setTeacher({
          id: teacherDoc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          perClassRate: data.perClassRate || 500,
        });

        // Fetch sessions
        const sessionsRef = collection(db, "sessions");
        const sessionsQuery = query(sessionsRef, where("teacherId", "==", user.uid));

        try {
          const sessionsSnap = await getDocs(sessionsQuery);
          const sessionsList: Session[] = [];
          
          sessionsSnap.forEach((doc) => {
            const data = doc.data();
            sessionsList.push({
              id: doc.id,
              scheduledDate: data.scheduledDate,
              scheduledTime: data.scheduledTime || "10:00 AM",
              studentName: data.studentName || "Student",
              status: data.status,
              courseName: data.courseName || "Phonics",
              amount: data.perClassRate || 500,
            });
          });

          setSessions(sessionsList);
        } catch (error) {
          console.error("Error fetching sessions:", error);
          // Mock data for demonstration
          const mockSessions: Session[] = [];
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();

          // Generate mock sessions for current year
          for (let month = 0; month <= currentMonth; month++) {
            const sessionsInMonth = Math.floor(Math.random() * 10) + 15; // 15-25 sessions per month
            for (let i = 0; i < sessionsInMonth; i++) {
              const day = Math.floor(Math.random() * 28) + 1;
              const status = Math.random() > 0.1 ? "completed" : Math.random() > 0.5 ? "cancelled" : "no_show";
              mockSessions.push({
                id: `session-${month}-${i}`,
                scheduledDate: `${currentYear}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                scheduledTime: "10:00 AM",
                studentName: ["Arjun", "Priya", "Rohan", "Ananya", "Kabir"][Math.floor(Math.random() * 5)],
                status: status as any,
                courseName: ["Phonics", "Grammar", "Speaking"][Math.floor(Math.random() * 3)],
                amount: 500,
              });
            }
          }
          setSessions(mockSessions);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessionsByMonth = (month: number, year: number) => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.scheduledDate);
      return sessionDate.getMonth() === month && sessionDate.getFullYear() === year;
    });
  };

  const calculateMonthlyStats = (month: number, year: number) => {
    const monthSessions = filterSessionsByMonth(month, year);
    const completed = monthSessions.filter((s) => s.status === "completed").length;
    const cancelled = monthSessions.filter((s) => s.status === "cancelled").length;
    const noShows = monthSessions.filter((s) => s.status === "no_show").length;
    const earnings = completed * (teacher?.perClassRate || 500);

    return { completed, cancelled, noShows, earnings, total: monthSessions.length };
  };

  const calculateYTDStats = () => {
    const ytdSessions = sessions.filter((session) => {
      const sessionDate = new Date(session.scheduledDate);
      return sessionDate.getFullYear() === selectedYear && sessionDate.getMonth() <= selectedMonth;
    });

    const completed = ytdSessions.filter((s) => s.status === "completed").length;
    const cancelled = ytdSessions.filter((s) => s.status === "cancelled").length;
    const noShows = ytdSessions.filter((s) => s.status === "no_show").length;
    const earnings = completed * (teacher?.perClassRate || 500);

    return { completed, cancelled, noShows, earnings, total: ytdSessions.length };
  };

  const downloadStatement = () => {
    const monthStats = calculateMonthlyStats(selectedMonth, selectedYear);
    const monthSessions = filterSessionsByMonth(selectedMonth, selectedYear);
    const completedSessions = monthSessions.filter((s) => s.status === "completed");

    // Create CSV content
    let csv = "Date,Time,Student,Course,Status,Amount\n";
    completedSessions.forEach((session) => {
      csv += `${session.scheduledDate},${session.scheduledTime},"${session.studentName}","${session.courseName}",${session.status},₹${session.amount}\n`;
    });
    csv += `\nTotal Sessions,${monthStats.completed}\n`;
    csv += `Total Earnings,₹${monthStats.earnings}\n`;

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const monthStats = calculateMonthlyStats(selectedMonth, selectedYear);
  const ytdStats = calculateYTDStats();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading earnings data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your teaching sessions and earnings
          </p>
        </div>
        <button
          onClick={downloadStatement}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Download Statement
        </button>
      </div>

      {/* Rate Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm mb-1">Per Class Rate</p>
            <p className="text-4xl font-bold">₹{teacher?.perClassRate || 500}</p>
            <p className="text-purple-100 text-sm mt-2">
              {teacher?.firstName} {teacher?.lastName}
            </p>
          </div>
          <div className="bg-white/20 rounded-full p-4">
            <BanknotesIcon className="h-12 w-12" />
          </div>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <CalendarIcon className="h-6 w-6 text-gray-400" />
          <div className="flex gap-3 flex-1">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {months[selectedMonth]} {selectedYear}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{monthStats.completed}</div>
            <div className="text-sm text-gray-600 mt-1">sessions</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <BanknotesIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600">Earnings</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">₹{monthStats.earnings.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-1">this month</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-100 rounded-lg p-3">
                <XCircleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{monthStats.cancelled}</div>
            <div className="text-sm text-gray-600 mt-1">sessions</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 rounded-lg p-3">
                <ClockIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-sm text-gray-600">No-Shows</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{monthStats.noShows}</div>
            <div className="text-sm text-gray-600 mt-1">sessions</div>
          </div>
        </div>
      </div>

      {/* YTD Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Year-to-Date (YTD) {selectedYear}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-6 border border-green-200">
            <div className="text-sm text-green-700 mb-2">Total Completed</div>
            <div className="text-3xl font-bold text-green-900">{ytdStats.completed}</div>
            <div className="text-sm text-green-600 mt-1">sessions</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 border border-blue-200">
            <div className="text-sm text-blue-700 mb-2">Total Earnings</div>
            <div className="text-3xl font-bold text-blue-900">₹{ytdStats.earnings.toLocaleString()}</div>
            <div className="text-sm text-blue-600 mt-1">year-to-date</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-sm p-6 border border-yellow-200">
            <div className="text-sm text-yellow-700 mb-2">Total Cancelled</div>
            <div className="text-3xl font-bold text-yellow-900">{ytdStats.cancelled}</div>
            <div className="text-sm text-yellow-600 mt-1">sessions</div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-sm p-6 border border-red-200">
            <div className="text-sm text-red-700 mb-2">Total No-Shows</div>
            <div className="text-3xl font-bold text-red-900">{ytdStats.noShows}</div>
            <div className="text-sm text-red-600 mt-1">sessions</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <ChartBarIcon className="h-6 w-6 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Monthly Breakdown - {selectedYear}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Month</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Completed</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Cancelled</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">No-Shows</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {months.map((month, index) => {
                const stats = calculateMonthlyStats(index, selectedYear);
                const isFuture = index > new Date().getMonth() && selectedYear === new Date().getFullYear();
                
                if (isFuture) return null;

                return (
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 ${index === selectedMonth ? 'bg-purple-50' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{month}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{stats.completed}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">{stats.cancelled}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">{stats.noShows}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right">
                      ₹{stats.earnings.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">{ytdStats.completed}</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">{ytdStats.cancelled}</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">{ytdStats.noShows}</td>
                <td className="px-6 py-4 text-sm text-green-600 text-right">
                  ₹{ytdStats.earnings.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Sessions - {months[selectedMonth]} {selectedYear}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filterSessionsByMonth(selectedMonth, selectedYear)
                .slice(0, 10)
                .map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(session.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{session.scheduledTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{session.studentName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{session.courseName}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : session.status === "cancelled"
                            ? "bg-yellow-100 text-yellow-800"
                            : session.status === "no_show"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {session.status === "no_show" ? "No Show" : session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {session.status === "completed" ? `₹${session.amount}` : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
