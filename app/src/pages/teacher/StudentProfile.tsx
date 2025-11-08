import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  ClockIcon,
  DocumentTextIcon,
  TrophyIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
// useAuth not required in this view right now
import { addAttendanceRecord, updateCurriculumTopic, seedSampleData } from "../../services/teacherService";
import CurriculumList from "../../components/CurriculumList";
import { useToast } from "../../ui/ToastProvider";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  assignedTeacherId: string;
  enrolledCourses: string[];
}

interface SessionRecord {
  id: string;
  date: string;
  time: string;
  topic: string;
  status: string;
  outcomes?: string;
  rubric?: {
    accuracy: number;
    fluency: number;
    confidence: number;
  };
}

interface CurriculumTopic {
  id: string;
  course: string;
  phase: string;
  title: string;
  status: "not_started" | "in_progress" | "completed";
  completedDate?: string;
  teacherNote?: string;
}

interface GameProgress {
  gameId: string;
  gameName: string;
  masteryLevel: number;
  badges: number;
  totalBadges: number;
  lastPlayed: string;
}

interface Worksheet {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  score?: number;
}

export default function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumTopic[]>([]);
  const [games, setGames] = useState<GameProgress[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "curriculum" | "worksheets" | "games">("timeline");
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState( new Date().toISOString().split('T')[0] );
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | "excused">("present");
  const [seeding, setSeeding] = useState(false);
  // const { user } = useAuth(); // unused in this view for now

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  const { showToast } = useToast();

  const fetchStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);

      // Fetch student details
      const studentDoc = await getDoc(doc(db, "students", studentId));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setStudent({
          id: studentDoc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          age: data.age || 6,
          assignedTeacherId: data.assignedTeacherId,
          enrolledCourses: data.enrolledCourses || [],
        });
      }

      // Fetch session history
      const sessionsRef = collection(db, "sessions");
      const sessionsQuery = query(
        sessionsRef,
        where("studentId", "==", studentId),
        orderBy("scheduledDate", "desc"),
        limit(10)
      );
      
      try {
        const sessionsSnap = await getDocs(sessionsQuery);
        const sessionsList: SessionRecord[] = [];
        sessionsSnap.forEach((doc) => {
          const data = doc.data();
          sessionsList.push({
            id: doc.id,
            date: data.scheduledDate,
            time: data.scheduledTime || "10:00 AM",
            topic: data.topic || data.courseName || "Phonics",
            status: data.status,
            outcomes: data.outcomes,
            rubric: data.rubric,
          });
        });
        setSessions(sessionsList);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        // Mock data for demonstration
        setSessions([
          {
            id: "1",
            date: "2024-11-06",
            time: "10:00 AM",
            topic: "Digraphs - ch, sh, th",
            status: "completed",
            outcomes: "Excellent progress. Mastered 'ch' sound.",
            rubric: { accuracy: 5, fluency: 4, confidence: 5 },
          },
          {
            id: "2",
            date: "2024-11-04",
            time: "10:00 AM",
            topic: "Blending CVC Words",
            status: "completed",
            outcomes: "Good work on blending. Needs practice with 'th'.",
            rubric: { accuracy: 4, fluency: 3, confidence: 4 },
          },
        ]);
      }

      // Fetch curriculum topics
      const curriculumRef = collection(db, `students/${studentId}/curriculum`);
      const curriculumSnap = await getDocs(curriculumRef);
      const curriculumList: CurriculumTopic[] = [];
      curriculumSnap.forEach((doc) => {
        curriculumList.push({
          id: doc.id,
          ...doc.data(),
        } as CurriculumTopic);
      });
      setCurriculum(curriculumList);

      // Mock game progress
      setGames([
        {
          gameId: "spellbee",
          gameName: "Spell Bee",
          masteryLevel: 72,
          badges: 15,
          totalBadges: 20,
          lastPlayed: "2024-11-06",
        },
        {
          gameId: "balloon-pop",
          gameName: "Balloon Pop Phonics",
          masteryLevel: 65,
          badges: 11,
          totalBadges: 15,
          lastPlayed: "2024-11-05",
        },
      ]);

      // Mock worksheets
      setWorksheets([
        {
          id: "1",
          title: "Short Vowels Practice",
          dueDate: "2024-11-10",
          status: "submitted",
          score: 18,
        },
        {
          id: "2",
          title: "Digraphs Worksheet",
          dueDate: "2024-11-12",
          status: "in_progress",
        },
      ]);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "not_started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getMasteryColor = (level: number) => {
    if (level >= 80) return "bg-green-500";
    if (level >= 60) return "bg-blue-500";
    if (level >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const calculateAverageScore = (metric: "accuracy" | "fluency" | "confidence") => {
    const completedSessions = sessions.filter((s) => s.rubric);
    if (completedSessions.length === 0) return "0";
    const sum = completedSessions.reduce((acc, s) => acc + (s.rubric?.[metric] || 0), 0);
    return (sum / completedSessions.length).toFixed(1);
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];
    
    // Based on curriculum progress
    const notStarted = curriculum.filter((t) => t.status === "not_started");
    if (notStarted.length > 0) {
      recommendations.push(`Start "${notStarted[0].title}" in ${notStarted[0].course}`);
    }

    // Based on rubric scores
    const avgAccuracy = parseFloat(calculateAverageScore("accuracy"));
    const avgFluency = parseFloat(calculateAverageScore("fluency"));
    
    if (avgAccuracy < 3.5) {
      recommendations.push("Focus on accuracy with more practice exercises");
    }
    if (avgFluency < 3.5) {
      recommendations.push("Work on fluency through reading aloud sessions");
    }

    // Based on game mastery
    const lowMasteryGames = games.filter((g) => g.masteryLevel < 60);
    if (lowMasteryGames.length > 0) {
      recommendations.push(`Encourage more practice with ${lowMasteryGames[0].gameName}`);
    }

    return recommendations.length > 0 ? recommendations : ["Student is progressing well!"];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading student profile...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Student not found</p>
          <button
            onClick={() => navigate("/teacher/students")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/teacher/students")}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Students
          </button>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 rounded-full p-4">
                  <AcademicCapIcon className="h-12 w-12 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {student.firstName} {student.lastName}
                  </h1>
                  <p className="text-gray-600 mt-1">Age: {student.age} • {student.enrolledCourses.length} courses enrolled</p>
                  <div className="flex gap-2 mt-2">
                    {student.enrolledCourses.map((course) => (
                      <span
                        key={course}
                        className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{sessions.length}</div>
                  <div className="text-xs text-gray-600">Classes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {curriculum.filter((t) => t.status === "completed").length}
                  </div>
                  <div className="text-xs text-gray-600">Topics Done</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {calculateAverageScore("accuracy")}
                  </div>
                  <div className="text-xs text-gray-600">Avg Accuracy</div>
                </div>
              </div>
            </div>
          </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setShowAttendanceModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded">Mark Attendance</button>
                <button onClick={async () => {
                  if (!student) return;
                  if (!confirm('Seed sample attendance and curriculum for this student?')) return;
                  try {
                    setSeeding(true);
                    await seedSampleData(student.id);
                    showToast({ message: 'Sample data seeded. Refreshing view...', type: 'success' });
                    fetchStudentData();
                  } catch (err) {
                    console.error(err);
                    showToast({ message: 'Failed to seed sample data', type: 'error' });
                  } finally { setSeeding(false); }
                }} className="px-3 py-2 bg-green-600 text-white rounded">{seeding ? 'Seeding...' : 'Seed Sample Data'}</button>
              </div>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <LightBulbIcon className="h-6 w-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {getRecommendations().map((rec, index) => (
                  <li key={index} className="text-blue-800 text-sm">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "timeline"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ClockIcon className="h-5 w-5 inline mr-2" />
              Class Timeline
            </button>
            <button
              onClick={() => setActiveTab("curriculum")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "curriculum"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <AcademicCapIcon className="h-5 w-5 inline mr-2" />
              Curriculum Progress
            </button>
            <button
              onClick={() => setActiveTab("worksheets")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "worksheets"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Worksheets
            </button>
            <button
              onClick={() => setActiveTab("games")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "games"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <TrophyIcon className="h-5 w-5 inline mr-2" />
              Games Mastery
            </button>
          </div>
        </div>

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{session.topic}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(session.date).toLocaleDateString()} at {session.time}
                    </p>
                  </div>
                  {session.rubric && (
                    <div className="flex gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-purple-600">{session.rubric.accuracy}/5</div>
                        <div className="text-xs text-gray-600">Accuracy</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{session.rubric.fluency}/5</div>
                        <div className="text-xs text-gray-600">Fluency</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{session.rubric.confidence}/5</div>
                        <div className="text-xs text-gray-600">Confidence</div>
                      </div>
                    </div>
                  )}
                </div>
                {session.outcomes && (
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{session.outcomes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Attendance Modal */}
        {showAttendanceModal && student && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Mark Attendance for {student.firstName}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date</label>
                  <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Status</label>
                  <select value={attendanceStatus} onChange={(e) => setAttendanceStatus(e.target.value as any)} className="w-full border rounded px-3 py-2">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="px-4 py-2 rounded border" onClick={() => setShowAttendanceModal(false)}>Cancel</button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={async () => {
                  try {
                        await addAttendanceRecord(student.id, attendanceDate, attendanceStatus, attendanceStatus === 'present' ? 45 : 0);
                        showToast({ message: 'Attendance recorded', type: 'success' });
                        setShowAttendanceModal(false);
                        fetchStudentData();
                  } catch (err) {
                    console.error(err);
                        showToast({ message: 'Failed to record attendance', type: 'error' });
                  }
                }}>Submit</button>
              </div>
            </div>
          </div>
        )}

        {/* Curriculum Tab */}
        {activeTab === "curriculum" && (
          <div>
            <CurriculumList initial={curriculum.map((c) => ({ id: c.id, course: c.course, phase: c.phase, title: c.title, status: c.status, completedDate: c.completedDate, teacherNote: c.teacherNote }))} onUpdateTopic={async (topicId, payload) => {
              // call service to persist change and refresh parent view
              try {
                await updateCurriculumTopic(student.id, topicId, payload);
                // refresh full student data after change
                fetchStudentData();
              } catch (err) {
                console.error('Failed to persist topic change', err);
                throw err;
              }
            }} />
          </div>
        )}

        {/* Worksheets Tab */}
        {activeTab === "worksheets" && (
          <div className="space-y-4">
            {worksheets.map((worksheet) => (
              <div key={worksheet.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{worksheet.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Due: {new Date(worksheet.dueDate).toLocaleDateString()}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(worksheet.status)}`}>
                        {worksheet.status}
                      </span>
                    </div>
                  </div>
                  {worksheet.score !== undefined && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{worksheet.score}/20</div>
                      <div className="text-xs text-gray-600">Score</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Games Tab */}
        {activeTab === "games" && (
          <div className="space-y-4">
            {games.map((game) => (
              <div key={game.gameId} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{game.gameName}</h3>
                    <p className="text-sm text-gray-600">
                      Last played: {new Date(game.lastPlayed).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {game.badges}/{game.totalBadges}
                    </div>
                    <div className="text-xs text-gray-600">Badges</div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                    <span>Mastery Level</span>
                    <span className="font-semibold">{game.masteryLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getMasteryColor(game.masteryLevel)}`}
                      style={{ width: `${game.masteryLevel}%` }}
                    ></div>
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
