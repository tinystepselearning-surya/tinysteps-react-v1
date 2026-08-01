import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PUBLIC_WHATSAPP_NUMBER } from '../../constants/publicContact';
import ForSchoolsPage from '../../pages/ForSchoolsPage';

const GENERAL_PROPOSAL_MESSAGE =
  'Hello Tiny Steps, I would like to request a school phonics partnership proposal.';

function expectWhatsAppLink(link: HTMLElement, message: string) {
  const href = link.getAttribute('href');
  expect(href).toBeTruthy();

  const url = new URL(href!);
  expect(url.origin).toBe('https://wa.me');
  expect(url.pathname).toBe(`/${PUBLIC_WHATSAPP_NUMBER}`);
  expect(url.searchParams.get('text')).toBe(message);
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
}

describe('ForSchoolsPage proposal CTAs', () => {
  it('opens every proposal and pricing CTA in WhatsApp with relevant prefilled text', () => {
    render(
      <MemoryRouter initialEntries={['/for-schools']}>
        <ForSchoolsPage />
      </MemoryRouter>,
    );

    const planMessages = new Map([
      [
        'Focused Launch Licence',
        'Hello Tiny Steps, I am interested in the Focused Launch Licence for our school. Please share the proposal and next steps.',
      ],
      [
        'Whole-School Partnership',
        'Hello Tiny Steps, I am interested in the Whole-School Partnership for our school. Please share the proposal and next steps.',
      ],
      [
        'Multi-Campus Partnership',
        'Hello Tiny Steps, I am interested in the Multi-Campus Partnership. Please share the proposal and next steps.',
      ],
    ]);

    for (const [planName, message] of planMessages) {
      const card = screen.getByRole('heading', { name: planName }).closest('article');
      expect(card).not.toBeNull();
      expectWhatsAppLink(within(card!).getByRole('link', { name: 'Request this plan' }), message);
    }

    expectWhatsAppLink(
      screen.getByRole('link', { name: 'Request pilot proposal' }),
      'Hello Tiny Steps, I would like to request a phonics pilot proposal for our school.',
    );

    for (const price of ['₹59,000', '₹1.49 lakh', '₹2.99 lakh', '₹24,900 + GST']) {
      expect(screen.getAllByText((content) => content.includes(price)).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText('Progressive teacher training and rehearsal labs led by Tiny Steps trainers')).toHaveLength(3);
    expect(document.body).not.toHaveTextContent(/Two live teacher-training labs|Four live training|progress-review cycles|observation and leadership reviews/i);

    for (const link of screen.getAllByRole('link', { name: 'Request a School Partnership Proposal' })) {
      expectWhatsAppLink(link, GENERAL_PROPOSAL_MESSAGE);
    }

    for (const link of screen.getAllByRole('link', { name: 'Discuss Your School’s Reading Goals' })) {
      expectWhatsAppLink(link, GENERAL_PROPOSAL_MESSAGE);
    }
  });

  it('keeps the approved enrolment business case and FAQ structured data consistent', async () => {
    render(
      <MemoryRouter initialEntries={['/for-schools']}>
        <ForSchoolsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Visible reading progress strengthens parent confidence' }),
    ).toBeInTheDocument();
    expect(screen.getByText('The enrolment business case')).toBeInTheDocument();

    const outcomes = ['Parent confidence', 'Continued enrolment', 'Reputation and referrals', 'Leadership visibility'];
    for (const outcome of outcomes) {
      expect(screen.getByText(outcome)).toBeInTheDocument();
    }

    expect(screen.getByText(/Strong early literacy is not only an academic priority/)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('The majority of schools will lose admissions.');

    const faqQuestion = 'How can visible reading progress support enrolment and reputation?';
    expect(screen.getByText(faqQuestion)).toBeInTheDocument();

    await waitFor(() => {
      const jsonLd = document.getElementById('ts-jsonld');
      expect(jsonLd).not.toBeNull();
      const schemas = JSON.parse(jsonLd!.textContent || '[]') as Array<{
        '@type'?: string;
        mainEntity?: Array<{ name?: string; acceptedAnswer?: { text?: string } }>;
      }>;
      const faqSchema = schemas.find((schema) => schema['@type'] === 'FAQPage');
      const structuredQuestion = faqSchema?.mainEntity?.find((item) => item.name === faqQuestion);
      expect(structuredQuestion?.acceptedAnswer?.text).toContain(
        'A structured phonics programme, supported by teacher training and regular academic review',
      );
    });
  });
});
