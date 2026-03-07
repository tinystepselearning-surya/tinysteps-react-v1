import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ChildSkillRatingCard from '../../components/progress/ChildSkillRatingCard';
import { getProgressSkillsForLesson } from '../../lib/progressSkills';

const values = {
  sound_recall: 3,
  blending: 2,
  segmenting: 1,
  cvc_word_reading: 4,
  simple_dictation: 0,
} as const;

const skills = getProgressSkillsForLesson({
  area: 'phonics',
  subskillChips: [
    'sound recall',
    'blending',
    'segmenting',
    'CVC word reading',
    'simple dictation',
  ],
});

describe('ChildSkillRatingCard', () => {
  it('calls onChange with the selected skill and rating', () => {
    const onChange = vi.fn();
    render(<ChildSkillRatingCard skills={skills} values={values} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sound recall rating 4 of 4',
      }),
    );

    expect(onChange).toHaveBeenCalledWith('sound_recall', 4);
  });

  it('renders the correct number of filled stars in read-only mode', () => {
    const { container } = render(<ChildSkillRatingCard skills={skills} values={values} readOnly />);

    const filledStars = container.querySelectorAll('svg.fill-amber-300');
    expect(filledStars).toHaveLength(10);
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByText('Mastered')).toBeInTheDocument();
  });

  it('can hide the header and legend for compact read-only lesson cards', () => {
    render(
      <ChildSkillRatingCard
        title={null}
        skills={skills}
        values={values}
        readOnly
        showLegend={false}
        compact
      />,
    );

    expect(screen.queryByText('Child Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('0 stars = Not started')).not.toBeInTheDocument();
    expect(screen.getByText('Sound recall')).toBeInTheDocument();
  });
});
