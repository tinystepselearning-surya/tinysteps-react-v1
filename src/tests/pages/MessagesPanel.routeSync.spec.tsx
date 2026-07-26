import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageThread } from '../../hooks/useMessageThreads';
import MessagesPanel from '../../pages/messages/MessagesPanel';
import useAuthStore from '../../store/useAuthStore';

const {
  callFunctionMock,
  getDocsMock,
  useMessageThreadsMock,
  useNativeIOSKeyboardMock,
  useThreadMessagesMock,
} = vi.hoisted(() => ({
  callFunctionMock: vi.fn(() => Promise.resolve({ ok: true })),
  getDocsMock: vi.fn(() => Promise.resolve({ forEach: vi.fn() })),
  useMessageThreadsMock: vi.fn(),
  useNativeIOSKeyboardMock: vi.fn(() => ({ keyboardOpen: false })),
  useThreadMessagesMock: vi.fn(() => ({
    messages: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../hooks/useMessageThreads', () => ({
  default: useMessageThreadsMock,
}));

vi.mock('../../hooks/useThreadMessages', () => ({
  default: useThreadMessagesMock,
}));

vi.mock('../../hooks/useNativeIOSKeyboard', () => ({
  default: useNativeIOSKeyboardMock,
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
  hapticSuccess: vi.fn(),
  hapticWarning: vi.fn(),
}));

const now = Date.now();
const threads: MessageThread[] = [
  {
    id: 'thread-1',
    kidId: 'kid-1',
    kidName: 'Student One',
    studentName: 'Student One',
    childName: 'Student One',
    participantIds: ['parent-1', 'teacher-1'],
    participantNames: {},
    participantRoles: {},
    parentIds: ['parent-1'],
    parentNames: ['Parent One'],
    teacherId: 'teacher-1',
    teacherIds: ['teacher-1'],
    teacherNames: ['Teacher One'],
    learningPartnerIds: [],
    learningPartnerNames: [],
    lastMessagePreview: 'Hello',
    unreadCounts: {},
    lastReadAtByUser: {},
    adminVisible: false,
    status: 'active',
    lastMessageAtMs: null,
    updatedAtMs: now,
    createdAtMs: now,
  },
  {
    id: 'thread-2',
    kidId: 'kid-2',
    kidName: 'Student Two',
    studentName: 'Student Two',
    childName: 'Student Two',
    participantIds: ['parent-1', 'teacher-2'],
    participantNames: {},
    participantRoles: {},
    parentIds: ['parent-1'],
    parentNames: ['Parent One'],
    teacherId: 'teacher-2',
    teacherIds: ['teacher-2'],
    teacherNames: ['Teacher Two'],
    learningPartnerIds: [],
    learningPartnerNames: [],
    lastMessagePreview: 'Hi',
    unreadCounts: {},
    lastReadAtByUser: {},
    adminVisible: false,
    status: 'active',
    lastMessageAtMs: null,
    updatedAtMs: now - 1000,
    createdAtMs: now - 1000,
  },
];

describe('MessagesPanel route synchronization', () => {
  beforeEach(() => {
    callFunctionMock.mockClear();
    getDocsMock.mockClear();
    useMessageThreadsMock.mockReturnValue({
      threads,
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

  it('does not echo a deep-link route or re-emit it for a new callback identity', () => {
    const firstCallback = vi.fn();
    const view = render(
      <MessagesPanel
        routeThreadId="thread-1"
        onThreadChange={firstCallback}
      />,
    );

    expect(firstCallback).not.toHaveBeenCalled();

    const secondCallback = vi.fn();
    view.rerender(
      <MessagesPanel
        routeThreadId="thread-1"
        onThreadChange={secondCallback}
      />,
    );

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).not.toHaveBeenCalled();
  });

  it('reports a user selection once and does not echo route acknowledgement', () => {
    const onThreadChange = vi.fn();
    const view = render(
      <MessagesPanel
        routeThreadId="thread-1"
        onThreadChange={onThreadChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Student Two/ }));

    expect(onThreadChange).toHaveBeenCalledOnce();
    expect(onThreadChange).toHaveBeenCalledWith('thread-2');

    view.rerender(
      <MessagesPanel
        routeThreadId="thread-2"
        onThreadChange={onThreadChange}
      />,
    );

    expect(onThreadChange).toHaveBeenCalledOnce();
  });

  it('reports returning to the conversation list once without duplicate null reports', () => {
    const onThreadChange = vi.fn();
    const view = render(
      <MessagesPanel
        autoSelectFirstThread={false}
        routeThreadId="thread-1"
        onThreadChange={onThreadChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onThreadChange).toHaveBeenCalledOnce();
    expect(onThreadChange).toHaveBeenLastCalledWith(null);

    view.rerender(
      <MessagesPanel
        autoSelectFirstThread={false}
        routeThreadId={null}
        onThreadChange={onThreadChange}
      />,
    );

    expect(onThreadChange).toHaveBeenCalledOnce();
  });

  it('settles an invalid deep link by reporting null no more than once', async () => {
    const onThreadChange = vi.fn();

    render(
      <MessagesPanel
        autoSelectFirstThread={false}
        routeThreadId="missing-thread"
        onThreadChange={onThreadChange}
      />,
    );

    await vi.waitFor(() => {
      expect(onThreadChange).toHaveBeenCalledWith(null);
    });
    expect(onThreadChange).toHaveBeenCalledOnce();
    expect(onThreadChange).not.toHaveBeenCalledWith('missing-thread');
  });
});
