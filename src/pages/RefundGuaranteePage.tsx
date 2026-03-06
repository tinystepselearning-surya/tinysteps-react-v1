import Meta from '../components/common/Meta';
import PageHero from '../components/common/PageHero';

const sections = [
  {
    title: 'Assessment and fit',
    body: 'Placeholder refund and guarantee text. Tiny Steps begins with an assessment or onboarding review so families can confirm that the recommended course and mentor fit the child’s needs.',
  },
  {
    title: 'Refund windows',
    body: 'Placeholder refund and guarantee text. Refund eligibility, partial refunds, and processing timelines depend on the package purchased, classes attended, and notice period provided by the family.',
  },
  {
    title: 'Scheduling flexibility',
    body: 'Placeholder refund and guarantee text. Where possible, Tiny Steps may offer rescheduling, pause options, or teacher reassignment before a refund is considered.',
  },
  {
    title: 'How to request help',
    body: 'Placeholder refund and guarantee text. Families can contact the team with billing or service concerns, and Tiny Steps will review each case and share the applicable next step or policy outcome.',
  },
];

export default function RefundGuaranteePage() {
  return (
    <div className="bg-white">
      <Meta
        title="Refund and Guarantee Policy | Tiny Steps Learning"
        description="Read the Tiny Steps Learning placeholder refund and guarantee policy covering fit checks, refund windows, and support options."
        canonical="https://tinystepslearning.com/refund-guarantee"
      />

      <PageHero
        eyebrow="Legal"
        title="Refund and Guarantee Policy"
        description="This placeholder page explains how Tiny Steps may handle course-fit reviews, refund requests, and parent support when a family needs help."
        badges={['Policy placeholder', 'Billing support', 'Family-first review']}
      />

      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-700">{section.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
