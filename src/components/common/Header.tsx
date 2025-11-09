import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';

export default function Header() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    clearUser();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Tiny Steps Learning</h1>
        
        <div className="flex items-center gap-4">
          {!user && (
            <>
              <Link to="/login" className="rounded-xl bg-blue-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-blue-700">Parent Portal</Link>
              <Link to="/login" className="rounded-xl bg-green-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-green-700">Teacher Portal</Link>
              <Link to="/login" className="rounded-xl bg-purple-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-purple-700">Learning Partner Portal</Link>
            </>
          )}
          {user && (
            <>
              <Link to={`/${user.role}`} className="text-blue-600 hover:underline">Dashboard</Link>
              <span className="text-sm text-gray-600">{user.displayName} ({user.role})</span>
              <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}