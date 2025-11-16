import React, { useState } from 'react';
import WorksheetForm from './WorksheetForm';
import WorksheetPreview from './WorksheetPreview';
import { useWorksheetGenerator } from './useWorksheetGenerator';

// Main UI for teachers to generate, edit, and download worksheets
export default function WorksheetGenerator({ teacherId }) {
  const {
    form,
    onChange,
    generate,
    worksheetText,
    setWorksheetText,
    loading,
    error,
    tokensUsed,
    recent,
    saveWorksheet,
    reuseWorksheet,
    downloadPdf,
    shareLink,
    isValid,
    options,
  } = useWorksheetGenerator(teacherId);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    const ok = await shareLink();
    setShareCopied(ok);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Teacher Portal</p>
          <h1 className="text-3xl font-bold text-gray-900">Worksheet Generator</h1>
          <p className="text-gray-600">
            Create phonics, grammar, spelling, or reading worksheets with Groq AI, then save or share.
          </p>
        </div>
        <div className="px-3 py-2 bg-white border border-indigo-100 rounded-xl text-sm text-gray-700">
          <div className="font-semibold text-indigo-700">Usage logging</div>
          <p>teacherId, topic, level, questionCount, timestamp</p>
        </div>
      </div>

      <div className="space-y-4">
        <WorksheetForm
          form={form}
          onChange={onChange}
          onSubmit={generate}
          loading={loading}
          isValid={isValid}
          options={options}
        />

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <WorksheetPreview
          worksheetText={worksheetText}
          setWorksheetText={setWorksheetText}
          tokensUsed={tokensUsed}
          onDownload={downloadPdf}
          onSave={saveWorksheet}
          onShare={handleShare}
          recent={recent}
          onReuse={reuseWorksheet}
          loading={loading}
        />

        {shareCopied && (
          <div className="text-xs text-emerald-700">Link copied! Share with your class.</div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-3 w-3 rounded-full bg-indigo-200 animate-pulse" />
            Generating worksheet… (timeout 30s)
          </div>
        )}
      </div>
    </div>
  );
}
