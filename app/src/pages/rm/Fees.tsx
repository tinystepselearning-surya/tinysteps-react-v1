import { BanknotesIcon } from "@heroicons/react/24/outline";

export default function RMFees() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <BanknotesIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fee Management</h2>
        <p className="text-gray-600 mb-4">
          Payment tracking, invoicing, and revenue reports coming soon
        </p>
        <p className="text-sm text-gray-500">
          This page will show payment status, overdue fees, collection reports, and invoice generation.
        </p>
      </div>
    </div>
  );
}
