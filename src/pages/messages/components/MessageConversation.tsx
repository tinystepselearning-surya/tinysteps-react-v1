import type { KeyboardEvent } from 'react';
import { ChevronLeft, Send } from 'lucide-react';
import { cn } from '@components/lib/utils';
import { MessageAvatar } from './MessageThreadList';

type MessageConversationHeaderProps = {
  title: string;
  participantSummary: string;
  onBack: () => void;
  nativeFocus: boolean;
};

export function MessageConversationHeader({
  title,
  participantSummary,
  onBack,
  nativeFocus,
}: MessageConversationHeaderProps) {
  return (
    <header
      className={cn(
        'shrink-0 border-b border-slate-200/80 bg-white px-2 py-2',
        nativeFocus && 'ts-chat-focus-header',
      )}
      data-testid="message-conversation-header"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 lg:hidden"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <MessageAvatar title={title} decorative className="h-10 w-10 text-xs" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-slate-950" tabIndex={-1}>
            {title}
          </h2>
          <p className="truncate text-xs text-slate-500" title={participantSummary}>
            {participantSummary}
          </p>
        </div>
      </div>
    </header>
  );
}

type MessageBubbleProps = {
  isOwn: boolean;
  senderLabel: string;
  showSenderLabel: boolean;
  text: string;
  isSafetyFiltered: boolean;
  timeLabel: string;
  dateTime?: string;
  isReadByOther: boolean;
};

export function MessageBubble({
  isOwn,
  senderLabel,
  showSenderLabel,
  text,
  isSafetyFiltered,
  timeLabel,
  dateTime,
  isReadByOther,
}: MessageBubbleProps) {
  return (
    <article
      className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
      aria-label={isOwn ? 'Message sent by you' : `Message from ${senderLabel}`}
      data-message-owner={isOwn ? 'current-user' : 'participant'}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 shadow-sm',
          isOwn
            ? 'rounded-br-md bg-slate-900 text-white'
            : 'rounded-bl-md border border-slate-200 bg-white text-slate-900',
        )}
      >
        {!isOwn && showSenderLabel ? (
          <p className="mb-1 text-[11px] font-semibold text-slate-600">{senderLabel}</p>
        ) : null}
        <p
          className={cn(
            'select-text whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-5',
            isSafetyFiltered && (isOwn ? 'italic text-slate-200' : 'italic text-slate-600'),
          )}
          data-safety-filtered={isSafetyFiltered ? 'true' : undefined}
        >
          {text}
        </p>
        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1.5 text-[10px]',
            isOwn ? 'text-slate-300' : 'text-slate-500',
          )}
        >
          {timeLabel ? <time dateTime={dateTime}>{timeLabel}</time> : null}
          {isOwn && isReadByOther ? <span>Read</span> : null}
        </div>
      </div>
    </article>
  );
}

export function MessageConversationSkeleton() {
  return (
    <div role="status" aria-label="Loading messages" className="space-y-3">
      <span className="sr-only">Loading messages…</span>
      <div className="h-14 w-3/5 rounded-2xl rounded-bl-md bg-slate-200" />
      <div className="ml-auto h-16 w-2/3 rounded-2xl rounded-br-md bg-slate-300" />
      <div className="h-12 w-1/2 rounded-2xl rounded-bl-md bg-slate-200" />
    </div>
  );
}

type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFocus: () => void;
  isSending: boolean;
  error: string | null;
  helperText: string;
};

export function MessageComposer({
  value,
  onChange,
  onSend,
  onFocus,
  isSending,
  error,
  helperText,
}: MessageComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (value.trim() && !isSending) onSend();
  };

  return (
    <div>
      <p className="sr-only">{helperText}</p>
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Message</span>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={onFocus}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message"
            autoComplete="off"
            className="block min-h-11 max-h-32 w-full resize-none overflow-y-auto rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-base leading-5 text-slate-950 outline-none [field-sizing:content] focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || isSending}
          className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 px-3 text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          aria-label={isSending ? 'Sending message' : 'Send message'}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{isSending ? 'Sending…' : 'Send'}</span>
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
