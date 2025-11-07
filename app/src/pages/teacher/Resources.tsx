import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  PlusIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BookmarkIcon,
  FolderIcon,
  LinkIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  worksheetUrl?: string;
  dueDate: string;
  assignedDate: string;
  studentIds: string[];
  studentNames: string[];
  assignedBy: string;
  status: "active" | "graded" | "expired";
  submissions?: number;
  totalStudents?: number;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

interface Resource {
  id: string;
  title: string;
  type: "slide" | "pdf" | "link";
  course: string;
  unit: string;
  url: string;
  isBookmarked?: boolean;
}

const COMMENT_BANK = [
  "Excellent work! Keep it up!",
  "Good effort. Practice a bit more.",
  "Great improvement from last time!",
  "Need more practice with this concept.",
  "Outstanding performance!",
  "Good understanding shown.",
  "Review this topic again.",
  "Perfect accuracy!",
];

export default function TeacherResources() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"assignments" | "resources">("assignments");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "graded" | "expired">("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subject: "Phonics",
    description: "",
    worksheetUrl: "",
    dueDate: "",
    selectedStudents: [] as string[],
  });

  // Grading state
  const [gradeData, setGradeData] = useState({
    score: "",
    maxScore: "20",
    feedback: "",
  });

  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  const fetchData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Fetch assignments created by teacher
      const assignmentsRef = collection(db, "assignments");
      const assignmentsQuery = query(assignmentsRef, where("assignedBy", "==", user.uid));
      const assignmentsSnap = await getDocs(assignmentsQuery);
      
      const assignmentsList: Assignment[] = [];
      assignmentsSnap.forEach((doc) => {
        const data = doc.data();
        assignmentsList.push({
          id: doc.id,
          title: data.title,
          subject: data.subject,
          description: data.description,
          worksheetUrl: data.worksheetUrl,
          dueDate: data.dueDate,
          assignedDate: data.assignedDate,
          studentIds: data.studentIds || [],
          studentNames: data.studentNames || [],
          assignedBy: data.assignedBy,
          status: data.status || "active",
          submissions: data.submissions || 0,
          totalStudents: (data.studentIds || []).length,
        });
      });
      setAssignments(assignmentsList);

      // Fetch teacher's students (mock for now)
      setStudents([
        { id: "student1", firstName: "Arjun", lastName: "Sharma", displayName: "Arjun Sharma" },
        { id: "student2", firstName: "Priya", lastName: "Patel", displayName: "Priya Patel" },
        { id: "student3", firstName: "Rohan", lastName: "Kumar", displayName: "Rohan Kumar" },
      ]);

      // Mock resources
      setResources([
        {
          id: "1",
          title: "Phase 2 - Short Vowels Slides",
          type: "slide",
          course: "Phonics",
          unit: "Phase 2",
          url: "#",
          isBookmarked: true,
        },
        {
          id: "2",
          title: "Digraphs Worksheet",
          type: "pdf",
          course: "Phonics",
          unit: "Phase 3",
          url: "#",
          isBookmarked: false,
        },
        {
          id: "3",
          title: "Blending Practice Games",
          type: "link",
          course: "Phonics",
          unit: "Phase 2",
          url: "#",
          isBookmarked: true,
        },
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!user?.uid || !formData.title || !formData.dueDate || formData.selectedStudents.length === 0) {
      alert("Please fill all required fields and select at least one student");
      return;
    }

    try {
      const selectedStudentNames = students
        .filter((s) => formData.selectedStudents.includes(s.id))
        .map((s) => s.displayName);

      await addDoc(collection(db, "assignments"), {
        title: formData.title,
        subject: formData.subject,
        description: formData.description,
        worksheetUrl: formData.worksheetUrl || "",
        dueDate: formData.dueDate,
        assignedDate: new Date().toISOString().split("T")[0],
        studentIds: formData.selectedStudents,
        studentNames: selectedStudentNames,
        assignedBy: user.uid,
        status: "active",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

      alert("Assignment created successfully!");
      setShowCreateModal(false);
      setFormData({
        title: "",
        subject: "Phonics",
        description: "",
        worksheetUrl: "",
        dueDate: "",
        selectedStudents: [],
      });
      fetchData();
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to create assignment");
    }
  };

  const handleQuickGrade = async () => {
    if (!selectedAssignment || !gradeData.score) {
      alert("Please enter a score");
      return;
    }

    try {
      await updateDoc(doc(db, "assignments", selectedAssignment.id), {
        status: "graded",
        gradeScore: parseInt(gradeData.score),
        gradeMaxScore: parseInt(gradeData.maxScore),
        gradeFeedback: gradeData.feedback,
        gradedAt: serverTimestamp(),
        updatedBy: user?.uid,
        updatedAt: serverTimestamp(),
      });

      alert("Assignment graded successfully!");
      setShowGradeModal(false);
      setSelectedAssignment(null);
      setGradeData({ score: "", maxScore: "20", feedback: "" });
      fetchData();
    } catch (error) {
      console.error("Error grading assignment:", error);
      alert("Failed to grade assignment");
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter((id) => id !== studentId)
        : [...prev.selectedStudents, studentId],
    }));
  };

  const toggleBookmark = (resourceId: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, isBookmarked: !r.isBookmarked } : r))
    );
  };

  const filteredAssignments = assignments
    .filter((a) => filterStatus === "all" || a.status === filterStatus)
    .filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "graded":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "slide":
        return DocumentIcon;
      case "pdf":
        return DocumentTextIcon;
      case "link":
        return LinkIcon;
      default:
        return DocumentIcon;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teaching Resources & Worksheets</h1>
        {activeTab === "assignments" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Assignment
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "assignments"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            Worksheets & Assignments
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "resources"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FolderIcon className="h-5 w-5 inline mr-2" />
            Resource Library
          </button>
        </div>
      </div>

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="graded">Graded</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-lg p-3">
                  <ClockIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {assignments.filter((a) => a.status === "active").length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {assignments.filter((a) => a.status === "graded").length}
                  </div>
                  <div className="text-sm text-gray-600">Graded</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 rounded-lg p-3">
                  <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{assignments.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignments List */}
          <div className="space-y-3">
            {filteredAssignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assignments found</p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {assignment.subject}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        <span>Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}</span>
                        <span>Students: {assignment.studentNames.join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {assignment.worksheetUrl && (
                        <a
                          href={assignment.worksheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          View Worksheet
                        </a>
                      )}
                      {assignment.status === "active" && (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowGradeModal(true);
                          }}
                          className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Grade
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === "resources" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => {
              const Icon = getResourceIcon(resource.type);
              return (
                <div key={resource.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-purple-100 rounded-lg p-3">
                      <Icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <button
                      onClick={() => toggleBookmark(resource.id)}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      {resource.isBookmarked ? (
                        <BookmarkSolidIcon className="h-6 w-6" />
                      ) : (
                        <BookmarkIcon className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {resource.course}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{resource.unit}</span>
                  </div>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                  >
                    Open Resource
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create New Assignment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Short Vowels Practice"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Phonics">Phonics</option>
                  <option value="Grammar">Grammar</option>
                  <option value="Speaking">Public Speaking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="What should students focus on?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Worksheet URL</label>
                <input
                  type="url"
                  value={formData.worksheetUrl}
                  onChange={(e) => setFormData({ ...formData, worksheetUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Students <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-gray-900">{student.displayName}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.selectedStudents.length} student(s) selected
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Grade Assignment</h2>
              <button
                onClick={() => setShowGradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{selectedAssignment.title}</h3>
                <p className="text-sm text-gray-600">Students: {selectedAssignment.studentNames.join(", ")}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={gradeData.score}
                    onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="18"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Score</label>
                  <input
                    type="number"
                    value={gradeData.maxScore}
                    onChange={(e) => setGradeData({ ...gradeData, maxScore: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                <textarea
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Optional feedback for student..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment Bank</label>
                <div className="flex flex-wrap gap-2">
                  {COMMENT_BANK.map((comment, index) => (
                    <button
                      key={index}
                      onClick={() => setGradeData({ ...gradeData, feedback: comment })}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                    >
                      {comment}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowGradeModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickGrade}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
