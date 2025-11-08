import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import { COURSES } from "../../data/phases";

interface Student {
  id: string;
  name: string;
  displayName: string;
  ageYears: number;
  gender: "male" | "female" | "other";
  parentIds: string[];
  teacherId?: string;
  enrolledCourses: string[];
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
  const [filter, setFilter] = useState<"all" | "course">("all");
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [updatingCourses, setUpdatingCourses] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const auth = getAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load students
      const studentsSnap = await getDocs(collection(db, "students"));
      const studentsData = studentsSnap.docs.map(doc => {
        const raw = doc.data();
        let createdAt = raw.createdAt;
        if (createdAt && typeof createdAt.toDate === "function") {
          createdAt = createdAt.toDate();
        } else if (createdAt instanceof Date) {
          // already a JS Date
        } else {
          createdAt = new Date();
        }
        return {
          id: doc.id,
          ...raw,
          enrolledCourses: raw.enrolledCourses || [], // Ensure enrolledCourses is always an array
          createdAt,
        };
      }) as Student[];
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

  const handleOpenCourseModal = (student: Student) => {
    setSelectedStudent(student);
    setSelectedCourses(student.enrolledCourses || []);
    setShowCourseModal(true);
  };

  const handleCloseCourseModal = () => {
    setSelectedStudent(null);
    setSelectedCourses([]);
    setShowCourseModal(false);
  };

  const handleSaveCourses = async () => {
    if (!selectedStudent) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("You must be logged in to update course enrollment");
      return;
    }

    setUpdatingCourses(true);
    try {
      console.log("Saving courses:", selectedCourses);

      // Update database with selected courses
      await updateDoc(doc(db, "students", selectedStudent.id), {
        enrolledCourses: selectedCourses,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      });

      console.log("Database update successful");

      // Update local state
      const updatedStudent = { ...selectedStudent, enrolledCourses: selectedCourses };
      setSelectedStudent(updatedStudent);

      // Refresh data in background
      loadData();

      // Close modal
      handleCloseCourseModal();
      console.log("Course update completed");
    } catch (error) {
      console.error("Failed to save courses:", error);
      alert(`Failed to update course enrollment: ${error}`);
    } finally {
      setUpdatingCourses(false);
    }
  };

  const handleToggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
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
    if (filter === "course") return s.enrolledCourses?.includes(courseFilter) || false;
    return true;
  });

  const stats = {
    total: students.length,
    byCourse: COURSES.map(course => ({
      course: course.id,
      name: course.name,
      count: students.filter(s => s.enrolledCourses?.includes(course.id)).length,
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
        <h2 className="text-lg font-semibold text-white mb-4">Students by Course</h2>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
          {stats.byCourse.map(({ course, name, count }) => (
            <button
              key={course}
              onClick={() => {
                setFilter("course");
                setCourseFilter(course);
              }}
              className={`p-3 rounded-lg transition-all ${
                filter === "course" && courseFilter === course
                  ? "bg-gradient-to-r from-orange-500 to-sky-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <div className="text-xs text-gray-400 truncate">{name}</div>
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
        {filter === "course" && (
          <div className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg">
            Showing {COURSES.find(c => c.id === courseFilter)?.name} ({filteredStudents.length})
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Enrolled Courses</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Parent(s)</th>
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
                <td className="px-6 py-4 text-gray-400 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1 flex-1">
                      {student.enrolledCourses?.length > 0 ? (
                        student.enrolledCourses.map(courseId => {
                          const course = COURSES.find(c => c.id === courseId);
                          return course ? (
                            <span key={courseId} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                              {course.name}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <span className="text-gray-500">No courses</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenCourseModal(student)}
                      className="px-2 py-1 text-blue-400 hover:bg-blue-500/10 rounded text-xs font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {getParentNames(student.parentIds)}
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

      {/* Course Assignment Modal */}
      {showCourseModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseCourseModal}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-2">Assign Courses</h2>
            <p className="text-gray-400 mb-6">For student: <span className="text-white font-medium">{selectedStudent.displayName}</span></p>

            <div className="space-y-6">
              {/* Group courses by subject */}
              {['phonics', 'grammar_writing', 'public_speaking'].map(subject => {
                const subjectCourses = COURSES.filter(course => course.subject === subject);
                const subjectName = subject === 'phonics' ? 'Phonics' :
                                  subject === 'grammar_writing' ? 'Grammar & Writing' : 'Public Speaking';

                return (
                  <div key={subject}>
                    <h3 className="text-lg font-semibold text-white mb-3">{subjectName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {subjectCourses.map(course => {
                        const isSelected = selectedCourses.includes(course.id);
                        return (
                          <div key={course.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-green-500 border-green-500'
                                  : 'bg-gray-600 border-gray-400 hover:border-gray-300'
                              }`}
                              onClick={() => handleToggleCourseSelection(course.id)}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 cursor-pointer" onClick={() => handleToggleCourseSelection(course.id)}>
                              <div className="font-medium text-white">{course.name}</div>
                              <div className="text-sm text-gray-400">{course.age} • {course.tagline}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleCloseCourseModal}
                className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCourses}
                disabled={updatingCourses}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingCourses ? "Updating..." : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
