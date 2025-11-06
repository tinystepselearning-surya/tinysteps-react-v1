import { ChartBarIcon } from "@heroicons/react/24/outline";

export default function RMAnalytics() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <ChartBarIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600 mb-4">
          Comprehensive analytics and insights coming soon
        </p>
        <p className="text-sm text-gray-500">
          This page will display student progress trends, teacher performance metrics, revenue analysis, and retention rates.
        </p>
      </div>
    </div>
  );
}
