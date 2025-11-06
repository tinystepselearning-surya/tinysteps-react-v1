
import { useState, type FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthClaims {
  [key: string]: any;
}

export default function ParentLoginTest() {
  const [email, setEmail] = useState('parentv1@tinysteps.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    user: any | null;
    claims: AuthClaims | null;
    firestoreDoc: any | null;
  } | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // 1. Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Get the ID token result to inspect claims
      const idTokenResult = await user.getIdTokenResult(true); // Force refresh
      const claims = idTokenResult.claims;

      // 3. Get the user document from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const firestoreDoc = userDocSnap.exists() ? userDocSnap.data() : { error: 'Document does not exist in /users collection!' };

      setDebugInfo({
        user,
        claims,
        firestoreDoc,
      });

    } catch (err: any) {
      setError(`Login Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderObject = (obj: any) => {
    return (
      <pre className="bg-gray-900 p-4 rounded-lg text-sm text-left overflow-auto">
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-sky-400 mb-2">Parent Login Diagnostic</h1>
        <p className="text-center text-gray-400 mb-8">
          This page will help us understand why login is failing by showing the exact data returned by Firebase.
        </p>

        {!debugInfo ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-sky-500"
                placeholder="parentv1@tinysteps.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Diagnosing...' : 'Sign In & Diagnose'}
            </button>
            {error && <p className="text-red-400 text-center">{error}</p>}
          </form>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-400">✅ Login Successful! Here's the data:</h2>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-sky-300">1. Authentication Token Claims</h3>
              <p className="text-sm text-gray-400 mb-2">This is the most important part. It's what Firebase Security Rules and our app use to check your role. We are looking for <code className="bg-gray-700 p-1 rounded">"role": "parent"</code>.</p>
              {renderObject(debugInfo.claims)}
              {debugInfo.claims?.role === 'parent' ? (
                 <p className="mt-2 text-green-400 font-bold">✅ Role claim is correct!</p>
              ) : (
                 <p className="mt-2 text-red-400 font-bold">❌ CRITICAL: Role claim is MISSING or INCORRECT!</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-sky-300">2. Firestore User Document</h3>
              <p className="text-sm text-gray-400 mb-2">This is the user's profile data from the <code className="bg-gray-700 p-1 rounded">/users/{debugInfo.user?.uid}</code> document. It should also contain <code className="bg-gray-700 p-1 rounded">"role": "parent"</code>.</p>
              {renderObject(debugInfo.firestoreDoc)}
               {debugInfo.firestoreDoc?.role === 'parent' ? (
                 <p className="mt-2 text-green-400 font-bold">✅ Role field is correct!</p>
              ) : (
                 <p className="mt-2 text-red-400 font-bold">❌ CRITICAL: Role field is MISSING or INCORRECT in Firestore!</p>
              )}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="font-bold text-yellow-300">Analysis</h3>
                {debugInfo.claims?.role !== 'parent' || debugInfo.firestoreDoc?.role !== 'parent' ? (
                    <p className="text-yellow-400 text-sm mt-2">
                        The login is failing because the user account is missing the correct 'parent' role in either the authentication token or the database document (or both). This is a data issue with the user account, not a problem with the login page code. The <code className="bg-gray-700 p-1 rounded">adminCreateUser</code> Cloud Function needs to be fixed and redeployed to prevent this from happening with new users.
                    </p>
                ) : (
                     <p className="text-green-400 text-sm mt-2">
                        Both the token and the database document have the correct role. If redirection is still failing, the issue lies elsewhere in the application's routing logic.
                    </p>
                )}
            </div>

            <button
              onClick={() => setDebugInfo(null)}
              className="w-full px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all"
            >
              Log In Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
