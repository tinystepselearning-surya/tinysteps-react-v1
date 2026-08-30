import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ClusterSeoNav from '../../../components/programs/ClusterSeoNav';

describe('ClusterSeoNav', () => {
  it('keeps the phonics decision navigation curated around six parent decision guides', () => {
    render(
      <MemoryRouter>
        <ClusterSeoNav cluster="phonics" />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link')).toHaveLength(7);
    expect(screen.getByRole('link', { name: /explore phonics hub/i })).toHaveAttribute('href', '/phonics');
    expect(screen.getByRole('link', { name: /how to choose a phonics class/i })).toHaveAttribute(
      'href',
      '/blog/how-to-choose-phonics-classes',
    );
    expect(screen.getByRole('link', { name: /online phonics classes vs school/i })).toHaveAttribute(
      'href',
      '/blog/online-phonics-classes-vs-school',
    );
    expect(screen.getByRole('link', { name: /are phonics apps enough/i })).toHaveAttribute(
      'href',
      '/blog/are-phonics-apps-enough-for-kids',
    );
    expect(screen.getByRole('link', { name: /phonics assessment checklist/i })).toHaveAttribute(
      'href',
      '/blog/phonics-diagnostics',
    );
  });

  it('does not leak phonics decision guides into the grammar cluster', () => {
    render(
      <MemoryRouter>
        <ClusterSeoNav cluster="grammar" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /phonics/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });
});
