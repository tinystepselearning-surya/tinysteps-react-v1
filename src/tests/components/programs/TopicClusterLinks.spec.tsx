import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import TopicClusterLinks from '../../../components/programs/TopicClusterLinks';

describe('TopicClusterLinks', () => {
  it('adds a capped set of useful parent guides and Balloon Pop to the Tiny Steps phonics resource hub', () => {
    render(
      <MemoryRouter>
        <TopicClusterLinks
          title="Learn More About Phonics"
          links={[
            { label: 'SATPIN Phonics Guide', href: '/blog/satpin-phonics-guide' },
            { label: 'How Kids Learn Blending', href: '/blog/how-kids-learn-blending' },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /play tiny steps phonics balloon pop/i })).toHaveAttribute(
      'href',
      '/free-balloon-pop-phonics-game-for-kids',
    );
    expect(screen.getByRole('link', { name: /what is phonics\? parent start-here guide/i })).toHaveAttribute(
      'href',
      '/blog/what-is-phonics-for-kids',
    );
    expect(screen.getByRole('link', { name: /child knows abc but cannot read/i })).toHaveAttribute(
      'href',
      '/blog/child-knows-abc-but-cannot-read',
    );
    expect(screen.getAllByRole('link')).toHaveLength(9);
    expect(screen.getAllByText(/how kids learn blending/i)).toHaveLength(1);
  });

  it('does not inject phonics guides or Balloon Pop into unrelated topic clusters', () => {
    render(
      <MemoryRouter>
        <TopicClusterLinks
          title="Learn More About Grammar"
          links={[{ label: 'Grammar Guide', href: '/blog/grammar-guide' }]}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /balloon pop/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /what is phonics/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
