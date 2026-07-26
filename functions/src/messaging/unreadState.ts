export const normalizeUnread = (value: unknown): number => {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
};

export const incrementUnreadCount = (value: unknown): number =>
  normalizeUnread(value) + 1;

export const clearThreadUnreadFromAggregate = (
  aggregateValue: unknown,
  threadUnreadValue: unknown,
) => {
  const unreadCleared = normalizeUnread(threadUnreadValue);
  const unreadMessages = Math.max(0, normalizeUnread(aggregateValue) - unreadCleared);
  return { unreadCleared, unreadMessages };
};

export const sumUnreadForUser = (
  threads: Array<Record<string, unknown>>,
  userId: string,
): number => threads.reduce((total, thread) => {
  const unreadCounts =
    thread.unreadCounts && typeof thread.unreadCounts === 'object'
      ? thread.unreadCounts as Record<string, unknown>
      : {};
  return total + normalizeUnread(unreadCounts[userId]);
}, 0);

export const incrementRecipientUnreadCounts = (
  recipients: Array<{
    userId: string;
    threadUnread: unknown;
    aggregateUnread: unknown;
  }>,
) => recipients.map((recipient) => ({
  userId: recipient.userId,
  threadUnread: incrementUnreadCount(recipient.threadUnread),
  aggregateUnread: incrementUnreadCount(recipient.aggregateUnread),
}));
