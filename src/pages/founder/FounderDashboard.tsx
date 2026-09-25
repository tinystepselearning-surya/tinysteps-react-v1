import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import callFunction from '../../lib/callFunctions';
import { performAppLogout } from '../../lib/auth';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';
import { clearPublicEditorialReviewCache } from '../../lib/publicEditorialReview';
import useAuthStore from '../../store/useAuthStore';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';

type ReviewStatus = 'pending' | 'approved' | 'changes-requested';
type ReviewFilter = 'pending' | 'approved' | 'changes-requested' | 'all';

type ReviewDecision = {
  conceptId: string;
  status: ReviewStatus;
  reviewerKey: 'founder-priya';
  reviewedByUid: string;
  reviewedAt: string | null;
  reviewedRevision: string | null;
  reviewNotes: string | null;
  updatedAt: string;
};

type ReviewStateResponse = {
  reviewerKey: 'founder-priya';
  totalPages: number;
  decisions: Record<string, ReviewDecision>;
};

type ReviewDecisionResponse = {
  decision: ReviewDecision;
};

const FILTERS: Array<{ id: ReviewFilter; label: string }> = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'changes-requested', label: 'Changes Requested' },
  { id: 'all', label: 'All' },
];

function statusClasses(status: ReviewStatus) {
  if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'changes-requested') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function statusLabel(status: ReviewStatus) {
  if (status === 'approved') return 'Approved';
  if (status === 'changes-requested') return 'Changes requested';
  return 'Pending';
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>({});
  const [filter, setFilter] = useState<ReviewFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [savingConceptId, setSavingConceptId] = useState<string | null>(null);
  const [changeConceptId, setChangeConceptId] = useState<string | null>(null);
  const [changeNotes, setChangeNotes] = useState('');

  const pages = useMemo(
    () => PHONICS_PUBLISHED_RESOURCE_PAGES.map((page: any) => ({
      conceptId: String(page.conceptId),
      title: String(page.cardTitle),
      path: String(page.path),
      group: String(page.group),
      publicationWave: String(page.publicationWave || 'pilot-wave-1'),
      publicationRevision: String(page.publicationRevision),
    })),
    [],
  );

  const loadState = async () => {
    setLoading(true);
    try {
      const response = await callFunction<ReviewStateResponse, Record<string, never>>(
        'getFounderEditorialReviewState',
        {},
      );
      setDecisions(response.decisions || {});
    } catch (error: any) {
      toast({
        title: 'Could not load editorial reviews',
        description: error?.message || 'Please refresh and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, []);

  const statusFor = (conceptId: string): ReviewStatus =>
    decisions[conceptId]?.status || 'pending';

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let changesRequested = 0;
    for (const page of pages) {
      const status = statusFor(page.conceptId);
      if (status === 'approved') approved += 1;
      else if (status === 'changes-requested') changesRequested += 1;
      else pending += 1;
    }
    return { pending, approved, changesRequested, all: pages.length };
  }, [decisions, pages]);

  const visiblePages = useMemo(() => {
    if (filter === 'all') return pages;
    return pages.filter((page) => statusFor(page.conceptId) === filter);
  }, [decisions, filter, pages]);

  const saveDecision = async (
    conceptId: string,
    status: 'approved' | 'changes-requested',
    reviewNotes?: string,
  ) => {
    setSavingConceptId(conceptId);
    try {
      const response = await callFunction<
        ReviewDecisionResponse,
        { conceptId: string; status: 'approved' | 'changes-requested'; reviewNotes?: string }
      >('setFounderEditorialReviewDecision', {
        conceptId,
        status,
        reviewNotes,
      });

      setDecisions((current) => ({
        ...current,
        [conceptId]: response.decision,
      }));
      clearPublicEditorialReviewCache();
      setChangeConceptId(null);
      setChangeNotes('');

      toast({
        title: status === 'approved' ? 'Review approved' : 'Changes requested',
        description:
          status === 'approved'
            ? 'This exact publication revision is now recorded as reviewed by Priya.'
            : 'The review note has been saved and public approval is withheld.',
      });
    } catch (error: any) {
      toast({
        title: 'Review update failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingConceptId(null);
    }
  };

  const handleLogout = async () => {
    await performAppLogout('user-clicked-logout');
    navigate('/founder/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start border-r border-slate-200 bg-white md:flex md:flex-col">
          <div className="border-b border-slate-100 px-6 py-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Tiny Steps</p>
            <h1 className="mt-1 text-xl font-black">Founder</h1>
          </div>
          <nav className="p-3">
            <div className="flex items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              <BookOpenCheck className="h-4 w-4" />
              Editorial Reviews
            </div>
          </nav>
          <div className="mt-auto border-t border-slate-100 p-4">
            <p className="truncate text-xs font-semibold text-slate-700">{user?.displayName || 'Priya'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <Button variant="outline" size="sm" className="mt-3 w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600 md:hidden">Founder</p>
                <h2 className="text-xl font-black sm:text-2xl">Editorial Reviews</h2>
                <p className="mt-1 text-sm text-slate-500">Review the published phonics guides and approve only the exact revision you checked.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void loadState()} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="p-4"><p className="text-xs font-semibold text-slate-500">Pending</p><p className="mt-1 text-2xl font-black">{counts.pending}</p></Card>
              <Card className="p-4"><p className="text-xs font-semibold text-slate-500">Approved</p><p className="mt-1 text-2xl font-black text-emerald-700">{counts.approved}</p></Card>
              <Card className="p-4"><p className="text-xs font-semibold text-slate-500">Changes</p><p className="mt-1 text-2xl font-black text-amber-700">{counts.changesRequested}</p></Card>
              <Card className="p-4"><p className="text-xs font-semibold text-slate-500">Total</p><p className="mt-1 text-2xl font-black">{counts.all}</p></Card>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => {
                const count =
                  item.id === 'pending' ? counts.pending :
                  item.id === 'approved' ? counts.approved :
                  item.id === 'changes-requested' ? counts.changesRequested :
                  counts.all;
                return (
                  <Button
                    key={item.id}
                    size="sm"
                    variant={filter === item.id ? 'default' : 'outline'}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label} · {count}
                  </Button>
                );
              })}
            </div>

            {loading ? (
              <Card className="p-8 text-center text-sm text-slate-500">Loading review queue…</Card>
            ) : visiblePages.length === 0 ? (
              <Card className="p-8 text-center text-sm text-slate-500">No pages in this review state.</Card>
            ) : (
              <div className="space-y-3">
                {visiblePages.map((page) => {
                  const decision = decisions[page.conceptId];
                  const status = statusFor(page.conceptId);
                  const isSaving = savingConceptId === page.conceptId;
                  const isChangeOpen = changeConceptId === page.conceptId;
                  const reviewedDate = formatDate(decision?.reviewedAt || null);

                  return (
                    <Card key={page.conceptId} className="overflow-hidden">
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-black sm:text-lg">{page.title}</h3>
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(status)}`}>
                                {statusLabel(status)}
                              </span>
                            </div>
                            <p className="mt-1 break-all text-xs text-slate-500">{page.path}</p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>{page.group}</span>
                              <span>{page.publicationWave === 'pilot-wave-1' ? 'Wave 1' : 'Wave 2'}</span>
                              <span>Revision {page.publicationRevision}</span>
                              {reviewedDate ? <span>Reviewed {reviewedDate}</span> : null}
                            </div>
                            {decision?.reviewNotes ? (
                              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                {decision.reviewNotes}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(page.path, '_blank', 'noopener,noreferrer')}
                            >
                              Open Page <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              disabled={isSaving}
                              onClick={() => void saveDecision(page.conceptId, 'approved')}
                            >
                              {isSaving ? 'Saving…' : 'Approve'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSaving}
                              onClick={() => {
                                setChangeConceptId(isChangeOpen ? null : page.conceptId);
                                setChangeNotes(decision?.reviewNotes || '');
                              }}
                            >
                              Request Changes
                            </Button>
                          </div>
                        </div>

                        {isChangeOpen ? (
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <label className="text-sm font-bold text-slate-800" htmlFor={`notes-${page.conceptId}`}>
                              What needs to change?
                            </label>
                            <Textarea
                              id={`notes-${page.conceptId}`}
                              className="mt-2"
                              rows={3}
                              maxLength={2000}
                              value={changeNotes}
                              onChange={(event) => setChangeNotes(event.target.value)}
                              placeholder="Add a concise academic/editorial correction note."
                            />
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setChangeConceptId(null);
                                  setChangeNotes('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                disabled={isSaving || !changeNotes.trim()}
                                onClick={() => void saveDecision(page.conceptId, 'changes-requested', changeNotes)}
                              >
                                Save Change Request
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
