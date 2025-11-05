import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface Student {
  id: string;
  name: string;
  displayName: string;
  ageYears: number;
  gender: "male" | "female" | "other";
  parentIds: string[];
  teacherId?: string;
  currentPhase: number;
  enrolledCourses?: string[];
  createdAt: Date;
}

interface Parent {
  id: string;
  displayName: string;
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "phase">("all");
  const [phaseFilter, setPhaseFilter] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load students
      const studentsSnap = await getDocs(collection(db, "students"));
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Student[];
      setStudents(studentsData);

      // Load parents
      const usersSnap = await getDocs(collection(db, "users"));
      const parentsData = usersSnap.docs
        .filter(doc => doc.data().role === "parent")
        .map(doc => ({
          id: doc.id,
          displayName: doc.data().displayName,
        })) as Parent[];
      setParents(parentsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhase = async (studentId: string, newPhase: number) => {
    try {
      await updateDoc(doc(db, "students", studentId), {
        currentPhase: newPhase,
      });
      loadData();
    } catch (error) {
      console.error("Failed to update phase:", error);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      await deleteDoc(doc(db, "students", studentId));
      loadData();
    } catch (error) {
      console.error("Failed to delete student:", error);
    }
  };

  const getParentNames = (parentIds: string[]) => {
    return parentIds
      .map(pid => parents.find(p => p.id === pid)?.displayName || "Unknown")
      .join(", ");
  };

  const filteredStudents = students.filter(s => {
    if (filter === "all") return true;
    if (filter === "phase") return s.currentPhase === phaseFilter;
    return true;
  });

  const stats = {
    total: students.length,
    byPhase: Array.from({ length: 11 }, (_, i) => ({
      phase: i,
      count: students.filter(s => s.currentPhase === i).length,
    })),
    avgAge: students.length > 0 
      ? (students.reduce((sum, s) => sum + s.ageYears, 0) / students.length).toFixed(1)
      : 0,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Student Management</h1>
        <p className="text-gray-400">{stats.total} students • Avg age: {stats.avgAge} years</p>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Students by Phase</h2>
        <div className="grid grid-cols-6 lg:grid-cols-11 gap-2">
          {stats.byPhase.map(({ phase, count }) => (
            <button
              key={phase}
              onClick={() => {
                setFilter("phase");
                setPhaseFilter(phase);
              }}
              className={`p-3 rounded-lg transition-all ${
                filter === "phase" && phaseFilter === phase
                  ? "bg-gradient-to-r from-orange-500 to-sky-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <div className="text-xs text-gray-400">P{phase}</div>
              <div className="text-xl font-bold">{count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "all"
              ? "bg-gradient-to-r from-orange-500 to-sky-500 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          All Students
        </button>
        {filter === "phase" && (
          <div className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg">
            Showing Phase {phaseFilter} ({filteredStudents.length})
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Student</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Age</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Gender</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Phase</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Parent(s)</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Courses</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      student.gender === "male" 
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                        : student.gender === "female"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500"
                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                    }`}>
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{student.displayName}</div>
                      <div className="text-sm text-gray-400">{student.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300">{student.ageYears} yrs</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm capitalize">
                    {student.gender}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={student.currentPhase}
                    onChange={(e) => handleUpdatePhase(student.id, parseInt(e.target.value))}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-medium"
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>Phase {i}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {getParentNames(student.parentIds)}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {student.enrolledCourses?.length || 0} courses
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    className="px-3 py-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No students found
          </div>
        )}
      </div>
    </div>
  );
}
