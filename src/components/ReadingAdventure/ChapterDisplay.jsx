import React from 'react';

export default function ChapterDisplay({ chapterText }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm whitespace-pre-line leading-relaxed text-gray-900">
      {chapterText || 'Loading chapter...'}
    </div>
  );
}
