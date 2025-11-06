import { CalendarDaysIcon } from "@heroicons/react/24/outline";

export default function TeacherCalendar() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <CalendarDaysIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calendar View</h2>
        <p className="text-gray-600 mb-4">
          Interactive calendar with session scheduling coming soon
        </p>
        <p className="text-sm text-gray-500">
          This page will show your schedule in month, week, and day views with drag-and-drop session management.
        </p>
      </div>
    </div>
  );
}
