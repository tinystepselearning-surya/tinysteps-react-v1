import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import FounderPriyaPage from '../../pages/FounderPriyaPage';

describe('FounderPriyaPage', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('renders the canonical founder identity with one H1 and a visible breadcrumb', () => {
    render(
      <MemoryRouter initialEntries={['/team/vannala-ravali-priya']}>
        <FounderPriyaPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Vannala Ravali Priya' })).toBeInTheDocument();
    expect(screen.getAllByText('Founder, Tiny Steps Learning').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Known to families and learners as Priya')).toBeInTheDocument();
    expect(
      screen.getByText(/Vannala Ravali Priya is the Founder of Tiny Steps Learning/),
    ).toBeInTheDocument();

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toHaveTextContent('Home');
    expect(breadcrumb).toHaveTextContent('Team');
    expect(breadcrumb).toHaveTextContent('Vannala Ravali Priya');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Team' })).toHaveAttribute('href', '/team');
  });

  it('uses the approved founder portrait as the primary visual identity', () => {
    render(
      <MemoryRouter initialEntries={['/team/vannala-ravali-priya']}>
        <FounderPriyaPage />
      </MemoryRouter>,
    );

    expect(screen.getByAltText('Vannala Ravali Priya, Founder of Tiny Steps Learning')).toHaveAttribute(
      'src',
      '/priya-founder-tiny-steps-learning.webp',
    );
    expect(screen.getByText('Academic direction across')).toBeInTheDocument();
    expect(screen.getByText('Phonics & Reading')).toBeInTheDocument();
    expect(screen.getByText('Grammar & Writing')).toBeInTheDocument();
    expect(screen.getByText('Public Speaking')).toBeInTheDocument();
    expect(screen.getByText('Founder-led academic direction')).toBeInTheDocument();
  });

  it('publishes self-canonical, indexable founder metadata', async () => {
    render(
      <MemoryRouter initialEntries={['/team/vannala-ravali-priya']}>
        <FounderPriyaPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.title).toBe('Vannala Ravali Priya | Founder of Tiny Steps Learning');
      expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
        'content',
        'Meet Vannala Ravali Priya, Founder of Tiny Steps Learning. Learn about her work in phonics, English curriculum development, teacher development and academic quality.',
      );
      expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://tinystepslearning.com/team/vannala-ravali-priya',
      );
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      );
      expect(document.querySelector('meta[name="googlebot"]')?.getAttribute('content')).toContain('index');
      expect(document.querySelector('meta[name="bingbot"]')?.getAttribute('content')).toContain('index');
      expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
        'content',
        'https://tinystepslearning.com/priya-founder-tiny-steps-learning.webp',
      );
      expect(document.querySelector('meta[name="twitter:image"]')).toHaveAttribute(
        'content',
        'https://tinystepslearning.com/priya-founder-tiny-steps-learning.webp',
      );
    });
  });
});
