import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeamPage from '../../pages/TeamPage';
import { teamFaqItems } from '../../pages/team/teamPageContent';
import { founderPhotoSrc } from 'virtual:tiny-steps-team-photos';

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock('../../lib/analytics', () => ({ trackEvent }));

describe('TeamPage', () => {
  beforeEach(() => {
    trackEvent.mockClear();
    document.head.innerHTML = '';
  });

  it('renders the founder-led academic system with only approved public claims', () => {
    render(
      <MemoryRouter initialEntries={['/team']}>
        <TeamPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', {
        name: 'The people behind every Tiny Steps lesson',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('5,000+')).not.toBeInTheDocument();
    expect(screen.queryByText('15+')).not.toBeInTheDocument();
    expect(screen.getByText(/English learning for children aged 3–12/)).toBeInTheDocument();
    expect(screen.getAllByText(/Founder, Tiny Steps Learning/, { selector: 'p' })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'What supports every Tiny Steps lesson' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Built around how children actually learn' })).not.toBeInTheDocument();
    const founderPortraits = screen.getAllByAltText('Priya, Founder of Tiny Steps Learning');
    expect(founderPortraits).toHaveLength(1);
    founderPortraits.forEach((portrait) => expect(portrait).toHaveAttribute('src', founderPhotoSrc));
    const teamNavigation = screen.getByRole('navigation', { name: 'Team sections' });
    expect(teamNavigation.querySelector('a[href="#founder"]')).toBeInTheDocument();
    expect(teamNavigation.querySelector('a[href="#teachers"]')).toBeInTheDocument();
    expect(teamNavigation.querySelector('a[href="#teaching-quality"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Meet the educators behind every live lesson' })).toBeInTheDocument();
    expect(screen.getByText('Thoughtful teaching. More confident learning.')).toBeInTheDocument();
    expect(screen.getByText(/Meet our graduate educators with school-classroom experience/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See class samples' })).toHaveAttribute('href', '/class-samples');
    expect(screen.getByText('How we guide learning: model, practise, apply.')).toBeInTheDocument();
    const previews = screen.getAllByRole('img', { name: /Tiny Steps educator preview/ });
    expect(previews).toHaveLength(4);
    previews.forEach((preview) => {
      expect(preview.getAttribute('src')).toMatch(/^\/team\/.*\.webp$/);
    });
    expect(screen.getByText(/All Tiny Steps teachers are graduates with professional school-classroom teaching experience/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Training, observation and ongoing quality checks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ongoing lesson and conduct reviews' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vannala Ravali Priya — Founder' })).toHaveAttribute('href', '/team/vannala-ravali-priya');
    expect(screen.getByRole('link', { name: 'Explore the School Partnership Programme' })).toHaveAttribute('href', '/for-schools');
    expect(screen.getByRole('region', { name: 'Official Tiny Steps and founder profiles' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /A clear pathway from assessment to visible progress/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View real class samples' })).toHaveAttribute(
      'href',
      '/class-samples',
    );
    expect(document.body).not.toHaveTextContent('What Parents Say');
    expect(document.body).not.toHaveTextContent('Within 8 lessons');
    expect(document.body).not.toHaveTextContent(/certified|background verified|success rate/i);
  });

  it('uses the approved production routes and tracks only the requested CTA events', () => {
    render(
      <MemoryRouter initialEntries={['/team']}>
        <TeamPage />
      </MemoryRouter>,
    );

    const expectedCtas = [
      ['Book a Free 35-Minute Assessment', '/book-demo', 'team_hero_book_assessment'],
      ['Explore Our Curriculum', '/curriculum', 'team_hero_explore_curriculum'],
      ['Explore the School Partnership Programme', '/for-schools', 'team_school_partnership_click'],
      ['Book a Free 35-Minute Assessment', '/book-demo', 'team_final_book_assessment'],
      ['View Programmes', '/courses', 'team_view_programmes'],
    ] as const;

    const assessmentLinks = screen.getAllByRole('link', { name: /Book a Free 35-Minute Assessment/ });
    expect(assessmentLinks).toHaveLength(2);

    expectedCtas.forEach(([name, href, eventName], index) => {
      const link = name === 'Book a Free 35-Minute Assessment'
        ? assessmentLinks[index === 0 ? 0 : 1]
        : screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', href);
      fireEvent.click(link);
      expect(trackEvent).toHaveBeenLastCalledWith(eventName);
    });
  });

  it('publishes indexable team metadata and visible FAQ-matched structured data', async () => {
    render(
      <MemoryRouter initialEntries={['/team']}>
        <TeamPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.title).toBe('Meet the Tiny Steps Learning Team | Founder-Led English Learning');
      expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://tinystepslearning.com/team',
      );
      expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('index');
      expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
        'content',
        `https://tinystepslearning.com${founderPhotoSrc}`,
      );
      expect(document.querySelector('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image',
      );
    });

    const schemas = JSON.parse(document.getElementById('ts-jsonld')?.textContent || '[]') as Array<{
      '@type'?: string | string[];
      mainEntity?: Array<{ name?: string; acceptedAnswer?: { text?: string } }>;
    }>;
    expect(schemas.some((schema) => schema['@type'] === 'Person')).toBe(true);
    expect(schemas.some((schema) => schema['@type'] === 'BreadcrumbList')).toBe(true);
    const faqSchema = schemas.find((schema) => schema['@type'] === 'FAQPage');
    expect(faqSchema?.mainEntity).toHaveLength(teamFaqItems.length);
    teamFaqItems.forEach((item) => {
      expect(screen.getByText(item.question)).toBeInTheDocument();
      const structuredItem = faqSchema?.mainEntity?.find((entry) => entry.name === item.question);
      expect(structuredItem?.acceptedAnswer?.text).toBe(item.answer);
    });
  });
});