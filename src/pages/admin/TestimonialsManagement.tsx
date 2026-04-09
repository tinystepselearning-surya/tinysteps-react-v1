import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

import { useToast } from '@components/hooks/use-toast';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { db } from '../../lib/firebaseConfig';
import type { TestimonialStatus } from '../../lib/testimonials';
import { useAuthStore } from '../../store/useAuthStore';

type StatusFilter = 'all' | TestimonialStatus;

type TestimonialRecord = {
  id: string;
  status: TestimonialStatus;
  isFeatured: boolean;
  source: string;
  reviewerType: string;
  parentName: string;
  childName?: string;
  childAge?: number;
  city?: string;
  reviewText?: string;
  publishedText?: string;
  rating: number;
  courseTags: string[];
  pageTags: string[];
  approvedBy?: string;
  editedBy?: string;
  editReason?: string;
  editedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const asStringOrUndefined = (value: unknown): string | undefined => {
  const normalized = asString(value);
  return normalized || undefined;
};
const asNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const asNumberOrUndefined = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};
const asBoolean = (value: unknown): boolean => value === true;
const asTags = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((entry) => asString(entry).toLowerCase()).filter(Boolean)
    : [];

const asStatus = (value: unknown): TestimonialStatus => {
  const status = asString(value).toLowerCase();
  if (status === 'approved' || status === 'rejected' || status === 'pending') return status;
  return 'pending';
};

const toMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    try {
      return Number((value as { toMillis: () => number }).toMillis()) || 0;
    } catch {
      return 0;
    }
  }
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate().getTime();
    } catch {
      return 0;
    }
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDateTime = (value: unknown): string => {
  const ms = toMillis(value);
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(ms));
};

const mapDocToRecord = (id: string, data: any): TestimonialRecord => ({
  id,
  status: asStatus(data?.status),
  isFeatured: asBoolean(data?.isFeatured),
  source: asString(data?.source) || 'public_form',
  reviewerType: asString(data?.reviewerType) || 'parent',
  parentName: asString(data?.parentName) || 'Unknown',
  childName: asStringOrUndefined(data?.childName),
  childAge: asNumberOrUndefined(data?.childAge),
  city: asStringOrUndefined(data?.city),
  reviewText: asStringOrUndefined(data?.reviewText),
  publishedText: asStringOrUndefined(data?.publishedText),
  rating: asNumber(data?.rating),
  courseTags: asTags(data?.courseTags),
  pageTags: asTags(data?.pageTags),
  approvedBy: asStringOrUndefined(data?.approvedBy),
  editedBy: asStringOrUndefined(data?.editedBy),
  editReason: asStringOrUndefined(data?.editReason),
  editedAt: data?.editedAt,
  createdAt: data?.createdAt,
  updatedAt: data?.updatedAt,
});

