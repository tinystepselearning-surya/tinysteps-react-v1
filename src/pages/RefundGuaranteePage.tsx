import Meta from '../components/common/Meta';
import PageHero from '../components/common/PageHero';
import { PUBLIC_CONTACT_EMAIL } from '../constants/publicContact';

const lastUpdated = 'March 6, 2026';

const sections = [
  {
    title: 'One free 35-minute demo assessment class and satisfaction guarantee',
    paragraphs: [
      'Every Tiny Steps family begins with a complimentary assessment class so we can confirm that the program, level, and mentor approach fit the child’s needs before full enrolment. This assessment helps families make an informed decision before paying for regular classes.',
      'After enrolment, a family may request a full refund within the first 7 days of payment or before completing the first two paid classes, whichever comes first, if they feel the program is not the right fit. Requests must be made by the parent or guardian in writing.',
    ],
  },
  {
    title: 'Unused classes',
    paragraphs: [
      'If a parent prepays for a monthly plan and later decides to withdraw, Tiny Steps will refund the unused portion of that month after deducting the value of classes already delivered. The refund amount will reflect only the sessions that were not used.',
      `To process a withdrawal and unused-class refund review, the parent must email ${PUBLIC_CONTACT_EMAIL} with the child’s name, registered contact details, and the reason for the request.`,
    ],
  },
  {
    title: 'Teacher match guarantee',
    paragraphs: [
      'We believe mentor fit matters. If a parent is unhappy with the assigned teacher, Tiny Steps will first offer a replacement mentor where possible so the child can continue with minimal disruption.',
      'If a suitable reassignment cannot be arranged or the family chooses not to continue, we will offer a refund for the remaining unused classes in line with this policy.',
    ],
  },
  {
    title: 'Cancellations and rescheduling',
    paragraphs: [
      'Classes missed with at least 24 hours’ notice may be rescheduled, subject to teacher availability. We will make reasonable efforts to provide an alternate slot that works for the family and mentor.',
      'No refunds are available for classes missed without prior notice or for no-show sessions, because that time was reserved for the child and could not be reassigned at short notice.',
    ],
  },
  {
    title: 'Processing',
    paragraphs: [
      'Approved refunds are returned to the original payment method within 7 to 10 business days. Depending on the payment provider or bank, the reflected credit may take additional time to appear in the account.',
      'Tiny Steps follows applicable Indian consumer protection laws. We currently accept UPI, credit cards, debit cards, and netbanking, as listed on the website footer and payment pages.',
    ],
  },
  {
    title: 'Contact and changes',
    paragraphs: [
      `For refund, guarantee, or billing questions, contact Tiny Steps Learning at ${PUBLIC_CONTACT_EMAIL} or call +91-96183-98383 during business hours: Monday to Sunday, 7:00 AM to 12:00 AM IST.`,
      `This policy may be revised from time to time to reflect legal requirements, payment process changes, or service updates. Any revised version will be posted here with a new “Last updated” date. Last updated: ${lastUpdated}.`,
    ],
  },
];

export default function RefundGuaranteePage() {
  return (
    <div className="bg-white">
      <Meta
        title="Refund and Guarantee Policy | Tiny Steps Learning"
        description="Read the Tiny Steps Learning refund and guarantee policy covering assessments, 7-day refunds, unused classes, mentor fit, and refund processing timelines."
        canonical="https://tinystepslearning.com/refund-guarantee"
        robots="noindex, follow"
      />

      <PageHero
        eyebrow="Legal"
        title="Refund and Guarantee Policy"
        description="How Tiny Steps handles assessment-fit reviews, 7-day refund requests, unused classes, mentor changes, and refund processing."
        badges={['7-day refund window', 'Mentor fit guarantee', `Last updated ${lastUpdated}`]}
      />

      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium text-slate-500">Last updated: {lastUpdated}</p>

          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
