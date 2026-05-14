import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { db } from '../../lib/firebaseConfig';
import callFunction from '../../lib/callFunctions';
import { hapticSuccess, hapticWarning } from '../../lib/nativeHaptics';
import { isSuperUserEmail } from '../../constants/accessControl';
import { useAuthStore } from '../../store/useAuthStore';
import useMessageThreads, { type MessageThread } from '../../hooks/useMessageThreads';
import useThreadMessages, { type ThreadMessage } from '../../hooks/useThreadMessages';
import useNativeIOSKeyboard from '../../hooks/useNativeIOSKeyboard';

type UserLabel = {
  displayName: string;
  role: string;
};

type SupportedRole = 'admin' | 'parent' | 'teacher' | 'learningPartner';
type ParticipantRole = 'parent' | 'teacher' | 'learningPartner';

const MAX_USER_IDS_PER_QUERY = 10;
const HIDDEN_BY_SAFETY_FILTER = 'Message hidden by safety filter';
const READ_RECEIPT_TOLERANCE_MS = 2000;

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const roleLabelMap: Record<ParticipantRole, string> = {
  parent: 'Parent',
  teacher: 'Teacher',
  learningPartner: 'Learning Partner',
};

const canonicalRole = (value: unknown): SupportedRole | '' => {
  const normalized = asString(value).toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'parent') return 'parent';
  if (normalized === 'teacher') return 'teacher';
  if (normalized === 'learningpartner' || normalized === 'learning-partner') return 'learningPartner';
  return '';
};

const toShortTime = (ms: number | null) => {
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ms));
};

const toThreadTime = (ms: number | null) => {
  if (!ms) return '';
  const date = new Date(ms);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return toShortTime(ms);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const normalizeCallableError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return 'Unable to send message right now. Please try again.';
};

const chunk = <T,>(items: T[], size: number) => {
  const output: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }
  return output;
};

const dedupeIds = (ids: string[]) => {
  const seen = new Set<string>();
  const output: string[] = [];
  ids.forEach((id) => {
    const normalized = asString(id);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    output.push(normalized);
  });
  return output;
};

const isRawThreadLikeName = (value: string) => /^student_[a-z0-9_-]+$/i.test(value.trim());

const containsUnsafeOldMessageContent = (value: string): boolean => {
  const normalized = asString(value);
  if (!normalized) return false;
  if (/\+\s*\d/.test(normalized)) return true;
  if (/\d{5,}/.test(normalized)) return true;
  return false;
};

const sanitizeMessageForDisplay = (value: string): string =>
  containsUnsafeOldMessageContent(value) ? HIDDEN_BY_SAFETY_FILTER : value;

const resolveThreadTitle = (thread: MessageThread): string => {
  const kidName = asString(thread.kidName);
  const studentName = asString(thread.studentName);
  const childName = asString(thread.childName);

  if (kidName && !isRawThreadLikeName(kidName)) return kidName;
  if (studentName && !isRawThreadLikeName(studentName)) return studentName;
  if (childName && !isRawThreadLikeName(childName)) return childName;
  return 'Student conversation';
};

const getUnreadCount = (thread: MessageThread, userId: string | undefined) => {
  if (!userId) return 0;
  const count = Number(thread.unreadCounts[userId] || 0);
  return Number.isFinite(count) ? count : 0;
};

type ReadReceiptState = {
  readByOther: boolean;
  messageCreatedAtMs: number | null;
  candidateReaderCount: number;
  maxOtherReadAtMs: number | null;
};

