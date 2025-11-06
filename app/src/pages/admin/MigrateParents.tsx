import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";

export default function MigrateParents() {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const runMigration = async () => {
    setStatus("running");
    setError("");
    setResult(null);

    try {
      const migrateParentsFn = httpsCallable(functions, "migrateParents");
      const response = await migrateParentsFn({});
      
      console.log("Migration result:", response.data);
      setResult(response.data);
      setStatus("success");
    } catch (err: any) {
      console.error("Migration error:", err);
      setError(err.message || "Migration failed");
      setStatus("error");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Parent Data Migration
        </h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ What does this do?</h2>
          <p className="text-sm text-yellow-700">
            This migration creates <code>/parents/{"{uid}"}</code> documents for existing parent users 
            who don't have them. This is needed for the parent dashboard to work correctly.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={runMigration}
            disabled={status === "running"}
            className={`
              w-full px-6 py-3 rounded-lg font-semibold text-white
              ${status === "running" 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-700"
              }
              transition-colors
            `}
          >
            {status === "running" ? "Running Migration..." : "Run Parent Migration"}
          </button>

          {status === "success" && result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">✅ Migration Complete!</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Total parent users: {result.totalParents}</li>
                <li>• Migrated: {result.migratedCount}</li>
                <li>• Skipped (already exists): {result.skippedCount}</li>
              </ul>
              <p className="text-sm text-green-600 mt-2">{result.message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-800 mb-2">❌ Migration Failed</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Technical Details:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Creates documents in <code>/parents/{"{parentId}"}</code> collection</li>
            <li>• Links children via <code>/parents/{"{parentId}"}/children/{"{childId}"}</code> subcollection</li>
            <li>• Safe to run multiple times (skips existing documents)</li>
            <li>• Only affects parent users who don't have a parent document</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
