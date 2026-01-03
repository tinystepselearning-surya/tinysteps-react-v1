import React from 'react';
import { Link } from 'react-router-dom';

const CourseTopbar: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div>
          <nav className="text-sm text-gray-600">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-gray-900">{title}</span>
          </nav>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div>
          <Link to="/?book=1" className="inline-block px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm">Book a Trial</Link>
        </div>
      </div>
    </div>
  );
};

export default CourseTopbar;
