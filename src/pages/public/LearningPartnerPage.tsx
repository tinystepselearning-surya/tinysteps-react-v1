import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import AdvisorContactForm from '../../components/common/AdvisorContactForm';
import PageHero from '../../components/common/PageHero';

const responsibilities = [
  'Support assigned families with scheduling, follow-ups, and onboarding clarity.',
  'Coordinate with teachers so parents always know the next milestone.',
  'Watch for risks early and help keep each child on a steady routine.',
];

const fitPoints = [
  'Warm parent communication',
  'Strong follow-through and ownership',
  'Comfort with online tools and tracking',
  'Child-centred problem solving',
];

export default function LearningPartnerPage() {
  return (
    <div className="bg-white">
      <Meta
        title="Learning Partner Support | Tiny Steps Learning"
        description="Learn how Tiny Steps Learning Partners support parents, teachers, and children with onboarding, scheduling, and steady progress."
        canonical="https://tinystepslearning.com/learning-partner"
      />

      <PageHero
        eyebrow="Learning Partner Support"
        title="A single point of support for every family"
        description="Tiny Steps Learning Partners help parents stay informed, teachers stay aligned, and children keep moving with confidence. This page explains the role and how to connect with the team."
        badges={['Family onboarding', 'Teacher coordination', 'Progress follow-up']}
        actions={
          <>
            <Link
              to="/learning-partner/login"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Learning Partner Login
            </Link>
            <a
              href="#learning-partner-contact"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Contact the team
            </a>
          </>
        }
      />

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">What the role covers</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">How Learning Partners help</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            {responsibilities.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Who it is for</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">A strong fit if you are</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {fitPoints.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            If you are already part of the Tiny Steps team, use the login page to access your dashboard. If you are exploring the role, use the contact form below and we will share next steps.
          </p>
        </div>
      </section>

      <section id="learning-partner-contact" className="mx-auto max-w-6xl px-6 pb-16 pt-4">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Support flow</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">What happens after you reach out</h2>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
              <li>1. We review your message and the type of support you need.</li>
              <li>2. A team member responds with the right next step, dashboard guidance, or application details.</li>
              <li>3. If needed, we schedule a follow-up call with the relevant operations lead.</li>
            </ol>
          </div>

          <AdvisorContactForm
            topic="Learning Partner"
            title="Contact the Learning Partner team"
            description="Use this form if you need support and do not want to use WhatsApp."
          />
        </div>
      </section>
    </div>
  );
}
