// src/pages/kid/KidDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import SoundDetectiveGame from '../kids/games/phonics/SoundDetectiveGame';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';

import {
  useParentFilteredChildren,
  type FilteredChild,
} from '../../hooks/useParentFilteredData';

import {
  useKidTopicProgress,
  type KidTopicProgress,
} from '../../hooks/useKidTopicProgress';
import { masteryLabel } from '../../lib/mastery';

// Extend the base type with fields this page needs
type KidSummary = FilteredChild & {
  status?: string;
  phonicsMastery?: number;
  grammarMastery?: number;
  speakingMastery?: number;
};

function formatStatus(status?: KidSummary['status']): string {
  if (!status) return 'active';
  return status.replace('_', ' ');
}

function formatDateTime(value: any): string {
  if (!value) return '-';
  try {
    if (typeof value.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime())
        ? d.toLocaleString()
        : '-';
    }
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  } catch {
    // ignore
  }
  return '-';
}

const EmptyState: React.FC = () => (
  <div className="flex h-full items-center justify-center px-6 py-8">
    <Card className="max-w-md w-full">
      <CardContent className="p-6 space-y-3 text-center">
        <h2 className="text-lg font-semibold">No kids linked yet</h2>
        <p className="text-sm text-slate-600">
          Ask Tiny Steps support to link your child profile to your parent
          account. Once linked, you&apos;ll see their full Kids Dashboard here.
        </p>
      </CardContent>
    </Card>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="flex h-full items-center justify-center px-6 py-8">
    <Card className="max-w-sm w-full">
      <CardContent className="p-6 text-center text-sm text-slate-600">
        Loading your kids dashboard…
      </CardContent>
    </Card>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-full items-center justify-center px-6 py-8">
    <Card className="max-w-md w-full">
      <CardContent className="p-6 space-y-3 text-center">
        <h2 className="text-lg font-semibold text-red-600">
          Couldn&apos;t load Kids Dashboard
        </h2>
        <p className="text-sm text-slate-600">{message}</p>
      </CardContent>
    </Card>
  </div>
);

