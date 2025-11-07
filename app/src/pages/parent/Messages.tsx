import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import {
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  TicketIcon,
  BellIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface TeacherNote {
  id: string;
  studentId: string;
  studentName: string;
  teacherName: string;
  sessionDate: string;
  note: string;
  sentiment: "positive" | "neutral" | "concern";
  createdAt: any;
}

interface ClassRecording {
  id: string;
  studentId: string;
  studentName: string;
  sessionDate: string;
  duration: number;
  recordingUrl: string;
  thumbnailUrl?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: any;
  lastMessage?: string;
  unreadCount?: number;
}

export default function Messages() {
  const { user } = useAuth();
  const [teacherNotes, setTeacherNotes] = useState<TeacherNote[]>([]);
  const [recordings, setRecordings] = useState<ClassRecording[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"notes" | "recordings" | "tickets">("notes");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
  });
  const [submitting, setSubmitting] = useState(false);
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Mock teacher notes - would come from sessions or a messages collection
      const mockNotes: TeacherNote[] = [
        {
          id: "1",
          studentId: "student1",
          studentName: "Emma",
          teacherName: "Ms. Sarah",
          sessionDate: "2024-11-06",
          note: "Emma did excellent work today! She mastered the 'ch' sound and completed all phonics exercises with 95% accuracy. Very focused and engaged throughout the class.",
          sentiment: "positive",
          createdAt: new Date("2024-11-06T15:30:00"),
        },
        {
          id: "2",
          studentId: "student1",
          studentName: "Emma",
          teacherName: "Ms. Sarah",
          sessionDate: "2024-11-04",
          note: "Good progress on blending CVC words. Emma needs a bit more practice with 'th' digraphs. Recommend extra practice using the Balloon Pop game.",
          sentiment: "neutral",
          createdAt: new Date("2024-11-04T15:30:00"),
        },
        {
          id: "3",
          studentId: "student1",
          studentName: "Emma",
          teacherName: "Ms. Sarah",
          sessionDate: "2024-11-01",
          note: "Emma seemed a little distracted today. We covered short vowels but she had difficulty concentrating. Please ensure she's well-rested before class.",
          sentiment: "concern",
          createdAt: new Date("2024-11-01T15:30:00"),
        },
      ];
      setTeacherNotes(mockNotes);

      // Mock class recordings
      const mockRecordings: ClassRecording[] = [
        {
          id: "1",
          studentId: "student1",
          studentName: "Emma",
          sessionDate: "2024-11-06",
          duration: 28,
          recordingUrl: "https://example.com/recording1.mp4",
        },
        {
          id: "2",
          studentId: "student1",
          studentName: "Emma",
          sessionDate: "2024-11-04",
          duration: 30,
          recordingUrl: "https://example.com/recording2.mp4",
        },
      ];
      setRecordings(mockRecordings);

      // Fetch support tickets
      const ticketsRef = collection(db, "tickets");
      const ticketsQuery = query(
        ticketsRef,
        where("createdBy", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      
      try {
        const ticketsSnap = await getDocs(ticketsQuery);
        const ticketsList: SupportTicket[] = [];
        ticketsSnap.forEach((doc) => {
          const data = doc.data();
          ticketsList.push({
            id: doc.id,
            subject: data.subject || data.type || "Support Request",
            status: data.status || "open",
            priority: data.priority || "medium",
            createdAt: data.createdAt,
            lastMessage: data.lastMessage,
            unreadCount: data.unreadCount || 0,
          });
        });
        setTickets(ticketsList);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description || !user?.uid) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(db, "tickets"), {
        type: "support",
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority,
        status: "open",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

      alert("Support ticket created successfully! Our team will respond soon.");
      setShowNewTicketModal(false);
      setNewTicket({ subject: "", description: "", priority: "medium" });
      fetchMessages(); // Refresh
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "border-l-4 border-green-500 bg-green-50";
      case "concern":
        return "border-l-4 border-orange-500 bg-orange-50";
      default:
        return "border-l-4 border-blue-500 bg-blue-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-800 border-green-500";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-500";
      case "open":
        return "bg-yellow-100 text-yellow-800 border-yellow-500";
      default:
        return "bg-gray-100 text-gray-800 border-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages & Feedback</h1>
          <p className="text-gray-600 mt-1">Teacher notes, class recordings, and support</p>
        </div>
        <button
          onClick={() => setShowNewTicketModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Support Ticket
        </button>
      </div>

      {/* Weekly Digest Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellIcon className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Digest Email</h3>
              <p className="text-sm text-gray-600">Receive a weekly summary of your child's progress</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={weeklyDigestEnabled}
              onChange={(e) => setWeeklyDigestEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "notes"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 inline mr-2" />
            Teacher Notes ({teacherNotes.length})
          </button>
          <button
            onClick={() => setActiveTab("recordings")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "recordings"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <VideoCameraIcon className="h-5 w-5 inline mr-2" />
            Class Recordings ({recordings.length})
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "tickets"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <TicketIcon className="h-5 w-5 inline mr-2" />
            Support Tickets ({tickets.length})
          </button>
        </div>
      </div>

      {/* Teacher Notes Tab */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {teacherNotes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No teacher notes yet</p>
            </div>
          ) : (
            teacherNotes.map((note) => (
              <div key={note.id} className={`bg-white rounded-lg shadow-sm p-6 ${getSentimentColor(note.sentiment)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{note.studentName}'s Class</h3>
                      <span className="text-sm text-gray-600">
                        {new Date(note.sessionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Teacher: {note.teacherName}</p>
                  </div>
                  {note.sentiment === "positive" && (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  )}
                  {note.sentiment === "concern" && (
                    <ClockIcon className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                <p className="text-gray-800 leading-relaxed">{note.note}</p>
                <div className="mt-3 text-xs text-gray-500">
                  Posted: {new Date(note.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Class Recordings Tab */}
      {activeTab === "recordings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recordings.length === 0 ? (
            <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
              <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No class recordings available</p>
            </div>
          ) : (
            recordings.map((recording) => (
              <div key={recording.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 rounded-lg p-3">
                    <VideoCameraIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{recording.studentName}'s Class</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(recording.sessionDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">{recording.duration} minutes</p>
                    <a
                      href={recording.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <VideoCameraIcon className="h-4 w-4" />
                      Watch Recording
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Support Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No support tickets yet</p>
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Your First Ticket
              </button>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded border text-xs font-medium ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        <span className="capitalize">{ticket.status.replace("_", " ")}</span>
                      </div>
                      {ticket.unreadCount && ticket.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {ticket.unreadCount} new
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                      Priority: {ticket.priority.toUpperCase()}
                    </p>
                  </div>
                </div>
                {ticket.lastMessage && (
                  <p className="text-sm text-gray-600 mb-3">Last message: {ticket.lastMessage}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(ticket.createdAt.toDate()).toLocaleDateString()}
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Support Ticket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, priority: e.target.value as "low" | "medium" | "high" })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Detailed description of your concern or question..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewTicketModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

