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

    // The course also appears in the new selection dropdown.
    expect(screen.getAllByText('Phonics Foundations')).toHaveLength(2);
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


describe('ParentWorksheetLibrary course filter', () => {
  const courseItem = (id: string, courseId: string, courseTitle: string) =>
    toParentWorksheetItem(id, {
      title: id,
      url: 'https://example.com/' + id + '.pdf',
      lessonId: id,
      lessonTitle: id === 'phonics-sheet' ? 'Phonics Lesson' : 'Grammar Lesson',
      courseId,
      courseTitle,
    });

  it('defaults to the enrolled course and switches courses without network callbacks', () => {
    const onRefresh = vi.fn();
    const items = [
      courseItem('phonics-sheet', 'phonics', 'Phonics'),
      courseItem('grammar-sheet', 'grammar', 'Grammar'),
    ];
    render(
      <ParentWorksheetLibrary
        items={items}
        enrolledCourseIds={['phonics']}
        loading={false}
        onRefresh={onRefresh}
      />,
    );
    expect(screen.getAllByText('Phonics Lesson').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Grammar Lesson')).toHaveLength(0);
    const select = screen.getByRole('combobox', { name: 'Choose course' });
    expect(select).toHaveValue('__enrolled__');
    fireEvent.change(select, { target: { value: 'grammar' } });
    expect(screen.queryAllByText('Phonics Lesson')).toHaveLength(0);
    expect(screen.getAllByText('Grammar Lesson').length).toBeGreaterThan(0);
    fireEvent.change(select, { target: { value: '__enrolled__' } });
    expect(screen.getAllByText('Phonics Lesson').length).toBeGreaterThan(0);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('preserves parent-only legacy resources in the default filter', () => {
    const legacy = courseItem('personal-sheet', 'old-course', 'Legacy Course');
    render(
      <ParentWorksheetLibrary items={[legacy]}
        enrolledCourseIds={['phonics']}
        parentOnlyWorksheetIds={['personal-sheet']}
        loading={false}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getAllByText('Grammar Lesson').length).toBeGreaterThan(0);
  });
});
