import React from 'react';

export default function LPDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Learning Partner Hub</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded shadow">
          <h2 className="font-semibold mb-4">My Families</h2>
          <p className="text-gray-600">0 families assigned</p>
        </div>
        
        <div className="p-6 bg-white rounded shadow">
          <h2 className="font-semibold mb-4">Dues This Week</h2>
          <p className="text-gray-600">₹0 due</p>
        </div>
      </div>
    </div>
  );
}