import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import {
  CheckCircleIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface Session {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  courseId?: string;
  courseName?: string;
}

interface CurriculumTopic {
  id: string;
  course: string;
  phase: string;
  title: string;
  status: string;
}

interface FormData {
  outcomes: string;
  coveredTopics: string[];
  accuracyScore: number;
  fluencyScore: number;
  confidenceScore: number;
  parentNote: string;
  attendanceStatus: "present" | "absent" | "late";
  attendanceReason?: string;
}

export default function PostClassForm() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [availableTopics, setAvailableTopics] = useState<CurriculumTopic[]>([]);
  const [formData, setFormData] = useState<FormData>({
    outcomes: "",
    coveredTopics: [],
    accuracyScore: 3,
    fluencyScore: 3,
    confidenceScore: 3,
    parentNote: "",
    attendanceStatus: "present",
    attendanceReason: "",
  });
  const [suggestedNextTopic, setSuggestedNextTopic] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  useEffect(() => {
    if (formData.coveredTopics.length > 0 && availableTopics.length > 0) {
      suggestNextTopic();
    }
  }, [formData.coveredTopics, availableTopics]);

  const fetchSessionData = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);

      // Fetch session details
      const sessionDoc = await getDoc(doc(db, "sessions", sessionId));
      if (sessionDoc.exists()) {
        const data = sessionDoc.data();
        setSession({
          id: sessionDoc.id,
          studentId: data.studentId,
          studentName: data.studentName || "Student",
          teacherId: data.teacherId,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          status: data.status,
          courseId: data.courseId,
          courseName: data.courseName,
        });

        // Fetch curriculum topics for this student
        if (data.studentId) {
          const curriculumRef = collection(db, `students/${data.studentId}/curriculum`);
          const curriculumSnap = await getDocs(curriculumRef);
          
          const topics: CurriculumTopic[] = [];
          curriculumSnap.forEach((doc) => {
            topics.push({
              id: doc.id,
              ...doc.data(),
            } as CurriculumTopic);
          });
          
          setAvailableTopics(topics);
        }
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
    } finally {
      setLoading(false);
    }
  };

  const suggestNextTopic = () => {
    // Find the next topic that hasn't been started
    const notStartedTopics = availableTopics.filter(
      (topic) => topic.status === "not_started" && !formData.coveredTopics.includes(topic.id)
    );

    if (notStartedTopics.length > 0) {
      setSuggestedNextTopic(notStartedTopics[0].title);
    } else {
      // Find topics in progress
      const inProgressTopics = availableTopics.filter(
        (topic) => topic.status === "in_progress" && !formData.coveredTopics.includes(topic.id)
      );
      
      if (inProgressTopics.length > 0) {
        setSuggestedNextTopic(inProgressTopics[0].title);
      } else {
        setSuggestedNextTopic("All topics covered! Consider review sessions.");
      }
    }
  };

  const handleTopicToggle = (topicId: string) => {
    setFormData((prev) => ({
      ...prev,
      coveredTopics: prev.coveredTopics.includes(topicId)
        ? prev.coveredTopics.filter((id) => id !== topicId)
        : [...prev.coveredTopics, topicId],
    }));
  };

  const handleSubmit = async () => {
    if (!sessionId || !session || !user?.uid) {
      alert("Missing session information");
      return;
    }

    if (!formData.outcomes.trim()) {
      alert("Please provide a session outcomes summary");
      return;
    }

    if (formData.attendanceStatus === "absent" && !formData.attendanceReason) {
      alert("Please provide a reason for absence");
      return;
    }

    try {
      setSubmitting(true);

      // Update session with post-class data
      await updateDoc(doc(db, "sessions", sessionId), {
        status: "completed",
        outcomes: formData.outcomes,
        coveredTopics: formData.coveredTopics,
        rubric: {
          accuracy: formData.accuracyScore,
          fluency: formData.fluencyScore,
          confidence: formData.confidenceScore,
        },
        parentNote: formData.parentNote,
        completedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

      // Update attendance record
      const attendanceDate = session.scheduledDate;
      await setDoc(
        doc(db, `students/${session.studentId}/attendance`, attendanceDate),
        {
          date: attendanceDate,
          status: formData.attendanceStatus,
          reason: formData.attendanceReason || "",
          markedBy: user.uid,
          markedByRole: "teacher",
          markedAt: serverTimestamp(),
          sessionId: sessionId,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Update curriculum topics status
      for (const topicId of formData.coveredTopics) {
        const topic = availableTopics.find((t) => t.id === topicId);
        if (topic) {
          await updateDoc(doc(db, `students/${session.studentId}/curriculum`, topicId), {
            status: "completed",
            completedDate: attendanceDate,
            teacherNote: formData.parentNote,
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Update progress records
      for (const topicId of formData.coveredTopics) {
        await setDoc(
          doc(db, `students/${session.studentId}/progress`, topicId),
          {
            topicId: topicId,
            accuracyScore: formData.accuracyScore,
            fluencyScore: formData.fluencyScore,
            confidenceScore: formData.confidenceScore,
            sessionId: sessionId,
            sessionDate: attendanceDate,
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      alert("Post-class update saved successfully!");
      navigate("/teacher/calendar");
    } catch (error) {
      console.error("Error submitting post-class update:", error);
      alert("Failed to save post-class update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading session details...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session not found</p>
          <button
            onClick={() => navigate("/teacher/calendar")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/teacher/calendar")}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Calendar
          </button>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Post-Class Update</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">{session.studentName}</span>
              <span>•</span>
              <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
              <span>•</span>
              <span>{session.scheduledTime}</span>
              {session.courseName && (
                <>
                  <span>•</span>
                  <span className="text-purple-600 font-medium">{session.courseName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {(["present", "late", "absent"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFormData({ ...formData, attendanceStatus: status })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.attendanceStatus === status
                    ? "border-purple-600 bg-purple-50 text-purple-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="capitalize font-medium">{status}</span>
              </button>
            ))}
          </div>
          {formData.attendanceStatus === "absent" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Absence
              </label>
              <input
                type="text"
                value={formData.attendanceReason}
                onChange={(e) => setFormData({ ...formData, attendanceReason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Student was unwell"
              />
            </div>
          )}
        </div>

        {/* Session Outcomes */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Session Outcomes Summary</h2>
          </div>
          <textarea
            value={formData.outcomes}
            onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Describe what was covered in the class, student's engagement, key achievements, and any challenges faced..."
          />
        </div>

        {/* Covered Topics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Topics Covered</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableTopics.length === 0 ? (
              <p className="text-gray-600 text-sm">No curriculum topics available for this student.</p>
            ) : (
              availableTopics.map((topic) => (
                <label
                  key={topic.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.coveredTopics.includes(topic.id)}
                    onChange={() => handleTopicToggle(topic.id)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{topic.title}</div>
                    <div className="text-sm text-gray-600">
                      {topic.course} • Phase {topic.phase} • {topic.status}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Rubric Sliders */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Performance Rubric</h2>
          </div>

          <div className="space-y-6">
            {/* Accuracy */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Accuracy</label>
                <span className="text-lg font-bold text-purple-600">{formData.accuracyScore}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.accuracyScore}
                onChange={(e) => setFormData({ ...formData, accuracyScore: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Needs Work</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Fluency */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Fluency</label>
                <span className="text-lg font-bold text-purple-600">{formData.fluencyScore}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.fluencyScore}
                onChange={(e) => setFormData({ ...formData, fluencyScore: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Needs Work</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Confidence</label>
                <span className="text-lg font-bold text-purple-600">{formData.confidenceScore}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.confidenceScore}
                onChange={(e) => setFormData({ ...formData, confidenceScore: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Needs Work</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parent Note */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Note to Parent (Optional)</h2>
          </div>
          <textarea
            value={formData.parentNote}
            onChange={(e) => setFormData({ ...formData, parentNote: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Share specific feedback, recommendations, or practice suggestions for the parent..."
          />
        </div>

        {/* Suggested Next Topic */}
        {suggestedNextTopic && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <LightBulbIcon className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Suggested Next Topic</h3>
                <p className="text-blue-800">{suggestedNextTopic}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/teacher/calendar")}
            disabled={submitting}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-semibold"
          >
            {submitting ? "Saving..." : "Save Post-Class Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
