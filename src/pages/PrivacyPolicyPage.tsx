import PageHero from '../components/common/PageHero';
import Meta from '../components/common/Meta';

const sections = [
  {
    title: 'Information we collect',
    body: 'Placeholder privacy policy text. Tiny Steps may collect parent contact details, student learning information, class preferences, and support messages so we can deliver classes and respond to requests.',
  },
  {
    title: 'How we use information',
    body: 'Placeholder privacy policy text. We use information to manage bookings, support families, improve the learning experience, communicate updates, and operate the website responsibly.',
  },
  {
    title: 'Storage and sharing',
    body: 'Placeholder privacy policy text. We store information using standard security controls and share it only with service providers or staff who need it to support classes, payments, and customer service.',
  },
  {
    title: 'Your choices',
    body: 'Placeholder privacy policy text. Parents can request updates, corrections, or deletion of stored information by contacting the Tiny Steps team through the website contact form or email.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <Meta
        title="Privacy Policy | Tiny Steps Learning"
        description="Read the Tiny Steps Learning privacy policy placeholder page covering data collection, use, storage, and parent choices."
        canonical="https://tinystepslearning.com/privacy-policy"
      />

      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="This placeholder privacy policy explains how Tiny Steps may collect, use, and protect family information across the website and learning platform."
        badges={['Website data', 'Parent contact details', 'Student learning records']}
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
