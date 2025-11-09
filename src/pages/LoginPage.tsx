import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { handleLogin } from '../lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract role from URL path or query parameter
  const getExpectedRole = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const roleFromPath = pathSegments[0]; // e.g., 'admin' from '/admin/login'

    // Map path segments to role names
    const pathToRoleMap: Record<string, string> = {
      'admin': 'admin',
      'teacher': 'teacher',
      'parent': 'parent',
      'learningpartner': 'learningPartner',
      'kid': 'kid'
    };

    return pathToRoleMap[roleFromPath] || searchParams.get('role');
  };

  const expectedRole = getExpectedRole();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await handleLogin(email, password, expectedRole || undefined);
      // handleLogin will redirect on success
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If role parameter is specified, show a message
  const getRoleMessage = () => {
    if (!expectedRole) return null;

    const roleNames = {
      parent: 'Parent',
      teacher: 'Teacher',
      learningPartner: 'Learning Partner',
      admin: 'Administrator',
      kid: 'Kid'
    };

    return `Please log in with your ${roleNames[expectedRole as keyof typeof roleNames] || expectedRole} credentials.`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        {expectedRole && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
            {getRoleMessage()}
          </div>
        )}
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 border rounded"
            required
            aria-label="email"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
            required
            aria-label="password"
          />
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 text-white'}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}