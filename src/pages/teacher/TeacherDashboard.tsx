import React from 'react';

export default function TeacherDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded shadow">
          <h2 className="font-semibold mb-4">Today's Sessions</h2>
          <p className="text-gray-600">No sessions today</p>
        </div>
        
        <div className="p-6 bg-white rounded shadow">
          <h2 className="font-semibold mb-4">My Students</h2>
          <p className="text-gray-600">Loading...</p>
        </div>
        
        <div className="p-6 bg-white rounded shadow">
          <h2 className="font-semibold mb-4">Earnings (This Month)</h2>
          <div className="text-3xl font-bold">₹0</div>
        </div>
      </div>
    </div>
  );
}