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
    expect(screen.getByText('Lesson 6')).toBeInTheDocument();
    expect(screen.getByText('Digraphs — sh and th')).toBeInTheDocument();
    expect(screen.queryByText('Digraph practice')).not.toBeInTheDocument();
    expect(screen.queryByText('Homework')).not.toBeInTheDocument();
    expect(screen.queryByText('Read each word aloud.')).not.toBeInTheDocument();
    expect(screen.queryByText('1 worksheet')).not.toBeInTheDocument();
    expect(screen.queryByText('internal-firestore-id')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Find a worksheet'), { target: { value: 'Digraph practice' } });
    expect(screen.getByText('Lesson 6')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open/i }));
    fireEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(open).toHaveBeenCalledTimes(2);
    open.mockRestore();
  });

  it('shows the course once and derives a decorative letter without repeating it for assistive technology', () => {
    const item = toParentWorksheetItem('letter-a', {
      title: 'Letter A', url: 'https://example.com/letter-a.pdf',
      lessonId: 'lesson-2', lessonTitle: 'Lesson-2', lessonFolderTitle: 'Foundation Phonics',
      courseId: 'phonics-foundations', courseTitle: 'Phonics Foundations', targetCourseIds: ['phonics-foundations'],
    });
    render(<ParentWorksheetLibrary items={[item]} loading={false} onRefresh={vi.fn()} />);

    expect(screen.getAllByText('Phonics Foundations')).toHaveLength(1);
    expect(screen.getByText('Lesson 2')).toHaveClass('text-amber-800');
    expect(screen.getByText('Letter A')).toHaveClass('text-orange-700');
    expect(screen.getByText('A').closest('[aria-hidden="true"]')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Find a worksheet'), { target: { value: 'Lesson 2' } });
    expect(screen.getByText('Letter A')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Find a worksheet'), { target: { value: 'Magic E' } });
    expect(screen.getByText('No worksheets match your search.')).toBeInTheDocument();
  });

  it('uses the course-specific empty state and mobile-safe stacked controls', () => {
    const { container } = render(<ParentWorksheetLibrary items={[]} loading={false} onRefresh={vi.fn()} />);
    expect(screen.getByText('No worksheets have been shared for this course yet.')).toBeInTheDocument();
    const responsiveHeader = container.querySelector('.sm\\:flex-row');
    expect(responsiveHeader).toHaveClass('flex-col');
  });
});
