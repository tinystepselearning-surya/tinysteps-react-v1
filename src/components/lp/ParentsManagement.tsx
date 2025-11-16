import React from 'react';

const ParentsManagement = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Parents Management</h2>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Children Count</th>
            <th className="px-4 py-2">Contact</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2" colSpan={4}>
              <div className="text-sm text-gray-500 p-2">No parents found. This list will display parent records when available.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ParentsManagement;