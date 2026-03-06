import PageHero from '../components/common/PageHero';
import Meta from '../components/common/Meta';
import { PUBLIC_CONTACT_EMAIL } from '../constants/publicContact';

const lastUpdated = 'March 6, 2026';

const sections = [
  {
    title: 'Information collected',
    paragraphs: [
      'Tiny Steps Learning collects information that parents or guardians choose to share when they book a free assessment, enquire about classes, enrol a child, or subscribe to our newsletter. This may include the parent or guardian name, email address, phone number or WhatsApp number, the child’s age, and the learning area the family is interested in such as phonics, grammar, reading, or public speaking.',
      'Families may also share optional information to help us recommend the right course, including a child’s current reading, writing, or speaking level, school curriculum, preferred class timings, and learning goals. We collect this information only to personalise the learning experience and provide relevant follow-up.',
      'Like most websites, we also collect limited technical information automatically, including IP address, browser type, device information, approximate location, referral pages, cookies, and similar analytics data so that we can understand how the site is used and improve performance.',
    ],
  },
  {
    title: 'Use of information',
    paragraphs: [
      'We use personal information to schedule assessments and classes, confirm enrolment, process payments, send lesson reminders, share progress updates, answer support questions, and improve the Tiny Steps learning experience.',
      'If a parent subscribes to our newsletter or marketing updates, we may send emails, WhatsApp updates, offers, or educational content related to Tiny Steps programs. Families can opt out of marketing messages at any time by using the unsubscribe link in email messages or by contacting us directly.',
      'We share information only with the Tiny Steps team members and trusted service providers who need it to deliver the service, such as teachers, learning partners, payment processors, email delivery tools, analytics providers, and secure hosting providers. We do not sell personal information to third parties.',
    ],
  },
  {
    title: 'Children’s privacy',
    paragraphs: [
      'Tiny Steps serves children ages 3–12, but we collect personal information only from a parent or legal guardian. We do not knowingly invite children to submit personal information directly through the website without parental involvement.',
      'Child-related information is used only to deliver classes, maintain learning records, prepare progress reports, and support communication with the family. Our approach is designed to comply with the Indian Information Technology Act, 2000 and related rules, and to respect COPPA-style child privacy principles even when families access the service from outside India.',
    ],
  },
  {
    title: 'Cookies and analytics',
    paragraphs: [
      'The Tiny Steps website uses cookies and similar technologies, including Google Analytics, to understand traffic patterns, identify popular pages, improve content, and keep the website working smoothly.',
      'Parents can control or disable cookies through browser settings. Please note that some features of the site may not work as intended if essential cookies are blocked.',
    ],
  },
  {
    title: 'Security and retention',
    paragraphs: [
      'We store information on secure systems and use reasonable technical and organisational safeguards to protect it. Data is encrypted in transit, access is limited to authorised staff and service providers, and we review systems regularly to reduce misuse or unauthorised access.',
      `We keep personal data only for as long as it is needed to deliver classes, maintain records, comply with legal or financial obligations, resolve disputes, or improve service quality. Parents may request access to, correction of, or deletion of personal information at any time by emailing ${PUBLIC_CONTACT_EMAIL}.`,
    ],
  },
  {
    title: 'Contact and updates',
    paragraphs: [
      `For privacy questions or requests, please contact Tiny Steps Learning at ${PUBLIC_CONTACT_EMAIL} or call +91-96183-98383. Business hours are Monday to Friday, 9:00 AM to 6:00 PM IST, and Saturday, 10:00 AM to 2:00 PM IST.`,
      `We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or operational practices. Any revised version will be posted on this page with an updated “Last updated” date. Last updated: ${lastUpdated}.`,
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <Meta
        title="Privacy Policy | Tiny Steps Learning"
        description="Read the Tiny Steps Learning privacy policy covering family data collection, children’s privacy, cookies, security, retention, and parent rights."
        canonical="https://tinystepslearning.com/privacy-policy"
      />

      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="How Tiny Steps Learning collects, uses, protects, and retains parent and child-related information across the website and learning platform."
        badges={['Parent data', 'Children ages 3–12', `Last updated ${lastUpdated}`]}
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
