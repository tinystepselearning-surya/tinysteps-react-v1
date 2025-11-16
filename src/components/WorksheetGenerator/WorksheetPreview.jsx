import React from 'react';

export function WorksheetPreview({
  worksheetText,
  setWorksheetText,
  tokensUsed,
  onDownload,
  onSave,
  onShare,
  recent,
  onReuse,
  loading,
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Worksheet Preview</h3>
          <p className="text-xs text-gray-500">Edit if needed before saving or downloading.</p>
        </div>
        {tokensUsed != null && (
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
            Tokens: {tokensUsed}
          </span>
        )}
      </div>

      <textarea
        className="w-full min-h-[220px] rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        value={worksheetText}
        onChange={(e) => setWorksheetText(e.target.value)}
        placeholder="Generated worksheet will appear here..."
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onSave}
          disabled={!worksheetText || loading}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow hover:bg-emerald-700 transition disabled:opacity-60"
        >
          Save to library
        </button>
        <button
          onClick={onDownload}
          disabled={!worksheetText}
          className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60"
        >
          Download PDF
        </button>
        <button
          onClick={onShare}
          disabled={!worksheetText}
          className="px-4 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition disabled:opacity-60"
        >
          Share link
        </button>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Recently generated</h4>
        {recent.length === 0 ? (
          <p className="text-xs text-gray-500">No worksheets yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onReuse(item.content)}
                className="w-full text-left px-3 py-2 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition"
              >
                <div className="text-sm font-semibold text-gray-900">
                  {item.topic} · {item.level}
                </div>
                <div className="text-xs text-gray-500 line-clamp-2">
                  {item.content?.slice(0, 160) || 'No content'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorksheetPreview;
