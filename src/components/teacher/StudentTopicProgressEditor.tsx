// src/components/teacher/StudentTopicProgressEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import {
  useProgressPicklists,
  type TopicDefinition,
} from '../../hooks/useProgressPicklists';
import {
  useKidTopicProgress,
  type KidTopicProgress,
} from '../../hooks/useKidTopicProgress';

interface StudentTopicProgressEditorProps {
  kidId: string;
  kidName?: string;
}

const StudentTopicProgressEditor: React.FC<StudentTopicProgressEditorProps> = ({
  kidId,
  kidName,
}) => {
  const { config, loading: configLoading, error: configError } =
    useProgressPicklists();

  const {
    topics: existingTopics,
    loading: topicsLoading,
    error: topicsError,
  } = useKidTopicProgress(kidId);

  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedSubskill, setSelectedSubskill] = useState<string>('');
  const [mastery, setMastery] = useState<string>('not_started');
  const [scoreBand, setScoreBand] = useState<string>('');
  const [lastEvidence, setLastEvidence] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [teacherRemark, setTeacherRemark] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const topics = config?.topics ?? [];

  const selectedTopicDef: TopicDefinition | undefined = useMemo(
    () => topics.find((t) => t.id === selectedTopicId),
    [topics, selectedTopicId],
  );

  // When config loads, pick first topic by default
  useEffect(() => {
    if (!selectedTopicId && topics.length > 0) {
      setSelectedTopicId(topics[0].id);
    }
  }, [topics, selectedTopicId]);

  // When topic changes, load existing progress (if any) or reset form
  useEffect(() => {
    if (!selectedTopicId) return;

    const existing: KidTopicProgress | undefined = existingTopics.find(
      (t) => t.id === selectedTopicId,
    );

    if (existing) {
      const existingMastery = existing.mastery;
      // Coerce possible number | "not_started" into a string
      setMastery(
        existingMastery == null
          ? 'not_started'
          : typeof existingMastery === 'number'
          ? String(existingMastery)
          : existingMastery,
      );
      setScoreBand(existing.scoreBand || '');
      setLastEvidence(existing.lastEvidence || '');
      setNextAction(existing.nextAction || '');
      setTeacherRemark(existing.teacherRemark || '');
      setSelectedSubskill(existing.subskill || '');
    } else {
      setMastery('not_started');
      setScoreBand('');
      setLastEvidence('');
      setNextAction('');
      setTeacherRemark('');
      setSelectedSubskill('');
    }

    setSaveMessage(null);
  }, [selectedTopicId, existingTopics]);

  const handleSave = async () => {
    if (!kidId || !selectedTopicId || !selectedTopicDef) return;

    try {
      setSaving(true);
      setSaveMessage(null);

      const ref = doc(db, 'students', kidId, 'progress', selectedTopicId);

      await setDoc(
        ref,
        {
          topicName: selectedTopicDef.label,
          area: selectedTopicDef.area,
          subskill: selectedSubskill || null,
          mastery: mastery || 'not_started',
          scoreBand: scoreBand || null,
          lastEvidence: lastEvidence || null,
          nextAction: nextAction || null,
          teacherRemark: teacherRemark || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setSaveMessage('Progress saved.');
    } catch (err: any) {
      setSaveMessage(
        err?.message || 'Could not save progress. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const disabled =
    configLoading || topicsLoading || !config || topics.length === 0;

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Topic-wise Progress (Teacher View)
          </h2>
          {kidName && (
            <p className="text-xs text-slate-500">
              Updating progress for: {kidName}
            </p>
          )}
        </div>
        {saving && (
          <span className="text-xs text-slate-500">
            Saving…
          </span>
        )}
        {!saving && saveMessage && (
          <span className="text-xs text-emerald-600">{saveMessage}</span>
        )}
      </div>

      {configError && (
        <p className="text-xs text-red-600">
          Couldn&apos;t load picklists: {configError}
        </p>
      )}
      {topicsError && (
        <p className="text-xs text-red-600">
          Couldn&apos;t load existing progress: {topicsError}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Topic
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            disabled={disabled}
          >
            {topics.length === 0 && (
              <option value="">No topics configured</option>
            )}
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Subskill (optional)
          {selectedTopicDef && selectedTopicDef.subskills?.length ? (
            <select
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
              value={selectedSubskill}
              onChange={(e) => setSelectedSubskill(e.target.value)}
              disabled={disabled}
            >
              <option value="">Select subskill</option>
              {selectedTopicDef.subskills.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
              placeholder="e.g., CVC blending"
              value={selectedSubskill}
              onChange={(e) => setSelectedSubskill(e.target.value)}
              disabled={disabled}
            />
          )}
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Mastery
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            value={mastery}
            onChange={(e) => setMastery(e.target.value)}
            disabled={disabled}
          >
            {(config?.mastery ?? ['not_started']).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Score band
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            value={scoreBand}
            onChange={(e) => setScoreBand(e.target.value)}
            disabled={disabled}
          >
            <option value="">Not set</option>
            {(config?.scoreBands ?? []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Last evidence
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            value={lastEvidence}
            onChange={(e) => setLastEvidence(e.target.value)}
            disabled={disabled}
          >
            <option value="">Not set</option>
            {(config?.lastEvidence ?? []).map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Next action
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            disabled={disabled}
          >
            <option value="">Not set</option>
            {(config?.nextActions ?? []).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
        Teacher remark
        <textarea
          className="min-h-[60px] rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          placeholder="Short note for parents & internal tracking"
          value={teacherRemark}
          onChange={(e) => setTeacherRemark(e.target.value)}
          disabled={disabled}
        />
      </label>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || saving || !selectedTopicId}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? 'Saving…' : 'Save topic progress'}
        </button>
      </div>
    </div>
  );
};

export default StudentTopicProgressEditor;
