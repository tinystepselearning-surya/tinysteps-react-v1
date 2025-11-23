// src/pages/kid/KidDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
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

// Extend the base type with fields this page needs
type KidSummary = FilteredChild & {
  status?: string;
  phonicsMastery?: number;
  grammarMastery?: number;
  speakingMastery?: number;
  courses?: string[];
};

function formatStatus(status?: KidSummary['status']): string {
  if (!status) return 'active';
  return status.replace('_', ' ');
}

function percent(value?: number): string {
  if (value == null || Number.isNaN(value)) return '0%';
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return `${clamped}%`;
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

  const kids = useMemo(() => children as KidSummary[], [children]);

  // Auto-select first kid when data arrives / changes
  useEffect(() => {
    if (!kids.length) {
      setSelectedKidId(null);
      return;
    }

    if (!selectedKidId) {
      const first = kids[0];
      setSelectedKidId(first.uid ?? first.id ?? null);
      return;
    }

    // If the currently selected kid disappeared (rare), fall back to first
    const stillExists = kids.some(
      (kid) => kid.uid === selectedKidId || kid.id === selectedKidId,
    );
    if (!stillExists) {
      const first = kids[0];
      setSelectedKidId(first.uid ?? first.id ?? null);
    }
  }, [kids, selectedKidId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!kids.length) return <EmptyState />;

  const selectedKid: KidSummary =
    kids.find((c) => c.uid === selectedKidId || c.id === selectedKidId) ??
    kids[0];

  const kidKey = selectedKid.uid ?? selectedKid.id ?? null;
  const kidName =
    selectedKid.fullName || selectedKid.displayName || selectedKid.name || 'Your child';

  // 🔗 Topic-wise progress hook (students/{kidKey}/progress)
  const {
    topics,
    loading: topicsLoading,
    error: topicsError,
  } = useKidTopicProgress(kidKey);

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left column: kid switcher */}
      <aside className="w-64 border-r bg-white/80 backdrop-blur-sm p-4 space-y-3">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
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
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold truncate">
                  {kid.fullName || kid.displayName || kid.name || 'Unnamed child'}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Grade: {kid.grade || '-'} · Status {formatStatus(kid.status)}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right column: main kid dashboard */}
      <section className="flex-1 overflow-auto p-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">{kidName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Grade {selectedKid.grade || '-'} ·{' '}
            {formatStatus(selectedKid.status)}
          </p>
          {selectedKid.courses && selectedKid.courses.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedKid.courses.map((course) => (
                <span
                  key={course}
                  className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                >
                  {course}
                </span>
              ))}
            </div>
          )}
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4 grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Phonics Mastery
                  </p>
                  <p className="text-2xl font-semibold">
                    {percent(selectedKid.phonicsMastery)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Based on recent worksheet & game data.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Grammar Mastery
                  </p>
                  <p className="text-2xl font-semibold">
                    {percent(selectedKid.grammarMastery)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Sentence building & parts of speech.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Speaking Mastery
                  </p>
                  <p className="text-2xl font-semibold">
                    {percent(selectedKid.speakingMastery)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Public speaking & confidence tasks.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="space-y-2 p-4">
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
              <CardContent className="space-y-3 p-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Topic-wise Progress
                </h2>

                {topicsLoading && (
                  <p className="text-sm text-slate-500">
                    Syncing topic progress…
                  </p>
                )}

                {topicsError && !topicsLoading && (
                  <p className="text-sm text-red-600">
                    Couldn&apos;t load topic progress: {topicsError}
                  </p>
                )}

                {!topicsLoading && !topicsError && topics.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No topic-wise progress recorded yet. As your child completes
                    worksheets and games, you&apos;ll see each topic&apos;s
                    status here.
                  </p>
                )}

                {!topicsLoading && !topicsError && topics.length > 0 && (
                  <div className="space-y-2">
                    {topics.map((topic: KidTopicProgress) => (
                      <div
                        key={topic.id}
                        className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-900">
                            {topic.topicName}
                          </div>
                          <div className="flex flex-wrap gap-1 text-xs text-slate-500">
                            <span className="rounded-full bg-white/80 px-2 py-0.5">
                              Area: {topic.area}
                            </span>
                            {topic.subskill && (
                              <span className="rounded-full bg-white/80 px-2 py-0.5">
                                Subskill: {topic.subskill}
                              </span>
                            )}
                            {topic.scoreBand && (
                              <span className="rounded-full bg-white/80 px-2 py-0.5">
                                Score band: {topic.scoreBand}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-1 flex flex-col items-start gap-1 text-xs md:mt-0 md:items-end">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                              topic.mastery === 'mastered'
                                ? 'bg-emerald-100 text-emerald-800'
                              : topic.mastery === 'proficient'
                                ? 'bg-green-100 text-green-800'
                              : topic.mastery === 'developing'
                                ? 'bg-amber-100 text-amber-800'
                              : topic.mastery === 'emerging'
                                ? 'bg-orange-100 text-orange-800'
                              : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Mastery: {topic.mastery || 'not_started'}
                          </span>
                          {topic.nextAction && (
                            <span className="text-slate-600">
                              Next step: {topic.nextAction}
                            </span>
                          )}
                          {topic.updatedAt && (
                            <span className="text-slate-400">
                              Updated:{' '}
                              {topic.updatedAt.toLocaleDateString()}
                            </span>
                          )}
                        </div>
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
              <CardContent className="space-y-2 p-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Live Class & Homework View (Coming soon)
                </h2>
                <p className="text-sm text-slate-600">
                  This tab will show upcoming sessions, completed homework,
                  and attendance details for {kidName}. It will be powered by
                  the same data teachers update in their dashboard.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default KidDashboard;
