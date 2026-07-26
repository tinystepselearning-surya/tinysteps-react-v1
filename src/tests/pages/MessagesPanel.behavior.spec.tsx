import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageThread } from '../../hooks/useMessageThreads';
import type { ThreadMessage } from '../../hooks/useThreadMessages';
import MessagesPanel from '../../pages/messages/MessagesPanel';
import useAuthStore from '../../store/useAuthStore';

const {
  callFunctionMock,
  getDocsMock,
  hapticSuccessMock,
  hapticWarningMock,
  useMessageThreadsMock,
  useThreadMessagesMock,
} = vi.hoisted(() => ({
  callFunctionMock: vi.fn(),
  getDocsMock: vi.fn(() => Promise.resolve({ forEach: vi.fn() })),
  hapticSuccessMock: vi.fn(),
  hapticWarningMock: vi.fn(),
  useMessageThreadsMock: vi.fn(),
  useThreadMessagesMock: vi.fn(),
}));

vi.mock('../../hooks/useMessageThreads', () => ({ default: useMessageThreadsMock }));
vi.mock('../../hooks/useThreadMessages', () => ({ default: useThreadMessagesMock }));
vi.mock('../../hooks/useNativeIOSKeyboard', () => ({
  default: () => ({ isNativeIOS: true, keyboardOpen: false }),
}));
vi.mock('../../lib/callFunctions', () => ({
  default: callFunctionMock,
  callFunction: callFunctionMock,
}));
vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  documentId: vi.fn(() => '__name__'),
  getDocs: getDocsMock,
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
}));
vi.mock('../../lib/nativeHaptics', () => ({
  hapticSuccess: hapticSuccessMock,
  hapticWarning: hapticWarningMock,
}));

const thread: MessageThread = {
  id: 'thread-1',
  kidId: 'kid-1',
  kidName: 'Aarav Kumar',
  studentName: 'Aarav Kumar',
  childName: 'Aarav Kumar',
  participantIds: ['parent-1', 'teacher-1', 'lp-1'],
  participantNames: {
    'parent-1': 'Parent One',
    'teacher-1': 'Suguna',
    'lp-1': 'Priya',
  },
  participantRoles: {
    'parent-1': 'parent',
    'teacher-1': 'teacher',
    'lp-1': 'learningPartner',
  },
  parentIds: ['parent-1'],
  parentNames: ['Parent One'],
  teacherId: 'teacher-1',
  teacherIds: ['teacher-1'],
  teacherNames: ['Suguna'],
  learningPartnerIds: ['lp-1'],
  learningPartnerNames: ['Priya'],
  lastMessagePreview: 'Call me on +91 99999 12345',
  unreadCounts: { 'parent-1': 2 },
  lastReadAtByUser: { 'teacher-1': 3_000 },
  adminVisible: false,
  status: 'active',
  lastMessageAtMs: 3_000,
  updatedAtMs: 3_000,
  createdAtMs: 1_000,
};

const messages: ThreadMessage[] = [
  {
    id: 'message-1',
    senderId: 'teacher-1',
    text: 'First update',
    clientMessageId: null,
    createdAtMs: 1_000,
  },
  {
    id: 'message-2',
    senderId: 'teacher-1',
    text: 'Call +91 99999 12345',
    clientMessageId: null,
    createdAtMs: 1_500,
  },
  {
    id: 'message-3',
    senderId: 'parent-1',
    text: 'Thank you',
    clientMessageId: null,
    createdAtMs: 2_000,
  },
];

const renderOpenPanel = () =>
  render(
    <MessagesPanel
      embedded
      nativeChatFocus
      autoSelectFirstThread={false}
      routeThreadId="thread-1"
    />,
  );

