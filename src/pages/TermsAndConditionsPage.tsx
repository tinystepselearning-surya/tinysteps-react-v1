import Meta from '../components/common/Meta';
import PageHero from '../components/common/PageHero';

const sections = [
  {
    title: 'Use of the service',
    body: 'Placeholder terms text. Families use Tiny Steps services for lawful educational purposes only and agree to provide accurate booking, contact, and student information.',
  },
  {
    title: 'Bookings and payments',
    body: 'Placeholder terms text. Course schedules, class credits, pricing, and payment timelines are subject to the applicable package selected during enrolment.',
  },
  {
    title: 'Attendance and conduct',
    body: 'Placeholder terms text. Families are expected to join classes on time, maintain respectful communication, and provide a suitable learning environment for online sessions.',
  },
  {
    title: 'Updates to these terms',
    body: 'Placeholder terms text. Tiny Steps may revise these terms periodically, and continued use of the service after updates indicates acceptance of the latest version.',
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-white">
      <Meta
        title="Terms and Conditions | Tiny Steps Learning"
        description="Review the Tiny Steps Learning placeholder terms and conditions covering service use, bookings, payments, and family responsibilities."
        canonical="https://tinystepslearning.com/terms-and-conditions"
      />

      <PageHero
        eyebrow="Legal"
        title="Terms and Conditions"
        description="This placeholder terms page outlines how families may use Tiny Steps services, what to expect when booking classes, and the responsibilities of both parties."
        badges={['Service use', 'Payments', 'Online classes']}
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
