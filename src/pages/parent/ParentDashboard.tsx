import React from 'react';

export default function ParentDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Children</h1>
      
      <div className="mb-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded mr-2">Child 1</button>
        <button className="px-4 py-2 bg-gray-200 rounded">Child 2</button>
      </div>
      
      <div className="p-6 bg-white rounded shadow">
        <h2 className="font-semibold mb-4">Progress Summary</h2>
        <div className="space-y-2">
          <p>Phonics Mastery: 75%</p>
          <p>Attendance: 95%</p>
          <p>Sessions This Month: 8</p>
        </div>
      </div>
    </div>
  );
}