const getReadReceiptState = (
  thread: MessageThread,
  message: ThreadMessage,
  currentUserId: string | undefined,
): ReadReceiptState => {
  if (!currentUserId || message.senderId !== currentUserId) {
    return {
      readByOther: false,
      messageCreatedAtMs: null,
      candidateReaderCount: 0,
      maxOtherReadAtMs: null,
    };
  }

  const messageMs = Number(message.createdAtMs);
  if (!Number.isFinite(messageMs) || messageMs <= 0) {
    return {
      readByOther: false,
      messageCreatedAtMs: null,
      candidateReaderCount: 0,
      maxOtherReadAtMs: null,
    };
  }

  const candidateReaderIds = dedupeIds([
    ...thread.participantIds,
    ...thread.parentIds,
    ...thread.teacherIds,
    ...thread.learningPartnerIds,
    ...Object.keys(thread.lastReadAtByUser),
  ]).filter((participantId) => {
    const normalizedParticipantId = asString(participantId);
    return Boolean(normalizedParticipantId && normalizedParticipantId !== message.senderId);
  });

  let maxOtherReadAtMs: number | null = null;
  const readByOther = candidateReaderIds.some((participantId) => {
    const normalizedParticipantId = asString(participantId);
    if (!normalizedParticipantId) return false;

    const lastReadMs = Number(thread.lastReadAtByUser[normalizedParticipantId] || 0);
    if (!Number.isFinite(lastReadMs) || lastReadMs <= 0) return false;

    if (maxOtherReadAtMs === null || lastReadMs > maxOtherReadAtMs) {
      maxOtherReadAtMs = lastReadMs;
    }

    return lastReadMs + READ_RECEIPT_TOLERANCE_MS >= messageMs;
  });

  return {
    readByOther,
    messageCreatedAtMs: messageMs,
    candidateReaderCount: candidateReaderIds.length,
    maxOtherReadAtMs,
  };
};

const getParticipantHint = (viewerRole: SupportedRole): string => {
  if (viewerRole === 'parent') return 'Teacher • Learning Partner';
  if (viewerRole === 'teacher') return 'Parent • Learning Partner';
  if (viewerRole === 'learningPartner') return 'Parent • Teacher';
  return 'Parent • Teacher • Learning Partner';
};

