import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TestimonialsSection from './TestimonialsSection';

describe('TestimonialsSection', () => {
  it('shows exact Advanced Grammar feedback when a course-level program is supplied', () => {
    render(
      <MemoryRouter>
        <TestimonialsSection
          eyebrow="Step 3 · Parent feedback"
          title="Parent feedback for Advanced Grammar"
          program="Advanced Grammar"
          courseTag="grammar"
          limit={3}
          compact
          viewAllHref="/testimonials"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Step 3 · Parent feedback')).toBeInTheDocument();
    expect(screen.getAllByText('Advanced Grammar')).toHaveLength(3);
    expect(screen.queryByText('Basic Grammar')).not.toBeInTheDocument();
    expect(screen.getByText('Writing became sharper')).toBeInTheDocument();
  });
});
