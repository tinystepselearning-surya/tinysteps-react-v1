import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function ParentLoginTestSimple() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const { signIn, role, user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);
    try {
      await signIn(email, password);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/parent/dashboard";
        setRedirected(true);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4 text-indigo-700">Parent Login Test (Simple)</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded font-semibold"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600">{error}</div>}
        {success && !redirected && (
          <div className="mt-4 text-green-600">
            Login successful!<br />
            Role: {role}<br />
            User: {user?.email}<br />
            Redirecting to dashboard...
          </div>
        )}
      </div>
    </div>
  );
}