const KidDashboard: React.FC = () => {
  const { children, loading, error } = useParentFilteredChildren();
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);

  // Hook for topic-wise progress — always called, never conditionally
  const {
    topics,
    loading: topicsLoading,
    error: topicsError,
  } = useKidTopicProgress(selectedKidId);

  // Auto-select first kid when data arrives
  useEffect(() => {
    if (!selectedKidId && children.length > 0) {
      const first = children[0] as KidSummary;
      const initialId = first.uid ?? first.id ?? null;
      setSelectedKidId(initialId);
    }
  }, [children, selectedKidId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!children.length) return <EmptyState />;

  const kids = children as KidSummary[];

  const selectedKid: KidSummary =
    kids.find(
      (c) => c.uid === selectedKidId || c.id === selectedKidId,
    ) || kids[0];

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left column: kid switcher */}
      <aside className="w-64 border-r bg-white/80 backdrop-blur-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Your Kids
        </h2>
        <div className="space-y-2">
          {kids.map((kid, index) => {
            const key = kid.uid ?? kid.id ?? String(index);
            const isActive =
              kid.uid === selectedKidId || kid.id === selectedKidId;

            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setSelectedKidId(kid.uid ?? kid.id ?? null)
                }
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold truncate">
                  {kid.fullName ||
                    kid.displayName ||
                    kid.name ||
                    'Unnamed child'}
                </div>
                <div className="text-xs text-slate-500">
                  Grade: {kid.grade || '-'} · Status:{' '}
                  {formatStatus(kid.status)}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right column: main kid dashboard */}
      <section className="flex-1 p-6 overflow-auto">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {selectedKid.fullName ||
              selectedKid.displayName ||
              selectedKid.name ||
              'Kids Dashboard'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Grade {selectedKid.grade || '-'} ·{' '}
            {formatStatus(selectedKid.status)}
          </p>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-xl mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Phonics Mastery
                  </p>
                  <p className="text-2xl font-semibold">
                    {masteryLabel(selectedKid.phonicsMastery)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Based on recent worksheet & game data.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Grammar Mastery
                  </p>
                  <p className="text-2xl font-semibold">
                    {masteryLabel(selectedKid.grammarMastery)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Sentence building & parts of speech.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Speaking Mastery
                  </p>
                  <p className="text-2xl font-semibold">
                    {masteryLabel(selectedKid.speakingMastery)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Public speaking & confidence tasks.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4 space-y-2">
                <h2 className="text-sm font-semibold text-slate-800">
                  What your child is focusing on now
                </h2>
                <p className="text-sm text-slate-600">
                  This section will soon show live data from their digital
                  worksheets and games — including current topic, streaks, and
                  recommended next steps.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <h2 className="text-sm font-semibold text-slate-800">
                  Topic-wise Progress
                </h2>

                {topicsLoading ? (
                  <p className="text-sm text-slate-500">
                    Loading topic-wise progress…
                  </p>
                ) : topicsError ? (
                  <p className="text-sm text-red-600">
                    Couldn&apos;t load topic progress. Please try again
                    later.
                  </p>
                ) : topics.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No topic progress recorded yet. As teachers update topics
                    in class, you&apos;ll see them listed here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topics.map((t: KidTopicProgress) => (
                      <div
                        key={t.id}
                        className="border rounded-md px-3 py-2 text-sm space-y-1 bg-white/60"
                      >
                        <div className="flex justify-between gap-2">
                          <div className="font-semibold truncate">
                            {t.topicName || t.id}
                          </div>
                          {(t.mastery != null || t.masteryKey) && (
                            <div className="text-xs text-slate-600">
                              Mastery:{' '}
                              <span className="font-semibold">
                                {masteryLabel(t.masteryKey ?? t.mastery)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          {t.area && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100">
                              Area: {t.area}
                            </span>
                          )}
                          {t.subskill && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                              Skill: {t.subskill}
                            </span>
                          )}
                          {t.lastEvidence && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                              Last check: {t.lastEvidence}
                            </span>
                          )}
                        </div>
                        {(t.nextAction || t.teacherRemark) && (
                          <div className="text-xs text-slate-600 space-y-0.5">
                            {t.nextAction && (
                              <div>
                                <span className="font-semibold">
                                  Next step:
                                </span>{' '}
                                {t.nextAction}
                              </div>
                            )}
                            {t.teacherRemark && (
                              <div>
                                <span className="font-semibold">
                                  Teacher note:
                                </span>{' '}
                                {t.teacherRemark}
                              </div>
                            )}
                          </div>
                        )}
                        {t.updatedAt && (
                          <div className="text-[11px] text-slate-400">
                            Updated:{' '}
                            {formatDateTime(t.updatedAt)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <h2 className="text-sm font-semibold text-slate-800">
                  Live Class & Homework View (Coming soon)
                </h2>
                <p className="text-sm text-slate-600">
                  This tab will show upcoming sessions, completed homework,
                  and attendance details for{' '}
                  {selectedKid.fullName ||
                    selectedKid.displayName ||
                    selectedKid.name ||
                    'your child'}
                  . It will be powered by the same data teachers update in their
                  dashboard.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Games tab */}
          <TabsContent value="games" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  Sound Detective 🔍
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Beta · Adaptive AI
                  </span>
                </h2>
                <p className="text-sm text-slate-600">
                  Play and find words with the right sound. This game adapts to
                  your child&apos;s phonics level and will soon feed directly
                  into their mastery score.
                </p>
              </CardContent>
            </Card>

            <SoundDetectiveGame
              {...({
                kidId: selectedKid.uid ?? selectedKid.id ?? undefined,
                kidName:
                  selectedKid.fullName ||
                  selectedKid.displayName ||
                  selectedKid.name ||
                  'your child',
              } as any)}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default KidDashboard;
