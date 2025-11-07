import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  VideoCameraIcon,
  ClockIcon,
  XMarkIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

type ViewMode = "month" | "week" | "day";

interface Session {
  id: string;
  studentName: string;
  studentId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  meetingLink?: string;
  topic: string;
}

export default function TeacherCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Mock sessions data
  const sessions: Session[] = [
    {
      id: "1",
      studentName: "Aarav Kumar",
      studentId: "s1",
      date: new Date(2025, 10, 10, 10, 0),
      startTime: "10:00 AM",
      endTime: "10:35 AM",
      duration: 35,
      status: "scheduled",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      topic: "Phonics - Digraphs"
    },
    {
      id: "2",
      studentName: "Kavya Sharma",
      studentId: "s2",
      date: new Date(2025, 10, 10, 14, 0),
      startTime: "2:00 PM",
      endTime: "2:35 PM",
      duration: 35,
      status: "scheduled",
      meetingLink: "https://meet.google.com/xyz-uvwx-rst",
      topic: "Grammar - Punctuation"
    },
    {
      id: "3",
      studentName: "Riya Patel",
      studentId: "s3",
      date: new Date(2025, 10, 12, 16, 0),
      startTime: "4:00 PM",
      endTime: "4:35 PM",
      duration: 35,
      status: "scheduled",
      meetingLink: "https://meet.google.com/lmn-opqr-stu",
      topic: "Reading Comprehension"
    },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => 
      session.date.getDate() === date.getDate() &&
      session.date.getMonth() === date.getMonth() &&
      session.date.getFullYear() === date.getFullYear()
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === "month") {
        newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      } else if (viewMode === "week") {
        newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      } else {
        newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1));
      }
      return newDate;
    });
  };

  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - day);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour}:00`);
    }
    return slots;
  };

  const getSessionsForTimeSlot = (date: Date, timeSlot: string) => {
    return sessions.filter(session => {
      const sessionHour = parseInt(session.startTime.split(":")[0]);
      const slotHour = parseInt(timeSlot.split(":")[0]);
      
      return (
        session.date.getDate() === date.getDate() &&
        session.date.getMonth() === date.getMonth() &&
        session.date.getFullYear() === date.getFullYear() &&
        sessionHour === slotHour
      );
    });
  };

  const formatWeekRange = () => {
    const weekDates = getWeekDates(currentDate);
    const start = weekDates[0];
    const end = weekDates[6];
    return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  };

  const formatDayHeader = () => {
    return `${dayNames[currentDate.getDay()]}, ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const handleJoinSession = (session: Session) => {
    if (session.meetingLink) {
      window.open(session.meetingLink, "_blank");
    }
  };

  const handleReschedule = (session: Session) => {
    alert(`Reschedule session with ${session.studentName}\nFeature coming soon!`);
  };

  const handleCancel = (session: Session) => {
    if (confirm(`Cancel session with ${session.studentName}?`)) {
      alert("Session cancelled. Notification sent to student and parent.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Calendar</h1>
          <p className="text-gray-600 mt-1">Manage your teaching schedule</p>
        </div>
        
        {/* View Mode Toggles */}
        <div className="flex gap-2 bg-white rounded-lg shadow p-1">
          <button
            onClick={() => setViewMode("month")}
            className={`px-4 py-2 rounded ${viewMode === "month" ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-2 rounded ${viewMode === "week" ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-4 py-2 rounded ${viewMode === "day" ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-bold text-gray-900">
            {viewMode === "month" && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {viewMode === "week" && formatWeekRange()}
            {viewMode === "day" && formatDayHeader()}
          </h2>
          
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        {viewMode === "month" && (
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month starts */}
            {[...Array(startingDayOfWeek)].map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50 rounded-lg p-2 min-h-[100px]" />
            ))}
            
            {/* Days of month */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const daySessions = getSessionsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={day}
                  className={`border rounded-lg p-2 min-h-[100px] ${
                    isToday ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
                  } hover:shadow-md transition cursor-pointer`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? "text-green-700" : "text-gray-700"}`}>
                    {day}
                  </div>
                  
                  <div className="space-y-1">
                    {daySessions.map(session => (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className="text-xs bg-green-100 text-green-800 rounded px-2 py-1 hover:bg-green-200 transition"
                      >
                        <div className="font-semibold truncate">{session.startTime}</div>
                        <div className="truncate">{session.studentName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Week Headers */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-sm font-semibold text-gray-600 py-2"></div>
                {getWeekDates(currentDate).map((date, idx) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={idx}
                      className={`text-center py-2 rounded-lg ${
                        isToday ? "bg-green-100 text-green-700 font-bold" : "text-gray-700"
                      }`}
                    >
                      <div className="text-xs font-medium">{dayNames[date.getDay()]}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* Time Slots Grid */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {getTimeSlots().map((timeSlot, slotIdx) => (
                  <div key={slotIdx} className="grid grid-cols-8 gap-px bg-gray-200">
                    {/* Time Label */}
                    <div className="bg-gray-50 p-2 text-sm font-medium text-gray-600 flex items-center justify-center">
                      {timeSlot}
                    </div>

                    {/* Day Cells */}
                    {getWeekDates(currentDate).map((date, dayIdx) => {
                      const sessionsInSlot = getSessionsForTimeSlot(date, timeSlot);
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={dayIdx}
                          className={`bg-white p-1 min-h-[60px] ${
                            isToday ? "bg-green-50" : ""
                          } hover:bg-gray-50 transition cursor-pointer`}
                        >
                          {sessionsInSlot.map(session => (
                            <div
                              key={session.id}
                              onClick={() => setSelectedSession(session)}
                              className={`text-xs rounded px-2 py-1 mb-1 ${
                                session.status === "scheduled"
                                  ? "bg-green-100 text-green-800 border border-green-300"
                                  : session.status === "completed"
                                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                                  : "bg-red-100 text-red-800 border border-red-300"
                              } hover:shadow-md transition`}
                            >
                              <div className="font-semibold truncate">{session.studentName}</div>
                              <div className="truncate text-xs opacity-75">{session.topic}</div>
                              <div className="text-xs opacity-60">{session.duration}min</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === "day" && (
          <div className="max-w-4xl mx-auto">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Generate 30-minute intervals from 8 AM to 8 PM */}
              {Array.from({ length: 25 }, (_, i) => {
                const hour = Math.floor(i / 2) + 8;
                const minute = i % 2 === 0 ? "00" : "30";
                const displayTime = hour > 12 
                  ? `${hour - 12}:${minute} PM` 
                  : hour === 12 
                  ? `12:${minute} PM`
                  : `${hour}:${minute} AM`;

                // Find sessions in this time slot
                const sessionsInSlot = sessions.filter(session => {
                  const sessionStart = session.startTime;
                  const sessionHour = parseInt(sessionStart.split(":")[0]);
                  const sessionMinute = parseInt(sessionStart.split(":")[1].split(" ")[0]);
                  
                  const slotHour = hour;
                  const slotMinute = parseInt(minute);
                  
                  const isSameDay = 
                    session.date.getDate() === currentDate.getDate() &&
                    session.date.getMonth() === currentDate.getMonth() &&
                    session.date.getFullYear() === currentDate.getFullYear();
                  
                  const sessionStartsInSlot = 
                    sessionHour === slotHour && 
                    sessionMinute >= slotMinute && 
                    sessionMinute < slotMinute + 30;
                  
                  return isSameDay && sessionStartsInSlot;
                });

                return (
                  <div key={i} className="grid grid-cols-12 border-b border-gray-200 hover:bg-gray-50 transition">
                    {/* Time Label */}
                    <div className="col-span-2 bg-gray-50 p-3 border-r border-gray-200">
                      <div className="text-sm font-medium text-gray-700">{displayTime}</div>
                    </div>

                    {/* Session Content */}
                    <div className="col-span-10 p-2 min-h-[60px]">
                      {sessionsInSlot.length > 0 ? (
                        sessionsInSlot.map(session => (
                          <div
                            key={session.id}
                            onClick={() => setSelectedSession(session)}
                            className={`p-3 rounded-lg border-l-4 mb-2 cursor-pointer hover:shadow-md transition ${
                              session.status === "scheduled"
                                ? "bg-green-50 border-green-500"
                                : session.status === "completed"
                                ? "bg-blue-50 border-blue-500"
                                : "bg-red-50 border-red-500"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900">{session.studentName}</h4>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    session.status === "scheduled"
                                      ? "bg-green-100 text-green-700"
                                      : session.status === "completed"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-red-100 text-red-700"
                                  }`}>
                                    {session.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{session.topic}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="h-4 w-4" />
                                    {session.startTime} - {session.endTime} ({session.duration}min)
                                  </span>
                                  {session.meetingLink && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleJoinSession(session);
                                      }}
                                      className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                                    >
                                      <VideoCameraIcon className="h-4 w-4" />
                                      Join
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                          {/* Empty slot */}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Session Details</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Student</label>
                <p className="font-semibold text-gray-900">{selectedSession.studentName}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Topic</label>
                <p className="font-semibold text-gray-900">{selectedSession.topic}</p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Date</label>
                  <p className="font-semibold text-gray-900">
                    {selectedSession.date.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Time</label>
                  <p className="font-semibold text-gray-900">
                    {selectedSession.startTime} - {selectedSession.endTime}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedSession.status === "scheduled" ? "bg-green-100 text-green-800" :
                  selectedSession.status === "completed" ? "bg-blue-100 text-blue-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {selectedSession.status}
                </span>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => handleJoinSession(selectedSession)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <VideoCameraIcon className="h-5 w-5" />
                  Join Session
                </button>
                {selectedSession.status === "scheduled" && (
                  <button
                    onClick={() => navigate(`/teacher/session/${selectedSession.id}/post-class`)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Complete Class
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReschedule(selectedSession)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => handleCancel(selectedSession)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
