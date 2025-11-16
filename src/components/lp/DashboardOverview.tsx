import React from 'react';

const DashboardOverview = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="text-lg font-medium">Assigned Parents</h3>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="text-lg font-medium">Assigned Teachers</h3>
          <p className="text-2xl font-bold">8</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="text-lg font-medium">Active Sessions This Week</h3>
          <p className="text-2xl font-bold">24</p>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <h3 className="text-lg font-medium">Tickets Pending</h3>
          <p className="text-2xl font-bold">5</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;