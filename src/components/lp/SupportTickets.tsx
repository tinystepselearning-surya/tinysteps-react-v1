import React from 'react';

const SupportTickets = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Support Tickets</h2>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">Ticket ID</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Priority</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2">Updated</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">#12345</td>
            <td className="border px-4 py-2">Open</td>
            <td className="border px-4 py-2">High</td>
            <td className="border px-4 py-2">2025-11-10</td>
            <td className="border px-4 py-2">2025-11-12</td>
            <td className="border px-4 py-2">
              <button className="bg-blue-500 text-white px-2 py-1 rounded">View</button>
              <button className="bg-green-500 text-white px-2 py-1 rounded ml-2">Assign</button>
            </td>
          </tr>
          {/* Add more rows dynamically */}
        </tbody>
      </table>
    </div>
  );
};

export default SupportTickets;