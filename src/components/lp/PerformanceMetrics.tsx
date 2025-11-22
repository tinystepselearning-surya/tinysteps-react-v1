import type { FC } from 'react';

const PerformanceMetrics: FC = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="text-lg font-medium">Parent Satisfaction Score</h3>
          <p className="text-2xl font-bold">4.5/5</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="text-lg font-medium">Teacher Effectiveness</h3>
          <p className="text-2xl font-bold">4.7/5</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="text-lg font-medium">Student Progress Tracked</h3>
          <p className="text-2xl font-bold">85%</p>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <h3 className="text-lg font-medium">Tickets Resolved</h3>
          <p className="text-2xl font-bold">92%</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;