describe('MessagesPanel messaging behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callFunctionMock.mockImplementation((name: string) => {
      if (name === 'markMessageThreadRead') return Promise.resolve({ ok: true, updated: true });
      return Promise.resolve({ messageId: 'message-new' });
    });
    useMessageThreadsMock.mockReturnValue({
      threads: [thread],
      isLoading: false,
      error: null,
    });
    useThreadMessagesMock.mockReturnValue({
      messages,
      isLoading: false,
      error: null,
    });
    useAuthStore.setState({
      user: {
        uid: 'parent-1',
        email: 'parent@example.com',
        displayName: 'Parent One',
        role: 'parent',
      },
      authStatus: 'authenticated',
      isLoading: false,
    });
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.scrollTo = vi.fn();
  });

  it('keeps safe previews and message content hidden while preserving message order and sender grouping', () => {
    const view = render(<MessagesPanel embedded autoSelectFirstThread={false} />);
    expect(screen.getByText('Message hidden by safety filter')).toBeVisible();
    expect(screen.queryByText(/99999/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Aarav Kumar conversation/ }));
    const messageList = screen.getByLabelText('Aarav Kumar messages');
    const renderedMessages = within(messageList).getAllByRole('article');
    expect(renderedMessages.map((node) => node.textContent)).toEqual([
      expect.stringContaining('First update'),
      expect.stringContaining('Message hidden by safety filter'),
      expect.stringContaining('Thank you'),
    ]);
    expect(within(messageList).getAllByText('Suguna • Teacher')).toHaveLength(1);
    expect(within(renderedMessages[2]).getByText('Read')).toBeVisible();
    expect(view.container.querySelector('[data-safety-filtered="true"]')).toBeTruthy();
  });

  it('renders native child context and returns to the list without auto-reopening', () => {
    renderOpenPanel();
    expect(screen.getByTestId('message-conversation-header')).toHaveTextContent('Aarav Kumar');
    expect(screen.getByTestId('message-conversation-header')).toHaveTextContent('Teacher: Suguna');

    fireEvent.click(screen.getByRole('button', { name: 'Back to conversations' }));
    expect(screen.getByRole('searchbox')).toBeVisible();
    expect(screen.queryByLabelText('Aarav Kumar messages')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aarav Kumar conversation/ })).toHaveFocus();
  });

  it('renders one native viewport owner with header, notice, list, and composer in order', () => {
    const view = renderOpenPanel();
    const owner = view.container.querySelector('.ts-chat-focus-screen');
    const header = view.container.querySelector('.ts-chat-focus-header');
    const viewport = view.container.querySelector('.ts-chat-focus-viewport');
    const list = view.container.querySelector('.ts-chat-focus-list');
    const composer = view.container.querySelector('.ts-chat-focus-composer');

    expect(view.container.querySelectorAll('.ts-chat-focus-screen')).toHaveLength(1);
    expect(view.container.querySelectorAll('.ts-chat-focus-viewport')).toHaveLength(1);
    expect(owner).toBeTruthy();
    expect(header).toBeTruthy();
    expect(viewport).toBeTruthy();
    expect(header?.parentElement?.parentElement).toBe(owner);
    expect(header?.nextElementSibling?.nextElementSibling).toBe(viewport);
    expect(viewport?.firstElementChild).toBe(list);
    expect(viewport?.lastElementChild).toBe(composer);
    expect(list?.contains(screen.getByText('First update'))).toBe(true);
    expect(composer?.contains(screen.getByRole('textbox', { name: 'Message' }))).toBe(true);
    expect(composer?.className).not.toContain('sticky');
  });

  it('uses the existing callable payload and blocks duplicate sends while pending', () => {
    const pendingSend = new Promise<{ messageId: string }>(() => undefined);
    callFunctionMock.mockImplementation((name: string) => {
      if (name === 'markMessageThreadRead') return Promise.resolve({ ok: true, updated: true });
      return pendingSend;
    });
    renderOpenPanel();

    const composer = screen.getByRole('textbox', { name: 'Message' });
    fireEvent.change(composer, { target: { value: '  New update  ' } });
    const send = screen.getByRole('button', { name: 'Send message' });
    fireEvent.click(send);
    fireEvent.click(send);

    expect(
      callFunctionMock.mock.calls.filter(([name]) => name === 'sendMessage'),
    ).toEqual([['sendMessage', { threadId: 'thread-1', text: 'New update' }]]);
    expect(composer).toHaveValue('  New update  ');
  });

  it('clears the draft only after a confirmed successful send', async () => {
    callFunctionMock.mockImplementation((name: string) => {
      if (name === 'markMessageThreadRead') return Promise.resolve({ ok: true, updated: true });
      return Promise.resolve({ messageId: 'message-new' });
    });
    renderOpenPanel();

    const composer = screen.getByRole('textbox', { name: 'Message' });
    fireEvent.change(composer, { target: { value: 'New update' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await vi.waitFor(() => expect(composer).toHaveValue(''));
    expect(hapticSuccessMock).toHaveBeenCalledOnce();
  });

  it('keeps the failed draft, shows the existing error, and invokes warning haptics', async () => {
    callFunctionMock.mockImplementation((name: string) => {
      if (name === 'markMessageThreadRead') return Promise.resolve({ ok: true, updated: true });
      return Promise.reject(new Error('Unable to deliver this update'));
    });
    renderOpenPanel();

    const composer = screen.getByRole('textbox', { name: 'Message' });
    fireEvent.change(composer, { target: { value: 'Please retry' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to deliver this update');
    expect(composer).toHaveValue('Please retry');
    expect(hapticWarningMock).toHaveBeenCalledOnce();
  });

  it('marks a newly opened unread thread through the existing callable without repeated calls', async () => {
    const view = renderOpenPanel();
    await vi.waitFor(() => {
      expect(
        callFunctionMock.mock.calls.filter(([name]) => name === 'markMessageThreadRead'),
      ).toHaveLength(1);
    });

    view.rerender(
      <MessagesPanel
        embedded
        nativeChatFocus
        autoSelectFirstThread={false}
        routeThreadId="thread-1"
      />,
    );
    expect(
      callFunctionMock.mock.calls.filter(([name]) => name === 'markMessageThreadRead'),
    ).toHaveLength(1);
  });

  it('does not repeat an empty batched user-label lookup', async () => {
    const view = renderOpenPanel();
    await vi.waitFor(() => expect(getDocsMock).toHaveBeenCalledOnce());

    view.rerender(
      <MessagesPanel
        embedded
        nativeChatFocus
        autoSelectFirstThread={false}
        routeThreadId="thread-1"
      />,
    );
    await Promise.resolve();
    expect(getDocsMock).toHaveBeenCalledOnce();
  });
});
