import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@components/lib/utils';

const AVATAR_TONES = [
  'bg-sky-100 text-sky-800',
  'bg-indigo-100 text-indigo-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
] as const;

export const getMessageInitials = (title: string): string => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'TS';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const getAvatarTone = (title: string): string => {
  const hash = Array.from(title).reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

type MessageAvatarProps = {
  title: string;
  className?: string;
  decorative?: boolean;
};

export function MessageAvatar({
  title,
  className,
  decorative = false,
}: MessageAvatarProps) {
  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold tracking-wide',
        getAvatarTone(title),
        className,
      )}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : `${title} conversation`}
      data-testid="message-avatar"
    >
      {getMessageInitials(title)}
    </span>
  );
}

export type MessageThreadRowViewModel = {
  id: string;
  title: string;
  participantSummary: string;
  fullParticipantSummary: string;
  preview: string;
  activityLabel: string;
  activityDateTime?: string;
  unreadCount: number;
  isSelected: boolean;
};

type MessageThreadRowProps = {
  thread: MessageThreadRowViewModel;
  onSelect: (threadId: string) => void;
  focusOnMount?: boolean;
};

export function MessageThreadRow({
  thread,
  onSelect,
  focusOnMount = false,
}: MessageThreadRowProps) {
  const rowRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (focusOnMount) rowRef.current?.focus();
  }, [focusOnMount]);

  const unreadLabel = thread.unreadCount > 0
    ? `${thread.unreadCount} unread ${thread.unreadCount === 1 ? 'message' : 'messages'}`
    : 'No unread messages';
  const unreadCountLabel = thread.unreadCount > 99 ? '99+' : String(thread.unreadCount);

  return (
    <button
      ref={rowRef}
      type="button"
      onClick={() => onSelect(thread.id)}
      aria-current={thread.isSelected ? 'true' : undefined}
      aria-label={`${thread.title} conversation. ${thread.fullParticipantSummary}. ${unreadLabel}. ${thread.preview}`}
      className={cn(
        'group flex min-h-[72px] w-full min-w-0 items-center gap-3 border-b border-slate-200/80 px-3 py-2.5 text-left outline-none transition-colors last:border-b-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-600',
        'hover:bg-slate-50 active:bg-slate-100',
        thread.isSelected && 'lg:bg-slate-100',
      )}
      data-unread={thread.unreadCount > 0 ? 'true' : 'false'}
      data-testid={`message-thread-${thread.id}`}
    >
      <MessageAvatar title={thread.title} decorative />

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-baseline gap-2">
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-sm text-slate-900',
              thread.unreadCount > 0 ? 'font-bold' : 'font-semibold',
            )}
          >
            {thread.title}
          </span>
          {thread.activityLabel ? (
            <time
              className={cn(
                'shrink-0 text-[11px]',
                thread.unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-500',
              )}
              dateTime={thread.activityDateTime}
            >
              {thread.activityLabel}
            </time>
          ) : null}
        </span>

        <span
          className="mt-0.5 block truncate text-xs text-slate-500"
          title={thread.fullParticipantSummary}
        >
          {thread.participantSummary}
        </span>

        <span className="mt-0.5 flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-xs',
              thread.unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-500',
            )}
          >
            {thread.preview}
          </span>
          {thread.unreadCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1" aria-label={unreadLabel}>
              <span
                className="h-2 w-2 rounded-full bg-sky-600"
                aria-hidden="true"
                data-testid="message-unread-dot"
              />
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                data-testid="message-unread-count"
              >
                {unreadCountLabel}
              </span>
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function MessageListSkeleton() {
  return (
    <div role="status" aria-label="Loading conversations" className="divide-y divide-slate-200/80">
      <span className="sr-only">Loading conversations…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex min-h-[72px] items-center gap-3 px-3 py-2.5"
          data-testid="message-thread-skeleton"
        >
          <span className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-2/5 rounded bg-slate-200" />
            <span className="block h-2.5 w-3/5 rounded bg-slate-100" />
            <span className="block h-2.5 w-4/5 rounded bg-slate-100" />
          </span>
          <span className="h-2.5 w-9 self-start rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

type MessageThreadListProps = {
  threads: MessageThreadRowViewModel[];
  totalThreadCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSelectThread: (threadId: string) => void;
  isLoading: boolean;
  error: string | null;
  emptyMessage: string;
  focusThreadId?: string | null;
};

export default function MessageThreadList({
  threads,
  totalThreadCount,
  search,
  onSearchChange,
  onClearSearch,
  onSelectThread,
  isLoading,
  error,
  emptyMessage,
  focusThreadId = null,
}: MessageThreadListProps) {
  return (
    <section aria-labelledby="message-conversations-title" className="min-w-0 bg-white">
      <div className="border-b border-slate-200/80 px-3 pb-2.5 pt-3">
        <h2 id="message-conversations-title" className="sr-only">
          Conversations
        </h2>
        <label className="relative block">
          <span className="sr-only">Search conversations by student or thread title</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search conversations"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100/80 py-2 pl-9 pr-11 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 md:text-sm"
          />
          {search ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
              aria-label="Clear conversation search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </label>
      </div>

      {isLoading ? (
        <MessageListSkeleton />
      ) : error ? (
        <div role="alert" className="px-4 py-8 text-sm text-red-700">
          {error}
        </div>
      ) : totalThreadCount === 0 ? (
        <div className="px-4 py-8 text-sm text-slate-600">
          <p className="font-medium text-slate-800">No conversations yet.</p>
          <p className="mt-1 text-xs leading-5">{emptyMessage}</p>
        </div>
      ) : threads.length === 0 ? (
        <div role="status" className="px-4 py-8 text-sm text-slate-600">
          No conversations match “{search.trim()}”.
        </div>
      ) : (
        <div>
          {threads.map((thread) => (
            <MessageThreadRow
              key={thread.id}
              thread={thread}
              onSelect={onSelectThread}
              focusOnMount={focusThreadId === thread.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
