import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { toParentWorksheetItem } from '../../../lib/parentWorksheets';
import { ParentWorksheetLibrary } from '../../../pages/parent/components/classes/ParentWorksheetLibrary';

describe('ParentWorksheetLibrary', () => {
  it('renders a compact course and lesson hierarchy with safe Open and Drive Download actions', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const item = toParentWorksheetItem('internal-firestore-id', {
      title: 'Digraph practice', description: 'Read each word aloud.', resourceType: 'Homework',
      url: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view',
      lessonId: 'lesson-sh', lessonTitle: 'Lesson 6 · Digraphs — sh and th', lessonFolderTitle: 'Early Phonics',
      courseId: 'early-phonics', courseTitle: 'Early Phonics', targetCourseIds: ['early-phonics'],
    });
    render(<ParentWorksheetLibrary items={[item]} loading={false} onRefresh={vi.fn()} />);
    expect(screen.getByText('Lesson 6 · Digraphs — sh and th')).toBeInTheDocument();
    expect(screen.getByText('Digraph practice')).toBeInTheDocument();
    expect(screen.getByText('Homework')).toBeInTheDocument();
    expect(screen.queryByText('internal-firestore-id')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /open/i }));
    fireEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(open).toHaveBeenCalledTimes(2);
    open.mockRestore();
  });

  it('uses the course-specific empty state and mobile-safe stacked controls', () => {
    const { container } = render(<ParentWorksheetLibrary items={[]} loading={false} onRefresh={vi.fn()} />);
    expect(screen.getByText('No worksheets have been shared for this course yet.')).toBeInTheDocument();
    expect(container.querySelector('.sm\\:flex-row')).toBeNull();
  });
});
