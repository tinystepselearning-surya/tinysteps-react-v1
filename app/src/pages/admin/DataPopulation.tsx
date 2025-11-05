import { useState } from "react";
import { populateStudentData } from "../../utils/populateStudentData";

export default function AdminDataPopulation() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; stats?: any; error?: string } | null>(null);

  const handlePopulate = async () => {
    if (!confirm("This will create 5 parents, 3 teachers, and 10 students in Firestore. Continue?")) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await populateStudentData();
      setResult({ success: true, stats: res.stats });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-50 to-rose-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Admin: Populate Student Data
          </h1>
          <p className="text-gray-600 mb-6">
            Create sample data for testing the student management system
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 What will be created:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>5 Parents</strong> (Alice Johnson, Bob Smith, Carol Davis, David Wilson, Emma Brown)</li>
              <li>• <strong>3 Teachers</strong> (Ms. Jane Anderson, Mr. John Martinez, Ms. Sarah Chen)</li>
              <li>• <strong>10 Students</strong> (kid1-kid10: Sophia, Liam, Emma, Noah, Olivia, Ava, Ethan, Mia, Lucas, Charlotte)</li>
              <li>• Ages: 3-8 years, Grades: Pre-K to 3rd Grade</li>
              <li>• Courses: Phonics, Grammar, Speaking, SpellBee</li>
              <li>• Phases: 0-7 (various skill levels)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">👨‍👩‍👧‍👦 Parent-Child Relationships:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Alice Johnson → Sophia (kid1), Liam (kid2)</li>
              <li>• Bob Smith → Emma (kid3), Noah (kid4)</li>
              <li>• Carol Davis → Olivia (kid5)</li>
              <li>• David Wilson → Ava (kid6), Ethan (kid7)</li>
              <li>• Emma Brown → Mia (kid8), Lucas (kid9), Charlotte (kid10)</li>
            </ul>
          </div>

          <button
            onClick={handlePopulate}
            disabled={loading}
            className={`
              w-full rounded-xl px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all
              ${loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-sky-500 hover:from-orange-600 hover:to-sky-600 active:scale-95'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Data...
              </span>
            ) : (
              '🚀 Populate Database'
            )}
          </button>

          {result && (
            <div className={`mt-6 rounded-xl p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">✅ Success!</h3>
                  <p className="text-sm text-green-800 mb-3">
                    Data has been populated successfully. Check your Firestore console.
                  </p>
                  <div className="bg-white rounded-lg p-3 text-sm text-gray-700">
                    <div className="font-mono">
                      <div>📊 <strong>Stats:</strong></div>
                      <div className="ml-4 mt-1">
                        • Parents: {result.stats.parents}<br />
                        • Teachers: {result.stats.teachers}<br />
                        • Students: {result.stats.students}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-green-700">
                    <strong>Next steps:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Go to Firebase Console → Firestore Database</li>
                      <li>Check the <code className="bg-green-100 px-1 rounded">users</code> and <code className="bg-green-100 px-1 rounded">students</code> collections</li>
                      <li>Deploy Firestore rules: <code className="bg-green-100 px-1 rounded">firebase deploy --only firestore:rules</code></li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">❌ Error</h3>
                  <p className="text-sm text-red-800">{result.error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Make sure you've deployed Firestore rules and your Firebase is properly configured.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-xs text-gray-500 border-t border-gray-200 pt-4">
            <strong>⚠️ Warning:</strong> This script creates documents directly in Firestore. 
            Make sure you're connected to the correct Firebase project (check your environment).
          </div>
        </div>
      </div>
    </div>
  );
}
