import { BookOpenIcon } from "@heroicons/react/24/outline";

export default function TeacherResources() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <BookOpenIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Teaching Resources</h2>
        <p className="text-gray-600 mb-4">
          Lesson plans, worksheets, and teaching materials coming soon
        </p>
        <p className="text-sm text-gray-500">
          This page will provide access to curriculum materials, teaching guides, and downloadable resources.
        </p>
      </div>
    </div>
  );
}
