import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

import { useToast } from '@components/hooks/use-toast';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { db } from '../../lib/firebaseConfig';
import {
  CLASS_SAMPLE_CATEGORIES,
  CLASS_SAMPLE_CATEGORY_LABELS,
  extractYouTubeVideoId,
  normalizeYouTubeUrl,
  toClassSampleItem,
  type ClassSampleCategory,
  type ClassSampleItem,
} from '../../lib/classSamples';
import { useAuthStore } from '../../store/useAuthStore';

type ClassSampleFormState = {
  title: string;
  description: string;
  category: ClassSampleCategory;
  ageBand: string;
  durationLabel: string;
  youtubeUrl: string;
  featured: boolean;
  active: boolean;
  sortOrder: string;
};

type FormErrors = Partial<Record<'title' | 'description' | 'category' | 'youtubeUrl' | 'sortOrder', string>>;

const INITIAL_FORM: ClassSampleFormState = {
  title: '',
  description: '',
  category: 'phonics',
  ageBand: '',
  durationLabel: '',
  youtubeUrl: '',
  featured: false,
  active: true,
  sortOrder: '0',
};

const toMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (typeof value?.seconds === 'number') return Number(value.seconds) * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function ClassSamplesManagement(): JSX.Element {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [form, setForm] = useState<ClassSampleFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const classSamplesQuery = useQuery({
    queryKey: ['adminClassSamples'],
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<ClassSampleItem[]> => {
      const ref = query(collection(db, 'classSamples'), orderBy('sortOrder', 'asc'), limit(400));
      const snap = await getDocs(ref);
      return snap.docs.map((entry) => toClassSampleItem(entry.id, entry.data()));
    },
  });

  const items = useMemo(() => {
    const list = classSamplesQuery.data ?? [];
    return [...list].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return toMillis(b.updatedAt) - toMillis(a.updatedAt);
    });
  }, [classSamplesQuery.data]);

  const parsedVideoId = useMemo(() => extractYouTubeVideoId(form.youtubeUrl), [form.youtubeUrl]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setEditingId(null);
  };

  const updateField = <K extends keyof ClassSampleFormState>(key: K, value: ClassSampleFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateForm = (): { nextErrors: FormErrors; youtubeVideoId: string | null; sortOrder: number } => {
    const nextErrors: FormErrors = {};
    const title = form.title.trim();
    const description = form.description.trim();
    const youtubeVideoId = extractYouTubeVideoId(form.youtubeUrl);
    const sortOrder = Number(form.sortOrder);

    if (!title) nextErrors.title = 'Title is required.';
    if (!description) nextErrors.description = 'Description is required.';
    if (!form.category) nextErrors.category = 'Category is required.';
    if (!form.youtubeUrl.trim()) nextErrors.youtubeUrl = 'YouTube URL is required.';
    else if (!youtubeVideoId) nextErrors.youtubeUrl = 'Paste a valid YouTube watch or share URL.';
    if (!form.sortOrder.trim()) nextErrors.sortOrder = 'Sort order is required.';
    else if (!Number.isFinite(sortOrder)) nextErrors.sortOrder = 'Sort order must be numeric.';

    return { nextErrors, youtubeVideoId, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 };
  };

  const handleSave = async () => {
    const { nextErrors, youtubeVideoId, sortOrder } = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !youtubeVideoId) return;

    const youtubeUrl = normalizeYouTubeUrl(form.youtubeUrl);
    if (!youtubeUrl) {
      setErrors((prev) => ({ ...prev, youtubeUrl: 'Paste a valid YouTube watch or share URL.' }));
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      ageBand: form.ageBand.trim(),
      durationLabel: form.durationLabel.trim(),
      youtubeUrl,
      youtubeVideoId,
      featured: form.featured,
      active: form.active,
      sortOrder,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid || null,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'classSamples', editingId), payload);
        toast({ title: 'Class sample updated' });
      } else {
        await addDoc(collection(db, 'classSamples'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user?.uid || null,
        });
        toast({ title: 'Class sample added' });
      }

      resetForm();
      await classSamplesQuery.refetch();
    } catch (error: any) {
      console.error('[ClassSamplesManagement] save failed', error);
      toast({
        title: 'Save failed',
        description: error?.message || 'Could not save class sample.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: ClassSampleItem) => {
    setEditingId(item.id);
    setErrors({});
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      ageBand: item.ageBand || '',
      durationLabel: item.durationLabel || '',
      youtubeUrl: item.youtubeUrl || '',
      featured: item.featured,
      active: item.active,
      sortOrder: String(item.sortOrder ?? 0),
    });
  };

  const handleDelete = async (item: ClassSampleItem) => {
    const confirmed = window.confirm(`Delete class sample "${item.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setActionId(item.id);
    try {
      await deleteDoc(doc(db, 'classSamples', item.id));
      await classSamplesQuery.refetch();
      if (editingId === item.id) resetForm();
      toast({ title: 'Class sample deleted' });
    } catch (error: any) {
      console.error('[ClassSamplesManagement] delete failed', error);
      toast({
        title: 'Delete failed',
        description: error?.message || 'Could not delete class sample.',
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleToggleActive = async (item: ClassSampleItem) => {
    setActionId(item.id);
    try {
      await updateDoc(doc(db, 'classSamples', item.id), {
        active: !item.active,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
      });
      await classSamplesQuery.refetch();
      toast({ title: item.active ? 'Class sample hidden' : 'Class sample activated' });
    } catch (error: any) {
      console.error('[ClassSamplesManagement] active toggle failed', error);
      toast({
        title: 'Update failed',
        description: error?.message || 'Could not update active status.',
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-slate-900">Class Samples</h2>
          <p className="text-sm text-slate-600">
            Manage the YouTube class clips shown on the public class samples page.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{editingId ? 'Edit clip' : 'Add clip'}</h3>
              <p className="text-sm text-slate-600">Paste a normal YouTube URL. The video ID is extracted automatically.</p>
            </div>
            {editingId ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class-sample-title">Title</Label>
              <Input
                id="class-sample-title"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Blending short vowel words"
              />
              {errors.title ? <p className="text-sm text-red-600">{errors.title}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-sample-description">Description</Label>
              <Textarea
                id="class-sample-description"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="See how we guide a child from separate sounds to smooth blending."
                rows={4}
              />
              {errors.description ? <p className="text-sm text-red-600">{errors.description}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => updateField('category', value as ClassSampleCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_SAMPLE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CLASS_SAMPLE_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category ? <p className="text-sm text-red-600">{errors.category}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class-sample-age-band">Age Band</Label>
                <Input
                  id="class-sample-age-band"
                  value={form.ageBand}
                  onChange={(event) => updateField('ageBand', event.target.value)}
                  placeholder="4–6 years"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-sample-duration">Duration Label</Label>
                <Input
                  id="class-sample-duration"
                  value={form.durationLabel}
                  onChange={(event) => updateField('durationLabel', event.target.value)}
                  placeholder="42 sec"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-sample-youtube-url">YouTube URL</Label>
              <Input
                id="class-sample-youtube-url"
                value={form.youtubeUrl}
                onChange={(event) => updateField('youtubeUrl', event.target.value)}
                placeholder="https://www.youtube.com/watch?v=abc123DEF45"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {parsedVideoId ? (
                <p className="text-xs text-slate-500">Detected video ID: {parsedVideoId}</p>
              ) : (
                <p className="text-xs text-slate-500">Supports `youtube.com/watch`, `youtu.be`, `shorts`, and `embed` links.</p>
              )}
              {errors.youtubeUrl ? <p className="text-sm text-red-600">{errors.youtubeUrl}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class-sample-sort-order">Sort Order</Label>
                <Input
                  id="class-sample-sort-order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => updateField('sortOrder', event.target.value)}
                  placeholder="0"
                />
                {errors.sortOrder ? <p className="text-sm text-red-600">{errors.sortOrder}</p> : null}
              </div>

              <div className="grid gap-3 pt-7">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => updateField('featured', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => updateField('active', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                  Active
                </label>
              </div>
            </div>

            <Button type="button" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? 'Update clip' : 'Add clip'}
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">All clips</h3>
              <p className="text-sm text-slate-600">Sorted by `sortOrder` ascending. Only active clips appear publicly.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => classSamplesQuery.refetch()}
              disabled={classSamplesQuery.isFetching}
            >
              {classSamplesQuery.isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {classSamplesQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading class samples...
            </div>
          ) : classSamplesQuery.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
              Failed to load class samples. Try refresh.
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
              No class samples yet. Add the first clip using the form.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3 font-medium">Title</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Sort</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isActing = actionId === item.id;
                    return (
                      <tr key={item.id} className="border-b border-slate-100 align-top last:border-b-0">
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-900">{item.title || 'Untitled clip'}</div>
                          <div className="mt-1 max-w-[340px] text-xs leading-5 text-slate-500">{item.description || '—'}</div>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{CLASS_SAMPLE_CATEGORY_LABELS[item.category]}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.active ? 'Active' : 'Hidden'}
                            </span>
                            {item.featured ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                Featured
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{item.sortOrder}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(item)}
                              disabled={isActing}
                            >
                              {isActing ? 'Saving...' : item.active ? 'Hide' : 'Activate'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDelete(item)}
                              disabled={isActing}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
