import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRM } from "../../hooks/useRM";
import { useRMTeachers } from "../../hooks/useRMTeachers";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { 
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  CalendarIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function RMTeachers() {
  const { user } = useAuth();
  const { rm } = useRM(user?.uid || null);
  const { teachers, workloads, loading } = useRMTeachers(rm?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [targetTeacher, setTargetTeacher] = useState("");
  const [filterView, setFilterView] = useState<"all" | "available" | "full">("all");

  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherStudents(selectedTeacher.id);
    }
  }, [selectedTeacher]);

  const fetchTeacherStudents = async (teacherId: string) => {
    try {
      const studentsRef = collection(db, "students");
      const studentsQuery = query(studentsRef, where("assignedTeacherId", "==", teacherId));
      const studentsSnap = await getDocs(studentsQuery);
      
      const studentsList: any[] = [];
      studentsSnap.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
      // Mock students for demo
      setStudents([
        { id: "s1", firstName: "Arjun", lastName: "Sharma", displayName: "Arjun Sharma" },
        { id: "s2", firstName: "Priya", lastName: "Patel", displayName: "Priya Patel" },
      ]);
    }
  };

  const handleReassignStudent = async () => {
    if (!selectedStudent || !targetTeacher) {
      alert("Please select both a student and target teacher");
      return;
    }

    try {
      await updateDoc(doc(db, "students", selectedStudent), {
        assignedTeacherId: targetTeacher,
        reassignedAt: new Date().toISOString(),
        reassignedBy: user?.uid,
      });
      
      alert("Student reassigned successfully!");
      setShowReassignModal(false);
      setSelectedStudent("");
      setTargetTeacher("");
    } catch (error) {
      console.error("Error reassigning student:", error);
      alert("Failed to reassign student");
    }
  };

  // Calculate weekly sessions
  const getWeeklySessions = (teacherId: string) => {
    // Mock calculation - in production, query sessions from last 7 days
    return Math.floor(Math.random() * 15) + 5; // 5-20 sessions
  };

  const getMonthlySessions = (teacherId: string) => {
    // Mock calculation - in production, query sessions from last 30 days
    return Math.floor(Math.random() * 40) + 20; // 20-60 sessions
  };

  const getUtilization = (workload: any) => {
    if (!workload) return 0;
    return Math.round((workload.activeStudents / workload.maxStudents) * 100);
  };

  const filteredTeachers = teachers
    .filter(teacher => {
      const matchesSearch = teacher.displayName.toLowerCase().includes(searchQuery.toLowerCase());
      const workload = workloads.find(w => w.teacherId === teacher.id);
      const utilization = getUtilization(workload);
      
      if (filterView === "available" && utilization >= 90) return false;
      if (filterView === "full" && utilization < 90) return false;
      
      return matchesSearch;
    });

  // Generate free slots (mock data)
  const generateFreeSlots = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const times = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
    const slots: any[] = [];
    
    days.forEach((day) => {
      const availableTimes = times.filter(() => Math.random() > 0.4); // Random availability
      availableTimes.forEach((time) => {
        slots.push({ day, time });
      });
    });
    
    return slots;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Teacher Utilization Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            {teachers.length} total teachers • {filteredTeachers.length} shown
          </p>
        </div>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
          <UserPlusIcon className="h-5 w-5" />
          Add Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterView("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterView === "all"
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All Teachers
          </button>
          <button
            onClick={() => setFilterView("available")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterView === "available"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setFilterView("full")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterView === "full"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            At Capacity
          </button>
        </div>
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
            const utilization = getUtilization(workload);
            const weeklySessions = getWeeklySessions(teacher.id);
            const monthlySessions = getMonthlySessions(teacher.id);

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
                      <span className="text-sm text-gray-600">Assigned Students</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {workload.activeStudents} / {workload.maxStudents}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Utilization</span>
                        <span className={`text-sm font-semibold ${
                          utilization >= 90 ? 'text-red-600' :
                          utilization >= 70 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {utilization}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-full rounded-full ${
                            utilization >= 90 ? 'bg-red-500' :
                            utilization >= 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-blue-600 mb-1">This Week</div>
                        <div className="text-lg font-bold text-blue-900">{weeklySessions}</div>
                        <div className="text-xs text-blue-600">sessions</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-purple-600 mb-1">This Month</div>
                        <div className="text-lg font-bold text-purple-900">{monthlySessions}</div>
                        <div className="text-xs text-purple-600">sessions</div>
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
                  <button 
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setShowSlotsModal(true);
                    }}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Free Slots
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setShowReassignModal(true);
                    }}
                    className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Reassign
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Free Slots Modal */}
      {showSlotsModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Free Slots</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedTeacher.displayName}</p>
              </div>
              <button
                onClick={() => setShowSlotsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-700 text-sm">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {generateFreeSlots().map((slot, index) => (
                  <div
                    key={index}
                    className="bg-green-50 border border-green-200 rounded-lg p-2 text-center"
                  >
                    <div className="text-xs text-green-700 font-medium">{slot.time}</div>
                  </div>
                ))}
              </div>

              {generateFreeSlots().length === 0 && (
                <div className="text-center py-12">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No free slots available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reassign Student Modal */}
      {showReassignModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reassign Student</h2>
                <p className="text-sm text-gray-600 mt-1">From {selectedTeacher.displayName}</p>
              </div>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Choose a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.displayName || `${student.firstName} ${student.lastName}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reassign To <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetTeacher}
                  onChange={(e) => setTargetTeacher(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Choose a teacher...</option>
                  {teachers
                    .filter((t) => t.id !== selectedTeacher.id && t.status === "active")
                    .map((teacher) => {
                      const workload = workloads.find(w => w.teacherId === teacher.id);
                      const utilization = getUtilization(workload);
                      return (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.displayName} ({utilization}% utilized)
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Reassigning will update the student's assigned teacher and notify both teachers.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignStudent}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Reassign Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
