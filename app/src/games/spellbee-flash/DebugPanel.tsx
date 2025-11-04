import { useState, useEffect } from "react";
import { getEventLog, clearEventLog, type LogEvent } from "./utils";

export default function DebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load events on mount and when expanded
  useEffect(() => {
    if (isExpanded) {
      const loadedEvents = getEventLog();
      setEvents(loadedEvents.slice(-50).reverse()); // Last 50, newest first
    }
  }, [isExpanded]);

  const handleCopy = async () => {
    const text = events
      .map(
        (e) =>
          `[${e.timestamp}] ${e.name}${
            e.payload ? ` ${JSON.stringify(e.payload)}` : ""
          }`
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.warn("Failed to copy log:", err);
    }
  };

  const handleClear = () => {
    clearEventLog();
    setEvents([]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {/* Toggle Button */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="px-4 py-2 bg-gray-800 text-white font-mono text-sm rounded-lg shadow-lg hover:bg-gray-700 transition-all"
          aria-label="Open debug panel"
        >
          🐛 Debug
        </button>
      ) : (
        <div className="bg-gray-900 text-gray-100 rounded-lg shadow-2xl w-96 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐛</span>
              <h3 className="font-mono font-bold">Debug Log</h3>
              <span className="text-xs text-gray-400">
                ({events.length}/50)
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Close debug panel"
            >
              ✕
            </button>
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
            {events.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No events logged</p>
            ) : (
              events.map((event, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded p-2 border border-gray-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-green-400 font-bold">
                      {event.name}
                    </span>
                    <span className="text-gray-500 text-[10px]">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {event.payload && (
                    <pre className="text-gray-300 mt-1 text-[10px] overflow-x-auto">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 p-3 border-t border-gray-700">
            <button
              onClick={handleCopy}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-all"
            >
              {copySuccess ? "✓ Copied!" : "📋 Copy"}
            </button>
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-all"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