const statusBadgeClass = (status: TestimonialStatus) => {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

export default function TestimonialsManagement(): JSX.Element {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editReason, setEditReason] = useState('');

  const testimonialsQuery = useQuery({
    queryKey: ['adminTestimonialsModeration'],
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<TestimonialRecord[]> => {
      const ref = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'), limit(500));
      const snapshot = await getDocs(ref);
      return snapshot.docs.map((entry) => mapDocToRecord(entry.id, entry.data()));
    },
  });

  const allItems = useMemo(() => {
    const list = testimonialsQuery.data ?? [];
    return [...list].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  }, [testimonialsQuery.data]);

  const counts = useMemo(() => {
    const summary = { pending: 0, approved: 0, rejected: 0, all: allItems.length };
    for (const item of allItems) {
      if (item.status === 'pending') summary.pending += 1;
      if (item.status === 'approved') summary.approved += 1;
      if (item.status === 'rejected') summary.rejected += 1;
    }
    return summary;
  }, [allItems]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return allItems;
    return allItems.filter((item) => item.status === statusFilter);
  }, [allItems, statusFilter]);

  const patchItem = async (
    item: TestimonialRecord,
    patch: Record<string, unknown>,
    successTitle: string
  ) => {
    setActionId(item.id);
    try {
      await updateDoc(doc(db, 'testimonials', item.id), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      await testimonialsQuery.refetch();
      toast({ title: successTitle });
    } catch (error: any) {
      console.error('[TestimonialsManagement] update failed', error);
      toast({
        title: 'Update failed',
        description: error?.message || 'Could not update testimonial.',
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleApprove = (item: TestimonialRecord) =>
    patchItem(
      item,
      {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: user?.email || user?.uid || 'admin',
      },
      'Testimonial approved'
    );

  const handleReject = (item: TestimonialRecord) =>
    patchItem(
      item,
      {
        status: 'rejected',
        isFeatured: false,
      },
      'Testimonial rejected'
    );

  const handleMoveToPending = (item: TestimonialRecord) =>
    patchItem(
      item,
      {
        status: 'pending',
        isFeatured: false,
      },
      'Moved back to pending'
    );

  const handleToggleFeatured = (item: TestimonialRecord) =>
    patchItem(
      item,
      {
        isFeatured: !item.isFeatured,
      },
      item.isFeatured ? 'Removed from featured' : 'Marked as featured'
    );

  const beginEdit = (item: TestimonialRecord) => {
    setEditingId(item.id);
    setEditText(item.publishedText || item.reviewText || '');
    setEditReason(item.editReason || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditReason('');
  };

  const saveEdit = async (item: TestimonialRecord) => {
    const normalizedText = editText.trim();
    const normalizedReason = editReason.trim();
    await patchItem(
      item,
      {
        publishedText: normalizedText || null,
        editReason: normalizedReason || null,
        editedAt: serverTimestamp(),
        editedBy: user?.email || user?.uid || 'admin',
      },
      normalizedText ? 'Editorial text updated' : 'Editorial text cleared'
    );
    cancelEdit();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Testimonials Moderation</h2>
            <p className="text-sm text-slate-600">
              Review public submissions and decide what appears on the website.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => testimonialsQuery.refetch()}
            disabled={testimonialsQuery.isFetching}
          >
            {testimonialsQuery.isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const count = counts[filter.id];
            const isActive = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {filter.label} ({count})
              </button>
            );
          })}
        </div>
      </Card>

      {testimonialsQuery.isLoading ? (
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading testimonials...
          </div>
        </Card>
      ) : testimonialsQuery.isError ? (
        <Card className="p-6">
          <p className="text-sm text-rose-700">Could not load testimonials. Please refresh.</p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-slate-600">No testimonials in this status.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-slate-900">{item.parentName}</span>
                  <span className="text-xs text-slate-500">ID: {item.id}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                  {item.isFeatured ? (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      featured
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span>
                    Rating:{' '}
                    <strong>
                      {item.rating || 0}/5
                    </strong>
                  </span>
                  {item.childName ? <span>Child: {item.childName}</span> : null}
                  {typeof item.childAge === 'number' ? <span>Age: {item.childAge}</span> : null}
                  {item.city ? <span>City: {item.city}</span> : null}
                  <span>Submitted: {formatDateTime(item.createdAt)}</span>
                  {item.approvedBy ? <span>Approved by: {item.approvedBy}</span> : null}
                  {item.editedBy ? <span>Edited by: {item.editedBy}</span> : null}
                </div>

                {item.publishedText ? (
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    Public text: {item.publishedText}
                  </p>
                ) : null}

                {item.reviewText ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800">{item.reviewText}</p>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm italic text-slate-500">
                    No written review provided.
                  </p>
                )}

                {item.editReason ? (
                  <p className="text-xs text-slate-500">Edit note: {item.editReason}</p>
                ) : null}

                {editingId === item.id ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Editorial text (public display)
                    </p>
                    <p className="text-xs text-slate-500">
                      Use only for typo/privacy cleanup. Do not change the parent's meaning.
                    </p>
                    <Textarea
                      value={editText}
                      onChange={(event) => setEditText(event.target.value)}
                      rows={3}
                      placeholder="Minor cleanup only (typos, punctuation, privacy redaction)."
                    />
                    <Input
                      value={editReason}
                      onChange={(event) => setEditReason(event.target.value)}
                      placeholder="Edit reason (optional)"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveEdit(item)}
                        disabled={actionId === item.id}
                      >
                        Save edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={actionId === item.id}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span>
                    Course tags: {item.courseTags.length ? item.courseTags.join(', ') : '—'}
                  </span>
                  <span>
                    Page tags: {item.pageTags.length ? item.pageTags.join(', ') : '—'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.status !== 'approved' ? (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item)}
                      disabled={actionId === item.id}
                    >
                      Approve
                    </Button>
                  ) : null}

                  {item.status !== 'rejected' ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(item)}
                      disabled={actionId === item.id}
                    >
                      Reject
                    </Button>
                  ) : null}

                  {item.status !== 'pending' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveToPending(item)}
                      disabled={actionId === item.id}
                    >
                      Move to pending
                    </Button>
                  ) : null}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleFeatured(item)}
                    disabled={actionId === item.id || item.status !== 'approved'}
                    title={item.status !== 'approved' ? 'Only approved testimonials can be featured' : undefined}
                  >
                    {item.isFeatured ? 'Unfeature' : 'Feature'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => beginEdit(item)}
                    disabled={actionId === item.id}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
