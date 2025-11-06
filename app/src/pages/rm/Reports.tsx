import { DocumentTextIcon } from "@heroicons/react/24/outline";

export default function RMReports() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <DocumentTextIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports & Exports</h2>
        <p className="text-gray-600 mb-4">
          Generate and download detailed reports
        </p>
        <p className="text-sm text-gray-500">
          This page will provide monthly reports, custom date ranges, CSV exports, and scheduled report delivery.
        </p>
      </div>
    </div>
  );
}
