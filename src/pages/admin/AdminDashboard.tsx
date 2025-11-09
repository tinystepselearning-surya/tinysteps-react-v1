import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded shadow">
          <h2 className="font-semibold mb-2">User Management</h2>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded">Create User</button>
        </div>
        
        <div className="p-6 bg-white rounded shadow">
          <h2 className="font-semibold mb-2">Analytics</h2>
          <div className="text-2xl font-bold">0</div>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>
        
        <div className="p-6 bg-white rounded shadow">
          <h2 className="font-semibold mb-2">System Status</h2>
          <p className="text-green-600 font-semibold">Online</p>
        </div>
      </div>
    </div>
  );
}