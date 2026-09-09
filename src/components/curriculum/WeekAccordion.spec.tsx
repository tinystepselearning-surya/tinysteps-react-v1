import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { WeekAccordion } from './WeekAccordion';

const items = [
  {
    title: 'Stage 1 — Sentence Foundations',
    focus: 'Goal: Build accurate sentences.',
    lessons: ['Lesson 1 — Subject, Verb & Object'],
    learns: ['Build complete sentences'],
  },
  {
    title: 'Stage 2 — Tense Control',
    focus: 'Goal: Use tense naturally.',
    lessons: ['Lesson 7 — Present Time'],
    learns: ['Distinguish routines from actions happening now'],
  },
];

describe('WeekAccordion', () => {
  it('uses progressive disclosure and fully removes collapsed content', () => {
    render(<WeekAccordion items={items} />);

    expect(screen.getByText('Lesson 1 — Subject, Verb & Object')).toBeInTheDocument();
    expect(screen.queryByText('Lesson 7 — Present Time')).not.toBeInTheDocument();

    const firstStageButton = screen.getByText('Stage 1 — Sentence Foundations').closest('button');
    expect(firstStageButton).not.toBeNull();
    fireEvent.click(firstStageButton as HTMLButtonElement);

    expect(screen.queryByText('Lesson 1 — Subject, Verb & Object')).not.toBeInTheDocument();

    const secondStageButton = screen.getByText('Stage 2 — Tense Control').closest('button');
    expect(secondStageButton).not.toBeNull();
    fireEvent.click(secondStageButton as HTMLButtonElement);

    expect(screen.getByText('Lesson 7 — Present Time')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all stages' }));
    expect(screen.queryByText('Lesson 1 — Subject, Verb & Object')).not.toBeInTheDocument();
    expect(screen.queryByText('Lesson 7 — Present Time')).not.toBeInTheDocument();
  });
});