const summarizeRoleNames = (rawNames: string[], fallback: string): string => {
  const names = dedupeIds(rawNames.map((item) => asString(item)).filter(Boolean));
  if (names.length === 0) return fallback;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}, ${names[1]}`;
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
};

const getThreadSubtitle = (thread: MessageThread, viewerRole: SupportedRole): string => {
  const parentSummary = summarizeRoleNames(thread.parentNames || [], 'Parent');
  const teacherSummary = summarizeRoleNames(thread.teacherNames || [], 'Teacher');
  const lpSummary = summarizeRoleNames(thread.learningPartnerNames || [], 'Learning Partner');

  if (viewerRole === 'parent') {
    return `Teacher: ${teacherSummary} • Learning Partner: ${lpSummary}`;
  }
  if (viewerRole === 'teacher') {
    return `Parent: ${parentSummary} • Learning Partner: ${lpSummary}`;
  }
  if (viewerRole === 'learningPartner') {
    return `Parent: ${parentSummary} • Teacher: ${teacherSummary}`;
  }
  return `Parent: ${parentSummary} • Teacher: ${teacherSummary} • Learning Partner: ${lpSummary}`;
};

const getRoleIds = (thread: MessageThread) => {
  const parentIds = dedupeIds(thread.parentIds);
  const teacherIds = dedupeIds([thread.teacherId, ...thread.teacherIds]);
  const learningPartnerIds = dedupeIds(thread.learningPartnerIds);
  return { parentIds, teacherIds, learningPartnerIds };
};

const inferRoleForUserId = (thread: MessageThread, userId: string): ParticipantRole | '' => {
  const normalizedUserId = asString(userId);
  if (!normalizedUserId) return '';
  const { parentIds, teacherIds, learningPartnerIds } = getRoleIds(thread);
  if (parentIds.includes(normalizedUserId)) return 'parent';
  if (teacherIds.includes(normalizedUserId)) return 'teacher';
  if (learningPartnerIds.includes(normalizedUserId)) return 'learningPartner';
  const roleFromThread = canonicalRole(thread.participantRoles[normalizedUserId]);
  if (roleFromThread === 'parent' || roleFromThread === 'teacher' || roleFromThread === 'learningPartner') {
    return roleFromThread;
  }
  return '';
};

const participantNameFromThread = (thread: MessageThread, userId: string): string => {
  const byId = asString(thread.participantNames[userId]);
  if (byId) return byId;
  return '';
};

interface MessagesPanelProps {
  embedded?: boolean;
  nativeChatFocus?: boolean;
  autoSelectFirstThread?: boolean;
  routeThreadId?: string | null;
  onThreadChange?: (threadId: string | null) => void;
  onBack?: () => void;
}

export default function MessagesPanel({
  embedded = false,
  nativeChatFocus = false,
  autoSelectFirstThread = true,
  routeThreadId = null,
  onThreadChange,
  onBack,
}: MessagesPanelProps) {
  const { user } = useAuthStore();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(routeThreadId || null);
  const [draft, setDraft] = useState('');
  const [threadSearch, setThreadSearch] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [userLabels, setUserLabels] = useState<Record<string, UserLabel>>({});
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const markReadInFlightRef = useRef<Set<string>>(new Set());
  const lastSelectedThreadIdRef = useRef<string | null>(null);
  const lastIncomingMessageIdByThreadRef = useRef<Record<string, string>>({});
  const readReceiptDebugKeyRef = useRef<Set<string>>(new Set());
  const suppressAutoSelectRef = useRef(false);
  const shouldUseThreadBackHold = embedded && nativeChatFocus;
  const threadMessagesListRef = useRef<HTMLDivElement | null>(null);
  const { keyboardOpen } = useNativeIOSKeyboard({
    hideAccessoryBar: embedded && nativeChatFocus,
  });

  const isAdmin = Boolean(
    user &&
      (user.role === 'admin' || (user.email && isSuperUserEmail(user.email))),
  );

  const viewerRole: SupportedRole = isAdmin
    ? 'admin'
    : canonicalRole(user?.role) || 'parent';

  const { threads, isLoading: isThreadsLoading, error: threadsError } = useMessageThreads({
    userId: user?.uid,
    isAdmin,
  });

  useEffect(() => {
    if (routeThreadId) {
      if (shouldUseThreadBackHold) suppressAutoSelectRef.current = false;
      setSelectedThreadId(routeThreadId);
      return;
    }

    if (
      !selectedThreadId &&
      threads.length > 0 &&
      autoSelectFirstThread &&
      (!shouldUseThreadBackHold || !suppressAutoSelectRef.current)
    ) {
      setSelectedThreadId(threads[0].id);
    }
  }, [autoSelectFirstThread, routeThreadId, selectedThreadId, shouldUseThreadBackHold, threads]);

  useEffect(() => {
    if (!selectedThreadId) return;
    if (threads.length === 0) return;
    const exists = threads.some((thread) => thread.id === selectedThreadId);
    if (!exists) setSelectedThreadId(null);
  }, [selectedThreadId, threads]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [selectedThreadId, threads],
  );
  useEffect(() => {
    onThreadChange?.(selectedThreadId || null);
  }, [onThreadChange, selectedThreadId]);

  const selectedThreadUnread = selectedThread
    ? getUnreadCount(selectedThread, user?.uid)
    : 0;
  const { messages, isLoading: isMessagesLoading, error: messagesError } = useThreadMessages(
    selectedThread?.id || null,
  );
  const latestIncomingMessageId = useMemo(() => {
    const currentUserId = user?.uid;
    if (!currentUserId) return null;

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (asString(message.senderId) && message.senderId !== currentUserId) {
        return message.id;
      }
    }

    return null;
  }, [messages, user?.uid]);

  useEffect(() => {
    const threadId = selectedThread?.id;
    const userId = user?.uid;

    if (!threadId) {
      lastSelectedThreadIdRef.current = null;
      return;
    }
    if (!userId || isAdmin) return;

    const isNewSelection = lastSelectedThreadIdRef.current !== threadId;
    if (isNewSelection) {
      lastSelectedThreadIdRef.current = threadId;
    }
    const previousIncomingId = lastIncomingMessageIdByThreadRef.current[threadId] || '';
    const isNewIncomingMessage = Boolean(
      latestIncomingMessageId && latestIncomingMessageId !== previousIncomingId,
    );
    if (latestIncomingMessageId) {
      lastIncomingMessageIdByThreadRef.current[threadId] = latestIncomingMessageId;
    }

    const shouldMarkRead = isNewSelection || selectedThreadUnread > 0 || isNewIncomingMessage;
    if (!shouldMarkRead) return;
    if (markReadInFlightRef.current.has(threadId)) return;

    markReadInFlightRef.current.add(threadId);
    if (import.meta.env.DEV) {
      const reason = isNewSelection
        ? 'thread-open'
        : isNewIncomingMessage
          ? 'incoming-message'
          : 'unread-count';
      console.info('[messages] mark-read:called', { threadId, reason });
    }
    void callFunction<{ ok: boolean; updated: boolean }, { threadId: string }>(
      'markMessageThreadRead',
      { threadId },
    )
      .catch((error) => {
        console.warn('[messages] markMessageThreadRead failed', {
          threadId,
          message: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        markReadInFlightRef.current.delete(threadId);
      });
  }, [isAdmin, latestIncomingMessageId, selectedThread?.id, selectedThreadUnread, user?.uid]);

  const filteredThreads = useMemo(() => {
    const queryText = threadSearch.trim().toLowerCase();
    if (!queryText) return threads;
    return threads.filter((thread) => resolveThreadTitle(thread).toLowerCase().includes(queryText));
  }, [threadSearch, threads]);

  const selectedRoleIds = useMemo(
    () => (selectedThread ? getRoleIds(selectedThread) : { parentIds: [], teacherIds: [], learningPartnerIds: [] }),
    [selectedThread],
  );

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, selectedThread?.id]);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const node = threadMessagesListRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (!selectedThread?.id) return;
    const timer = window.setTimeout(() => {
      scrollMessagesToBottom('auto');
    }, 50);
    return () => {
      window.clearTimeout(timer);
    };
  }, [scrollMessagesToBottom, selectedThread?.id]);

  useEffect(() => {
    if (!selectedThread?.id || !keyboardOpen) return;
    const timer = window.setTimeout(() => {
      scrollMessagesToBottom('smooth');
    }, 40);
    return () => {
      window.clearTimeout(timer);
    };
  }, [keyboardOpen, scrollMessagesToBottom, selectedThread?.id]);

  useEffect(() => {
    if (!selectedThread) return;

    const senderIds = messages.map((message) => message.senderId);
    const lookupIds = dedupeIds([
      ...selectedRoleIds.parentIds,
      ...selectedRoleIds.teacherIds,
      ...selectedRoleIds.learningPartnerIds,
      ...senderIds,
    ]);

    const missingIds = lookupIds.filter((id) => !userLabels[id]);
    if (missingIds.length === 0) return;

    let isCancelled = false;

    const loadUsers = async () => {
      try {
        const labels: Record<string, UserLabel> = {};
        const chunks = chunk(missingIds, MAX_USER_IDS_PER_QUERY);

        for (const group of chunks) {
          const usersQuery = query(
            collection(db, 'users'),
            where(documentId(), 'in', group),
          );
          const snapshot = await getDocs(usersQuery);
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() || {};
            labels[docSnap.id] = {
              displayName:
                asString(data.displayName) ||
                asString(data.name) ||
                '',
              role: asString(data.role),
            };
          });
        }

        if (!isCancelled) {
          setUserLabels((prev) => ({ ...prev, ...labels }));
        }
      } catch {
        // If user profile reads are blocked, UI falls back to role labels.
      }
    };

    void loadUsers();
    return () => {
      isCancelled = true;
    };
  }, [
    messages,
    selectedRoleIds.learningPartnerIds,
    selectedRoleIds.parentIds,
    selectedRoleIds.teacherIds,
    selectedThread,
    userLabels,
  ]);

  const resolveRoleParticipantName = useCallback((role: ParticipantRole, ids: string[]) => {
    const fromThreadByRoleKey =
      asString(selectedThread?.participantNames?.[role]) ||
      asString(selectedThread?.participantNames?.[roleLabelMap[role].toLowerCase()]);

    const namesFromRoleArray = role === 'parent'
      ? dedupeIds(selectedThread?.parentNames || [])
      : role === 'teacher'
        ? dedupeIds(selectedThread?.teacherNames || [])
        : dedupeIds(selectedThread?.learningPartnerNames || []);

    if (namesFromRoleArray.length > 0) {
      if (namesFromRoleArray.length === 1) return namesFromRoleArray[0];
      if (namesFromRoleArray.length === 2) return `${namesFromRoleArray[0]}, ${namesFromRoleArray[1]}`;
      return `${namesFromRoleArray[0]}, ${namesFromRoleArray[1]} +${namesFromRoleArray.length - 2}`;
    }

    const names = dedupeIds(
      ids.map((id) =>
        participantNameFromThread(selectedThread as MessageThread, id) ||
        asString(userLabels[id]?.displayName),
      ),
    );

    if (names.length > 0) {
      if (names.length === 1) return names[0];
      if (names.length === 2) return `${names[0]}, ${names[1]}`;
      return `${names[0]}, ${names[1]} +${names.length - 2}`;
    }

    if (fromThreadByRoleKey) return fromThreadByRoleKey;
    return roleLabelMap[role];
  }, [selectedThread, userLabels]);

  const visibleParticipants = useMemo(() => {
    if (!selectedThread) return [] as Array<{ label: string; value: string }>;

    if (viewerRole === 'parent') {
      return [
        { label: 'Teacher', value: resolveRoleParticipantName('teacher', selectedRoleIds.teacherIds) },
        { label: 'Learning Partner', value: resolveRoleParticipantName('learningPartner', selectedRoleIds.learningPartnerIds) },
      ];
    }
    if (viewerRole === 'teacher') {
      return [
        { label: 'Parent', value: resolveRoleParticipantName('parent', selectedRoleIds.parentIds) },
        { label: 'Learning Partner', value: resolveRoleParticipantName('learningPartner', selectedRoleIds.learningPartnerIds) },
      ];
    }
    if (viewerRole === 'learningPartner') {
      return [
        { label: 'Parent', value: resolveRoleParticipantName('parent', selectedRoleIds.parentIds) },
        { label: 'Teacher', value: resolveRoleParticipantName('teacher', selectedRoleIds.teacherIds) },
      ];
    }
    return [
      { label: 'Parent', value: resolveRoleParticipantName('parent', selectedRoleIds.parentIds) },
      { label: 'Teacher', value: resolveRoleParticipantName('teacher', selectedRoleIds.teacherIds) },
      { label: 'Learning Partner', value: resolveRoleParticipantName('learningPartner', selectedRoleIds.learningPartnerIds) },
    ];
  }, [resolveRoleParticipantName, selectedRoleIds.learningPartnerIds, selectedRoleIds.parentIds, selectedRoleIds.teacherIds, selectedThread, viewerRole]);

  const handleSelectThread = (threadId: string) => {
    if (shouldUseThreadBackHold) suppressAutoSelectRef.current = false;
    setSelectedThreadId(threadId);
  };

  const handleBackToConversations = () => {
    if (shouldUseThreadBackHold) suppressAutoSelectRef.current = true;
    setSelectedThreadId(null);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!selectedThread?.id || !text) return;

    setIsSending(true);
    setSendError(null);

    try {
      await callFunction<{ messageId: string }, { threadId: string; text: string }>(
        'sendMessage',
        {
          threadId: selectedThread.id,
          text,
        },
      );
      setDraft('');
      hapticSuccess();
      window.setTimeout(() => {
        scrollMessagesToBottom('smooth');
      }, 30);
    } catch (error) {
      hapticWarning();
      setSendError(normalizeCallableError(error));
    } finally {
      setIsSending(false);
    }
  };

  const resolveSenderMeta = (senderId: string) => {
    if (user?.uid && senderId === user.uid) {
      return { displayName: 'You', roleLabel: '' };
    }

    const profile = userLabels[senderId];
    const inferredRole =
      canonicalRole(profile?.role) ||
      inferRoleForUserId(selectedThread as MessageThread, senderId);

    const displayName =
      asString(profile?.displayName) ||
      participantNameFromThread(selectedThread as MessageThread, senderId) ||
      (inferredRole === 'parent' || inferredRole === 'teacher' || inferredRole === 'learningPartner'
        ? roleLabelMap[inferredRole]
        : 'Team Member');

    const roleLabel =
      inferredRole === 'parent' || inferredRole === 'teacher' || inferredRole === 'learningPartner'
        ? roleLabelMap[inferredRole]
        : '';

    return { displayName, roleLabel };
  };

  const showConversationList = !selectedThread;
  const showConversationDetail = Boolean(selectedThread);
  const isEmbeddedNativeChatFocus = embedded && nativeChatFocus && showConversationDetail;
  const threadPaneHeightClass = embedded
    ? 'max-h-[calc(100dvh-var(--ts-mobile-tabbar-reserve)-10rem)] lg:max-h-[52vh]'
    : 'max-h-[72vh]';
  const detailPaneHeightClass = isEmbeddedNativeChatFocus
    ? 'h-full min-h-0'
    : embedded
    ? 'h-[calc(100dvh-var(--ts-mobile-tabbar-reserve)-8.75rem)] min-h-[22rem] lg:h-[52vh] lg:min-h-[360px]'
    : 'h-[72vh] min-h-[420px]';
  const detailEmptyStateClass = embedded ? 'min-h-[14rem] lg:min-h-[360px]' : 'min-h-[420px]';

  useEffect(() => {
    if (!isEmbeddedNativeChatFocus || typeof document === 'undefined') return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isEmbeddedNativeChatFocus]);

  return (
    <div className={embedded
      ? `ts-native-no-x-scroll min-h-0 min-w-0 overflow-x-hidden ${isEmbeddedNativeChatFocus ? 'flex h-[100dvh] flex-col overflow-hidden' : ''}`
      : 'min-h-screen overflow-x-hidden bg-slate-50 pb-safe'}>
      <div className={embedded
        ? `${isEmbeddedNativeChatFocus ? 'flex min-h-0 w-full min-w-0 flex-1 flex-col' : 'w-full min-w-0'}`
        : 'mx-auto w-full max-w-6xl p-3 sm:p-4 lg:p-6'}>
        {!embedded && (
          <header className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Messages</h1>
                  <p className="text-xs text-slate-500">Tiny Steps conversations</p>
                </div>
              </div>
              {onBack ? (
                <Button type="button" variant="outline" size="sm" onClick={onBack}>
                  Back
                </Button>
              ) : null}
            </div>
          </header>
        )}

        <div className={`grid min-w-0 gap-4 lg:grid-cols-[320px,1fr] ${isEmbeddedNativeChatFocus ? 'min-h-0 flex-1 overflow-hidden gap-0' : ''}`}>
          <Card className={`min-w-0 overflow-hidden ${showConversationDetail ? 'lg:block hidden' : ''}`}>
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">Conversations</h2>
              <Input
                value={threadSearch}
                onChange={(event) => setThreadSearch(event.target.value)}
                placeholder="Search student name"
                className="mt-2"
              />
            </div>
            <div className={`${threadPaneHeightClass} overflow-y-auto p-2 [-webkit-overflow-scrolling:touch]`}>
              {isThreadsLoading ? (
                <div className="px-3 py-6 text-sm text-slate-500">Loading conversations…</div>
              ) : threadsError ? (
                <div className="px-3 py-6 text-sm text-red-600">{threadsError}</div>
              ) : threads.length === 0 ? (
                <div className="space-y-2 px-3 py-6 text-sm text-slate-500">
                  <p>No conversations yet.</p>
                  <p className="text-xs text-slate-400">
                    Your Tiny Steps conversation will appear here once your child&apos;s communication room is created.
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-slate-400">
                      Create/sync a student thread from Admin Settings if needed.
                    </p>
                  )}
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="px-3 py-6 text-sm text-slate-500">
                  No conversations match this student name.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredThreads.map((thread) => {
                    const isSelected = thread.id === selectedThread?.id;
                    const unreadCount = getUnreadCount(thread, user?.uid);
                    const activityMs = thread.lastMessageAtMs ?? thread.updatedAtMs;
                    const threadTitle = resolveThreadTitle(thread);
                    const lastPreview = sanitizeMessageForDisplay(thread.lastMessagePreview || '');
                    const subtitle = getThreadSubtitle(thread, viewerRole) || getParticipantHint(viewerRole);

                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => handleSelectThread(thread.id)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`truncate text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {threadTitle}
                          </p>
                          <span className={`shrink-0 text-[11px] ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                            {toThreadTime(activityMs)}
                          </span>
                        </div>
                        <p className={`mt-1 truncate text-[11px] ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                          {subtitle}
                        </p>
                        <p className={`mt-1 truncate text-xs ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                          {lastPreview || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <div className="mt-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              Unread {unreadCount}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card className={`min-w-0 overflow-hidden ${showConversationList ? 'lg:block hidden' : ''} ${isEmbeddedNativeChatFocus ? 'ts-chat-focus-screen ts-native-no-x-scroll rounded-none border-0 shadow-none' : ''}`}>
            {!showConversationDetail ? (
              <div className={`flex items-center justify-center px-6 text-center text-sm text-slate-500 ${detailEmptyStateClass}`}>
                Select a conversation to view messages.
              </div>
            ) : (
              <div className={`flex min-w-0 flex-col overflow-hidden ${detailPaneHeightClass}`}>
                <div className={`border-b border-slate-200 px-4 py-3 ${isEmbeddedNativeChatFocus ? 'ts-chat-focus-header' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-slate-900">{resolveThreadTitle(selectedThread!)}</h2>
                      <p className="text-xs text-slate-500">Tiny Steps conversation</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="lg:hidden"
                      onClick={handleBackToConversations}
                    >
                      Back
                    </Button>
                  </div>

                  {!isEmbeddedNativeChatFocus && (
                    <>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {visibleParticipants.map((item) => (
                          <span key={item.label} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
                            {item.label}: {item.value}
                          </span>
                        ))}
                      </div>

                      <p className="mt-2 text-[11px] text-slate-500">
                        {viewerRole === 'admin'
                          ? 'Admin oversight view'
                          : 'Tiny Steps may review conversations for safety and support.'}
                      </p>
                      {viewerRole === 'admin' && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Admin oversight is read-only here.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div ref={threadMessagesListRef} className={`min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-3 [-webkit-overflow-scrolling:touch] ${
                  isEmbeddedNativeChatFocus ? 'ts-chat-focus-list' : ''
                } ${
                  embedded ? (isEmbeddedNativeChatFocus ? 'pb-4' : 'pb-24') : 'pb-4'
                }`}>
                  {isMessagesLoading ? (
                    <p className="text-sm text-slate-500">Loading messages…</p>
                  ) : messagesError ? (
                    <p className="text-sm text-red-600">{messagesError}</p>
                  ) : messages.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-sm font-medium text-slate-700">No messages yet.</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Type your message below to start this conversation.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = Boolean(user?.uid && message.senderId === user.uid);
                      const readReceiptState =
                        isOwn && selectedThread
                          ? getReadReceiptState(selectedThread, message, user?.uid)
                          : {
                              readByOther: false,
                              messageCreatedAtMs: null,
                              candidateReaderCount: 0,
                              maxOtherReadAtMs: null,
                            };
                      const isReadByAnyOther = readReceiptState.readByOther;
                      const sender = resolveSenderMeta(message.senderId);
                      const senderMeta = sender.roleLabel && sender.displayName !== sender.roleLabel
                        ? `${sender.displayName} • ${sender.roleLabel}`
                        : sender.displayName;

                      if (import.meta.env.DEV && isOwn && selectedThread) {
                        const debugKey = [
                          selectedThread.id,
                          message.id,
                          readReceiptState.readByOther ? '1' : '0',
                          String(readReceiptState.maxOtherReadAtMs || 0),
                        ].join(':');
                        if (!readReceiptDebugKeyRef.current.has(debugKey)) {
                          readReceiptDebugKeyRef.current.add(debugKey);
                          if (readReceiptDebugKeyRef.current.size > 1000) {
                            readReceiptDebugKeyRef.current.clear();
                          }
                          console.info('[messages] read-receipt:debug', {
                            threadId: selectedThread.id,
                            messageId: message.id,
                            isMine: isOwn,
                            messageCreatedAtMs: readReceiptState.messageCreatedAtMs,
                            candidateReaderCount: readReceiptState.candidateReaderCount,
                            maxOtherReadAtMs: readReceiptState.maxOtherReadAtMs,
                            readByOther: readReceiptState.readByOther,
                          });
                        }
                      }

                      return (
                        <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                              isOwn
                                ? 'bg-slate-900 text-white'
                                : 'border border-slate-200 bg-white text-slate-900'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-[11px] font-semibold text-slate-500">
                                {senderMeta}
                              </p>
                            )}
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                              {sanitizeMessageForDisplay(message.text)}
                            </p>
                            <p className={`mt-1 text-[11px] ${isOwn ? 'text-slate-300' : 'text-slate-400'}`}>
                              {toShortTime(message.createdAtMs)}
                            </p>
                            {isOwn && isReadByAnyOther && (
                              <p className="mt-1 text-[11px] text-slate-300">
                                Read
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={listEndRef} />
                </div>

                <div className={`shrink-0 border-t border-slate-200 bg-white px-3 pt-3 ${
                  isEmbeddedNativeChatFocus ? 'ts-chat-focus-composer' : ''
                } ${
                  embedded
                    ? isEmbeddedNativeChatFocus
                      ? 'pb-[max(env(safe-area-inset-bottom,0px),0.5rem)]'
                      : 'sticky bottom-0 z-10 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]'
                    : 'sticky bottom-0 z-10 pb-safe'
                }`}>
                  {viewerRole === 'admin' ? (
                    <p className="pb-2 text-xs text-slate-500">
                      Admin oversight is read-only here.
                    </p>
                  ) : (
                    <>
                      <p className="pb-2 text-xs text-slate-500">
                        {viewerRole === 'parent'
                          ? 'Message your Teacher and Learning Partner here.'
                          : viewerRole === 'teacher'
                            ? 'Message the Parent and Learning Partner here.'
                            : viewerRole === 'learningPartner'
                              ? 'Message the Parent and Teacher here.'
                              : 'Message participants here.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          placeholder="Type your message"
                          autoComplete="off"
                          className="min-h-11 text-base"
                          onFocus={() => {
                            window.setTimeout(() => {
                              scrollMessagesToBottom('smooth');
                            }, 30);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              if (!isSending) void handleSend();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => void handleSend()}
                          disabled={!draft.trim() || isSending}
                          className="min-h-11 shrink-0 gap-1"
                        >
                          <Send className="h-4 w-4" />
                          {isSending ? 'Sending…' : 'Send'}
                        </Button>
                      </div>
                      {sendError && (
                        <p className="mt-2 text-xs text-red-600">{sendError}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
