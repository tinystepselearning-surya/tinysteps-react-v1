import React from 'react';

const TeachersManagement = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Teachers Management</h2>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Specializations</th>
            <th className="px-4 py-2">Performance Rating</th>
            <th className="px-4 py-2">Students Count</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2" colSpan={5}>
              <div className="text-sm text-gray-500 p-2">No teachers found. This list will populate after connecting teacher accounts.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TeachersManagement;