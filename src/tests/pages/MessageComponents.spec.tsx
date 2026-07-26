import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MessageThreadList, {
  getMessageInitials,
  type MessageThreadRowViewModel,
} from '../../pages/messages/components/MessageThreadList';
import {
  MessageBubble,
  MessageComposer,
  MessageConversationHeader,
} from '../../pages/messages/components/MessageConversation';

const rows: MessageThreadRowViewModel[] = [
  {
    id: 'thread-2',
    title: 'Shreenika',
    participantSummary: 'Suguna · Learning Partner',
    fullParticipantSummary: 'Teacher: Suguna · Learning Partner: Learning Partner',
    preview: 'New class update',
    activityLabel: '10:30 am',
    activityDateTime: '2026-07-26T05:00:00.000Z',
    unreadCount: 108,
    isSelected: false,
  },
  {
    id: 'thread-1',
    title: 'Aarav Kumar',
    participantSummary: 'Teacher · Learning Partner',
    fullParticipantSummary: 'Teacher: Teacher · Learning Partner: Learning Partner',
    preview: 'No messages yet',
    activityLabel: '25 Jul',
    activityDateTime: '2026-07-25T05:00:00.000Z',
    unreadCount: 0,
    isSelected: true,
  },
];

function SearchHarness() {
  const [search, setSearch] = useState('');
  const filteredRows = rows.filter((row) =>
    row.title.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <MessageThreadList
      threads={filteredRows}
      totalThreadCount={rows.length}
      search={search}
      onSearchChange={setSearch}
      onClearSearch={() => setSearch('')}
      onSelectThread={vi.fn()}
      isLoading={false}
      error={null}
      emptyMessage="A participant can start the first update."
    />
  );
}

describe('message presentation components', () => {
  it('derives deterministic initials for one-word and multi-word titles', () => {
    expect(getMessageInitials('Shreenika')).toBe('SH');
    expect(getMessageInitials('Aarav Kumar')).toBe('AK');
    expect(getMessageInitials('  ')).toBe('TS');
  });

  it('keeps supplied thread order and exposes identity, participants, preview, time, and unread state', () => {
    const onSelectThread = vi.fn();
    render(
      <MessageThreadList
        threads={rows}
        totalThreadCount={rows.length}
        search=""
        onSearchChange={vi.fn()}
        onClearSearch={vi.fn()}
        onSelectThread={onSelectThread}
        isLoading={false}
        error={null}
        emptyMessage="A participant can start the first update."
      />,
    );

    const buttons = screen.getAllByRole('button', { name: /conversation/i });
    expect(buttons[0]).toHaveAccessibleName(/Shreenika conversation/);
    expect(buttons[1]).toHaveAccessibleName(/Aarav Kumar conversation/);
    expect(within(buttons[0]).getByText('SH')).toBeVisible();
    expect(within(buttons[0]).getByText('Suguna · Learning Partner')).toBeVisible();
    expect(within(buttons[0]).getByText('New class update')).toBeVisible();
    expect(within(buttons[0]).getByText('10:30 am')).toBeVisible();
    expect(within(buttons[0]).getByTestId('message-unread-dot')).toBeVisible();
    expect(within(buttons[0]).getByTestId('message-unread-count')).toHaveTextContent('99+');
    expect(buttons[1]).toHaveAttribute('aria-current', 'true');

    fireEvent.click(buttons[1]);
    expect(onSelectThread).toHaveBeenCalledWith('thread-1');
  });

  it('filters locally, distinguishes no results, and clears back to the full list', () => {
    render(<SearchHarness />);

    const search = screen.getByRole('searchbox', {
      name: 'Search conversations by student or thread title',
    });
    fireEvent.change(search, { target: { value: 'missing' } });
    expect(screen.getByText('No conversations match “missing”.')).toBeVisible();
    expect(screen.queryByText('No conversations yet.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear conversation search' }));
    expect(screen.getByText('Shreenika')).toBeVisible();
    expect(screen.getByText('Aarav Kumar')).toBeVisible();
  });

  it('distinguishes skeleton loading and the no-conversations state', () => {
    const commonProps = {
      threads: [],
      totalThreadCount: 0,
      search: '',
      onSearchChange: vi.fn(),
      onClearSearch: vi.fn(),
      onSelectThread: vi.fn(),
      error: null,
      emptyMessage: 'Your child’s teacher can start the first update.',
    };
    const view = render(<MessageThreadList {...commonProps} isLoading />);

    expect(screen.getByRole('status', { name: 'Loading conversations' })).toBeVisible();
    expect(screen.getAllByTestId('message-thread-skeleton')).toHaveLength(4);

    view.rerender(<MessageThreadList {...commonProps} isLoading={false} />);
    expect(screen.getByText('No conversations yet.')).toBeVisible();
    expect(screen.getByText(/teacher can start the first update/)).toBeVisible();
  });

  it('renders a compact header and calls its existing back seam', () => {
    const onBack = vi.fn();
    render(
      <MessageConversationHeader
        title="Aarav Kumar"
        participantSummary="Teacher: Suguna · Learning Partner: Priya"
        onBack={onBack}
        nativeFocus
      />,
    );

    expect(screen.getByText('AK')).toBeVisible();
    expect(screen.getByText('Aarav Kumar')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Back to conversations' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('uses distinct message semantics, preserves wrapping, and limits read receipts to own messages', () => {
    render(
      <>
        <MessageBubble
          isOwn={false}
          senderLabel="Suguna • Teacher"
          showSenderLabel
          text="Averylonguninterruptedmessagethatmustwrap"
          isSafetyFiltered={false}
          timeLabel="10:00 am"
          isReadByOther
        />
        <MessageBubble
          isOwn
          senderLabel="You"
          showSenderLabel={false}
          text={'Thanks\nfor the update'}
          isSafetyFiltered={false}
          timeLabel="10:01 am"
          isReadByOther
        />
      </>,
    );

    const participantMessage = screen.getByLabelText('Message from Suguna • Teacher');
    const ownMessage = screen.getByLabelText('Message sent by you');
    expect(participantMessage).toHaveAttribute('data-message-owner', 'participant');
    expect(participantMessage).not.toHaveTextContent('Read');
    expect(ownMessage).toHaveAttribute('data-message-owner', 'current-user');
    expect(ownMessage).toHaveTextContent('Read');
    expect(within(ownMessage).getByText(/Thanks/)).toHaveClass('[overflow-wrap:anywhere]');
  });

  it('keeps composer validation and multiline keyboard behavior accessible', () => {
    const onSend = vi.fn();
    const view = render(
      <MessageComposer
        value="   "
        onChange={vi.fn()}
        onSend={onSend}
        onFocus={vi.fn()}
        isSending={false}
        error={null}
        helperText="Message participants."
      />,
    );
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();

    view.rerender(
      <MessageComposer
        value="Hello"
        onChange={vi.fn()}
        onSend={onSend}
        onFocus={vi.fn()}
        isSending={false}
        error={null}
        helperText="Message participants."
      />,
    );
    const composer = screen.getByRole('textbox', { name: 'Message' });
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
    fireEvent.keyDown(composer, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(composer, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledOnce();
  });
});
