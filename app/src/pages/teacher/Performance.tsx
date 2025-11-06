import { ChartBarIcon } from "@heroicons/react/24/outline";

export default function TeacherPerformance() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <ChartBarIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Performance Analytics</h2>
        <p className="text-gray-600 mb-4">
          Track your teaching metrics and student outcomes
        </p>
        <p className="text-sm text-gray-500">
          This page will show completion rates, student progress trends, earnings reports, and feedback ratings.
        </p>
      </div>
    </div>
  );
}
