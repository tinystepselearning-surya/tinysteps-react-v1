import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LearningPartnerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      console.log("[LearningPartnerLogin] signIn success, navigating to /rm/dashboard");
      // Redirect to learning partner dashboard
      navigate("/rm/dashboard", { replace: true });
    } catch (err: unknown) {
      console.error("[LearningPartnerLogin] Login error:", err);
      let errorMessage = "Login failed. Please try again";
      
      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code: string };
        // User-friendly error messages
        if (firebaseError.code === "auth/wrong-password" || firebaseError.code === "auth/invalid-credential") {
          errorMessage = "Invalid email or password";
        } else if (firebaseError.code === "auth/user-not-found") {
          errorMessage = "No account found with this email";
        } else if (firebaseError.code === "auth/invalid-email") {
          errorMessage = "Please enter a valid email address";
        } else if (firebaseError.code === "auth/too-many-requests") {
          errorMessage = "Too many failed attempts. Please try again later";
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            Learning Partner Login
          </h1>
          <p className="text-gray-600">
            Sign in to manage your teachers and students
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="partner@example.com"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-indigo-600 hover:text-indigo-700">
              ← Back to Home
            </a>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need help? Contact Tiny Steps admin</p>
        </div>
      </div>
    </div>
  );
}