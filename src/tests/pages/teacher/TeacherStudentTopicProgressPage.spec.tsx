import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeacherStudentTopicProgressPage from '../../../pages/teacher/TeacherStudentTopicProgressPage';

const { getDocMock, docMock } = vi.hoisted(() => ({
  getDocMock: vi.fn(),
  docMock: vi.fn((...args: unknown[]) => ({ args })),
}));

vi.mock('firebase/firestore', () => ({
  doc: docMock,
  getDoc: getDocMock,
}));

vi.mock('../../../lib/firebaseConfig', () => ({ db: { id: 'db' } }));

vi.mock('../../../components/teacher/StudentTopicProgressEditorCanonical', () => ({
  default: () => <div data-testid="topic-progress-editor" />,
}));

vi.mock('../../../components/common/TinyStepsBrand', () => ({
  default: () => <div>Tiny Steps</div>,
}));

const snap = (data?: Record<string, unknown>) => ({
  exists: () => Boolean(data),
  data: () => data,
});

const renderPage = () =>
  render(
    <MemoryRouter
      initialEntries={[
        '/teacher/students/kid-1/topic-progress?from=students&courseId=early-phonics&enrollmentId=enroll-1',
      ]}
    >
      <Routes>
        <Route
          path="/teacher/students/:kidId/topic-progress"
          element={<TeacherStudentTopicProgressPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('TeacherStudentTopicProgressPage student-name resolution', () => {
  beforeEach(() => {
    getDocMock.mockReset();
    docMock.mockClear();
  });

  it('uses the route enrollment first and stops after one read when it contains the name', async () => {
    getDocMock.mockResolvedValueOnce(snap({ studentName: 'Aanya' }));

    renderPage();

    expect(await screen.findByText('Student: Aanya')).toBeInTheDocument();
    expect(screen.queryByText('Loading student name…')).not.toBeInTheDocument();
    expect(screen.getByTestId('topic-progress-editor')).toBeInTheDocument();

    expect(getDocMock).toHaveBeenCalledTimes(1);
    expect(docMock).toHaveBeenCalledWith({ id: 'db' }, 'enrollments', 'enroll-1');
  });

  it('falls back to the student document when an enrollment has no display name', async () => {
    getDocMock
      .mockResolvedValueOnce(snap({ enrollmentId: 'enroll-1' }))
      .mockResolvedValueOnce(snap({ fullName: 'Mira Rao' }));

    renderPage();

    expect(await screen.findByText('Student: Mira Rao')).toBeInTheDocument();
    expect(getDocMock).toHaveBeenCalledTimes(2);
    expect(docMock).toHaveBeenNthCalledWith(1, { id: 'db' }, 'enrollments', 'enroll-1');
    expect(docMock).toHaveBeenNthCalledWith(2, { id: 'db' }, 'students', 'kid-1');
  });

  it('treats denied child-name lookups as recoverable and always clears loading', async () => {
    getDocMock
      .mockResolvedValueOnce(snap({ enrollmentId: 'enroll-1' }))
      .mockRejectedValueOnce(new Error('Missing or insufficient permissions.'))
      .mockRejectedValueOnce(new Error('Missing or insufficient permissions.'));

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText('Loading student name…')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Student: Student')).toBeInTheDocument();
    expect(screen.getByTestId('topic-progress-editor')).toBeInTheDocument();
    expect(getDocMock).toHaveBeenCalledTimes(3);
  });
});
