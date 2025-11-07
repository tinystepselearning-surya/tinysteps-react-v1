import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRMStudents } from "../../hooks/useRMStudents";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BanknotesIcon,
  UsersIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

export default function RMReports() {
  const { user } = useAuth();
  const { students } = useRMStudents(user?.uid || null);
  
  const [reportType, setReportType] = useState<"teacher" | "cohort" | "fees">("teacher");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");

  // Generate CSV for Teacher Performance Report
  const generateTeacherPerformanceCSV = () => {
    // Mock data - replace with real data from Firestore
    const teachers = [
      { name: "Sarah Johnson", completed: 45, avgRating: 4.8, earnings: 22500, attendance: "95%" },
      { name: "Mike Chen", completed: 38, avgRating: 4.6, earnings: 19000, attendance: "92%" },
      { name: "Priya Sharma", completed: 42, avgRating: 4.9, earnings: 21000, attendance: "98%" },
    ];

    const headers = ["Teacher Name", "Sessions Completed", "Avg Rating", "Total Earnings (₹)", "Attendance Rate"];
    const rows = teachers.map(t => [t.name, t.completed, t.avgRating, t.earnings, t.attendance]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
      "",
      `Total Sessions,${teachers.reduce((sum, t) => sum + t.completed, 0)}`,
      `Total Earnings,₹${teachers.reduce((sum, t) => sum + t.earnings, 0).toLocaleString()}`,
    ].join("\n");

    downloadFile(csvContent, `teacher-performance-${new Date().toISOString().split('T')[0]}.csv`, "text/csv");
  };

  // Generate CSV for Cohort Health Report
  const generateCohortHealthCSV = () => {
    const csvData = students.map(student => {
      const attendance = Math.random() * 100;
      const progress = student.summary
        ? Math.round((student.summary.phonicsMastery + student.summary.grammarMastery + student.summary.speakingMastery) / 3)
        : 0;

      return {
        "Student Name": student.displayName,
        "Grade": student.grade || "—",
        "Teacher": student.assignedTeacherName || "Unassigned",
        "Status": student.status,
        "Attendance %": attendance.toFixed(1),
        "Progress %": progress,
        "Health Status": attendance < 80 || progress < 30 ? "At Risk" : "Healthy",
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => headers.map(h => `"${(row as any)[h]}"`).join(",")),
      "",
      `Total Students,${students.length}`,
      `Active,${students.filter(s => s.status === 'active').length}`,
      `At Risk,${csvData.filter((r: any) => r["Health Status"] === "At Risk").length}`,
    ].join("\n");

    downloadFile(csvContent, `cohort-health-${new Date().toISOString().split('T')[0]}.csv`, "text/csv");
  };

  // Generate CSV for Fee Collection Report
  const generateFeeCollectionCSV = () => {
    // Mock data - replace with real payment data
    const payments = [
      { parent: "Rajesh Kumar", student: "Aarav Kumar", amount: 5000, dueDate: "2024-11-01", status: "Paid", paidDate: "2024-11-05" },
      { parent: "Priya Sharma", student: "Diya Sharma", amount: 5000, dueDate: "2024-11-20", status: "Overdue", paidDate: "-" },
      { parent: "Amit Patel", student: "Rohan Patel", amount: 5000, dueDate: "2024-12-03", status: "Pending", paidDate: "-" },
    ];

    const headers = ["Parent Name", "Student Name", "Amount (₹)", "Due Date", "Status", "Paid Date"];
    const rows = payments.map(p => [p.parent, p.student, p.amount, p.dueDate, p.status, p.paidDate]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
      "",
      `Total Expected,₹${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`,
      `Total Collected,₹${payments.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`,
      `Total Pending,₹${payments.filter(p => p.status !== "Paid").reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`,
      `Collection Rate,${((payments.filter(p => p.status === "Paid").length / payments.length) * 100).toFixed(1)}%`,
    ].join("\n");

    downloadFile(csvContent, `fee-collection-${new Date().toISOString().split('T')[0]}.csv`, "text/csv");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateReport = () => {
    if (reportType === "teacher") {
      generateTeacherPerformanceCSV();
    } else if (reportType === "cohort") {
      generateCohortHealthCSV();
    } else if (reportType === "fees") {
      generateFeeCollectionCSV();
    }
  };

  const reportCards = [
    {
      id: "teacher",
      title: "Teacher Performance",
      description: "Sessions completed, ratings, earnings, and attendance rates by teacher",
      icon: AcademicCapIcon,
      color: "blue",
      metrics: ["45 avg sessions/teacher", "4.7 avg rating", "95% attendance"],
    },
    {
      id: "cohort",
      title: "Cohort Health",
      description: "Student attendance, progress tracking, and health status overview",
      icon: UsersIcon,
      color: "green",
      metrics: [`${students.length} total students`, "85% avg attendance", "12 flagged"],
    },
    {
      id: "fees",
      title: "Fee Collection",
      description: "Payment status, collection rates, and overdue tracking",
      icon: BanknotesIcon,
      color: "purple",
      metrics: ["₹2.5L collected", "92% collection rate", "8 overdue"],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Exports</h1>
        <p className="text-sm text-gray-600 mt-1">
          Generate comprehensive reports and export data for analysis
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportCards.map((card) => {
          const Icon = card.icon;
          const isSelected = reportType === card.id;
          
          return (
            <button
              key={card.id}
              onClick={() => setReportType(card.id as any)}
              className={`text-left p-6 rounded-lg border-2 transition-all ${
                isSelected
                  ? `border-${card.color}-500 bg-${card.color}-50`
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                  <Icon className={`h-6 w-6 text-${card.color}-600`} />
                </div>
                {isSelected && (
                  <div className={`px-2 py-1 bg-${card.color}-500 text-white text-xs font-semibold rounded-full`}>
                    Selected
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{card.description}</p>
              
              <div className="space-y-1">
                {card.metrics.map((metric, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${card.color}-500`} />
                    <span className="text-xs text-gray-600">{metric}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="csv">CSV (Excel)</option>
              <option value="pdf">PDF (Coming Soon)</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={format === "pdf"}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Generate Report
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CalendarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Date Range Tips</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Leave dates empty to include all historical data</li>
                <li>• Monthly reports: Set start to 1st and end to last day of month</li>
                <li>• Quarterly reports: Set 3-month date range (e.g., Jan 1 - Mar 31)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Exports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setReportType("teacher");
              generateTeacherPerformanceCSV();
            }}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                <AcademicCapIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Current Month Teachers</h3>
            </div>
            <p className="text-sm text-gray-600">Export this month's teacher performance data</p>
          </button>

          <button
            onClick={() => {
              setReportType("cohort");
              generateCohortHealthCSV();
            }}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
                <UsersIcon className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Current Cohort Status</h3>
            </div>
            <p className="text-sm text-gray-600">Export current student health snapshot</p>
          </button>

          <button
            onClick={() => {
              setReportType("fees");
              generateFeeCollectionCSV();
            }}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                <BanknotesIcon className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Current Month Fees</h3>
            </div>
            <p className="text-sm text-gray-600">Export this month's collection status</p>
          </button>

          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200">
                <ChartBarIcon className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-medium text-gray-900">All Students List</h3>
            </div>
            <p className="text-sm text-gray-600">Export complete student roster with details</p>
          </button>

          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200">
                <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-medium text-gray-900">Session Summary</h3>
            </div>
            <p className="text-sm text-gray-600">Export all sessions with outcomes</p>
          </button>

          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200">
                <CalendarIcon className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="font-medium text-gray-900">Upcoming Schedule</h3>
            </div>
            <p className="text-sm text-gray-600">Export next 30 days class schedule</p>
          </button>
        </div>
      </div>

      {/* Scheduled Reports (Future Feature) */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-200 rounded-lg">
            <CalendarIcon className="h-6 w-6 text-orange-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Scheduled Reports (Coming Soon)</h3>
            <p className="text-sm text-gray-700 mb-3">
              Set up automated weekly or monthly report delivery to your email
            </p>
            <button
              disabled
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm opacity-50 cursor-not-allowed"
            >
              Configure Scheduled Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
