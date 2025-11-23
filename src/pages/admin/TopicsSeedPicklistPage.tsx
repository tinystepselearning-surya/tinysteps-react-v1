// src/pages/admin/TopicsSeedPicklistPage.tsx
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';
import { isSuperUserEmail } from '../../constants/accessControl';

const DEFAULT_PICKLISTS = {
  topics: [
    {
      id: 'phonics_satpin',
      label: 'Phonics – SATPIN (sounds & CVC)',
      area: 'phonics',
      subskills: ['sounds', 'blending', 'reading CVC'],
    },
    {
      id: 'phonics_digraphs',
      label: 'Phonics – Consonant digraphs (sh, ch, th, ng)',
      area: 'phonics',
      subskills: ['sh', 'ch', 'th', 'ng'],
    },
    {
      id: 'phonics_magic_e',
      label: 'Phonics – Magic E (a_e, i_e, o_e, u_e)',
      area: 'phonics',
      subskills: ['a_e', 'i_e', 'o_e', 'u_e'],
    },
    {
      id: 'grammar_simple_tenses',
      label: 'Grammar – Simple Tenses (present, past, future)',
      area: 'grammar',
      subskills: ['simple present', 'simple past', 'simple future'],
    },
    {
      id: 'grammar_continuous_tenses',
      label: 'Grammar – Continuous Tenses',
      area: 'grammar',
      subskills: [
        'present continuous',
        'past continuous',
        'future continuous',
      ],
    },
    {
      id: 'speaking_picture_talk',
      label: 'Speaking – Picture Talk',
      area: 'speaking',
      subskills: ['describe picture', 'use full sentences'],
    },
    {
      id: 'speaking_story_retell',
      label: 'Speaking – Story Retell',
      area: 'speaking',
      subskills: ['sequence', 'expression'],
    },
  ],
  mastery: [
    'not_started',
    'emerging',
    'developing',
    'proficient',
    'mastered',
  ],
  scoreBands: ['0–20', '21–40', '41–60', '61–80', '81–100'],
  lastEvidence: ['worksheet', 'game', 'oral', 'assignment'],
  nextActions: ['practice', 'reteach', 'advance'],
};

const TopicsSeedPicklistPage: React.FC = () => {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAllowed =
    user?.email && isSuperUserEmail(user.email); // only superUser can seed

  const handleSeed = async () => {
    if (!isAllowed) {
      setStatus('You are not allowed to run this action.');
      return;
    }

    try {
      setSaving(true);
      setStatus(null);

      // This will create or overwrite /config/picklists
      await setDoc(
        doc(db, 'config', 'picklists'),
        DEFAULT_PICKLISTS,
        { merge: true },
      );

      setStatus('Picklists seeded/updated successfully ✅');
    } catch (err: any) {
      setStatus(
        err?.message ||
          'Something went wrong while seeding picklists.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Please log in as an admin/super user to run this seeding page.
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
          Your account ({user.email}) is not marked as a super user. Only
          super users can seed the picklists config.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Seed Topic Picklists
        </h1>
        <p className="text-sm text-slate-600">
          This will create or update the{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            /config/picklists
          </code>{' '}
          document in Firestore with default topics and dropdown values for
          topic-wise progress.
        </p>

        <ul className="list-inside list-disc text-xs text-slate-500">
          <li>Safe to run multiple times (it overwrites the same doc).</li>
          <li>Used by Teacher Topic Progress editor and Kids Dashboard.</li>
        </ul>

        <button
          type="button"
          onClick={handleSeed}
          disabled={saving}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? 'Seeding…' : 'Seed /config/picklists'}
        </button>

        {status && (
          <p className="text-xs text-slate-700">
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default TopicsSeedPicklistPage;
