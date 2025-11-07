import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  DocumentTextIcon,
  TrophyIcon,
  FireIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlayIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface Worksheet {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "not_started" | "in_progress" | "submitted" | "graded";
  score?: number;
  maxScore?: number;
  assignedBy: string;
  assignedAt: any;
  submittedAt?: any;
  feedback?: string;
  worksheetUrl?: string;
}

interface GameAchievement {
  gameId: string;
  gameName: string;
  badges: number;
  totalBadges: number;
  currentStreak: number;
  longestStreak: number;
  totalMinutes: number;
  lastPlayedAt: any;
  masteryLevel: number; // 0-100
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

const ParentWorksheets: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [gameAchievements, setGameAchievements] = useState<GameAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"worksheets" | "games">("worksheets");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (childId) {
      fetchData();
    }
  }, [childId]);

  const fetchData = async () => {
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

      // Fetch worksheets assigned to this student
      const assignmentsRef = collection(db, "assignments");
      const assignmentsQuery = query(
        assignmentsRef,
        where("studentIds", "array-contains", childId)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);

      const worksheetsList: Worksheet[] = [];
      assignmentsSnap.forEach((doc) => {
        const data = doc.data();
        worksheetsList.push({
          id: doc.id,
          title: data.title || "Untitled Worksheet",
          subject: data.subject || "General",
          dueDate: data.dueDate || "",
          status: data.status || "not_started",
          score: data.score,
          maxScore: data.maxScore,
          assignedBy: data.assignedBy || "",
          assignedAt: data.assignedAt,
          submittedAt: data.submittedAt,
          feedback: data.feedback,
          worksheetUrl: data.worksheetUrl,
        });
      });

      setWorksheets(worksheetsList);

      // Fetch game achievements (mock data for now - would come from /students/{sid}/game_progress)
      const mockGameAchievements: GameAchievement[] = [
        {
          gameId: "spellbee",
          gameName: "Spell Bee",
          badges: 12,
          totalBadges: 20,
          currentStreak: 5,
          longestStreak: 8,
          totalMinutes: 145,
          lastPlayedAt: new Date(),
          masteryLevel: 60,
        },
        {
          gameId: "balloon-pop",
          gameName: "Balloon Pop Phonics",
          badges: 8,
          totalBadges: 15,
          currentStreak: 3,
          longestStreak: 6,
          totalMinutes: 98,
          lastPlayedAt: new Date(Date.now() - 86400000),
          masteryLevel: 53,
        },
        {
          gameId: "meaning-match",
          gameName: "Meaning Match",
          badges: 15,
          totalBadges: 25,
          currentStreak: 7,
          longestStreak: 10,
          totalMinutes: 203,
          lastPlayedAt: new Date(Date.now() - 172800000),
          masteryLevel: 75,
        },
      ];

      setGameAchievements(mockGameAchievements);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "graded":
        return "bg-green-100 text-green-800 border-green-500";
      case "submitted":
        return "bg-blue-100 text-blue-800 border-blue-500";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-500";
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-500";
      default:
        return "bg-gray-100 text-gray-800 border-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "submitted":
        return <ClockIcon className="h-4 w-4" />;
      case "in_progress":
        return <ExclamationCircleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getMasteryColor = (level: number) => {
    if (level >= 80) return "bg-green-500";
    if (level >= 60) return "bg-blue-500";
    if (level >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const filteredWorksheets = worksheets.filter((ws) => {
    if (filterStatus === "all") return true;
    return ws.status === filterStatus;
  });

  const worksheetStats = {
    total: worksheets.length,
    notStarted: worksheets.filter((w) => w.status === "not_started").length,
    inProgress: worksheets.filter((w) => w.status === "in_progress").length,
    submitted: worksheets.filter((w) => w.status === "submitted").length,
    graded: worksheets.filter((w) => w.status === "graded").length,
  };

  const gameStats = {
    totalBadges: gameAchievements.reduce((sum, g) => sum + g.badges, 0),
    totalMinutesLast7Days: gameAchievements.reduce((sum, g) => {
      const daysSinceLastPlayed = Math.floor(
        (Date.now() - new Date(g.lastPlayedAt).getTime()) / 86400000
      );
      return daysSinceLastPlayed <= 7 ? sum + g.totalMinutes : sum;
    }, 0),
    longestStreak: Math.max(...gameAchievements.map((g) => g.longestStreak)),
    averageMastery: Math.round(
      gameAchievements.reduce((sum, g) => sum + g.masteryLevel, 0) / gameAchievements.length
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading worksheets and games...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Learning Activities - {student?.firstName} {student?.lastName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Track worksheets, assignments, and game achievements
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("worksheets")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "worksheets"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Worksheets & Assignments
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
              Games & Achievements
            </button>
          </div>
        </div>

        {/* Worksheets Tab */}
        {activeTab === "worksheets" && (
          <>
            {/* Worksheet Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">Total Assigned</div>
                <div className="text-2xl font-bold text-purple-600">{worksheetStats.total}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">Not Started</div>
                <div className="text-2xl font-bold text-gray-600">{worksheetStats.notStarted}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">In Progress</div>
                <div className="text-2xl font-bold text-yellow-600">{worksheetStats.inProgress}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">Submitted</div>
                <div className="text-2xl font-bold text-blue-600">{worksheetStats.submitted}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">Graded</div>
                <div className="text-2xl font-bold text-green-600">{worksheetStats.graded}</div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Worksheets</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
              </select>
            </div>

            {/* Worksheets List */}
            <div className="space-y-4">
              {filteredWorksheets.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No worksheets found for this filter.</p>
                </div>
              ) : (
                filteredWorksheets.map((worksheet) => (
                  <div key={worksheet.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{worksheet.title}</h3>
                          <div
                            className={`flex items-center gap-1 px-3 py-1 rounded border text-xs font-medium ${getStatusColor(
                              worksheet.status
                            )}`}
                          >
                            {getStatusIcon(worksheet.status)}
                            <span className="capitalize">{worksheet.status.replace("_", " ")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium text-purple-600">{worksheet.subject}</span>
                          {worksheet.dueDate && (
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              Due: {new Date(worksheet.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {worksheet.status === "graded" && worksheet.score !== undefined && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {worksheet.score}/{worksheet.maxScore}
                          </div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                      )}
                    </div>

                    {worksheet.feedback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="text-xs font-semibold text-blue-900 mb-1">Teacher Feedback</div>
                        <p className="text-sm text-blue-800">{worksheet.feedback}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {worksheet.submittedAt ? (
                          <span>Submitted: {new Date(worksheet.submittedAt.toDate()).toLocaleDateString()}</span>
                        ) : (
                          <span>Assigned: {new Date(worksheet.assignedAt.toDate()).toLocaleDateString()}</span>
                        )}
                      </div>

                      {worksheet.worksheetUrl && (
                        <a
                          href={worksheet.worksheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Open Worksheet
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Games Tab */}
        {activeTab === "games" && (
          <>
            {/* Game Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrophyIcon className="h-5 w-5 text-yellow-500" />
                  <div className="text-sm text-gray-600">Total Badges</div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{gameStats.totalBadges}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FireIcon className="h-5 w-5 text-orange-500" />
                  <div className="text-sm text-gray-600">Longest Streak</div>
                </div>
                <div className="text-2xl font-bold text-orange-600">{gameStats.longestStreak} days</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                  <div className="text-sm text-gray-600">Last 7 Days</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{gameStats.totalMinutesLast7Days} min</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ChartBarIcon className="h-5 w-5 text-purple-500" />
                  <div className="text-sm text-gray-600">Avg Mastery</div>
                </div>
                <div className="text-2xl font-bold text-purple-600">{gameStats.averageMastery}%</div>
              </div>
            </div>

            {/* Games List */}
            <div className="space-y-4">
              {gameAchievements.map((game) => (
                <div key={game.gameId} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{game.gameName}</h3>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <TrophyIcon className="h-4 w-4 text-yellow-500" />
                          <span>
                            {game.badges}/{game.totalBadges} badges
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FireIcon className="h-4 w-4 text-orange-500" />
                          <span>{game.currentStreak} day streak</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-blue-500" />
                          <span>{game.totalMinutes} min total</span>
                        </div>
                      </div>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                      <PlayIcon className="h-4 w-4" />
                      Play Now
                    </button>
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Mastery Level</span>
                      <span className="font-semibold">{game.masteryLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getMasteryColor(game.masteryLevel)}`}
                        style={{ width: `${game.masteryLevel}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Last played: {new Date(game.lastPlayedAt).toLocaleDateString()} at{" "}
                    {new Date(game.lastPlayedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ParentWorksheets;
