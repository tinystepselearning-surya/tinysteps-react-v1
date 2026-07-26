import Meta from '../components/common/Meta';
import PageHero from '../components/common/PageHero';

const lastUpdated = 'March 6, 2026';

const sections = [
  {
    title: 'Introduction and acceptance',
    paragraphs: [
      'These Terms and Conditions govern the use of the Tiny Steps Learning website and all related Tiny Steps Online School services. Tiny Steps Online School is the service provider for the classes, learning materials, assessments, and support offered through this website.',
      'By using the website, booking a free 35-minute 1:1 online demo assessment class, enrolling in classes, or making a payment, you agree to these Terms and Conditions. If the student is under 18 years old, a parent or legal guardian must review and accept these terms on the child’s behalf.',
    ],
  },
  {
    title: 'Services and enrolment',
    paragraphs: [
      'Tiny Steps offers live 1:1 online phonics, grammar, reading, and public speaking classes for children ages 3–12. We may also offer related assessments, parent guidance, progress updates, recordings, worksheets, and practice resources.',
      'Enrolment requires accurate parent and child information, including contact details, age, learning interests, and any relevant educational details that help us place the child appropriately. Families are responsible for keeping this information current. Monthly fees or other applicable charges must be paid before classes begin.',
    ],
  },
  {
    title: 'Payments',
    paragraphs: [
      'Course fees are charged in advance on a monthly basis unless a different package arrangement is clearly confirmed in writing. Classes are scheduled at mutually agreed times based on teacher availability and the family’s selected time slot.',
      'If payment is delayed, declined, reversed, or not received on time, Tiny Steps may pause or suspend classes until the account is brought up to date. Any bank charges, payment gateway fees, or failed transaction issues that arise from the family’s payment method remain the responsibility of the payer unless required otherwise by law.',
    ],
  },
  {
    title: 'Cancellations and rescheduling',
    paragraphs: [
      'Parents should give at least 24 hours’ notice if they need to cancel or reschedule a class. When notice is provided, Tiny Steps will make reasonable efforts to offer a replacement class or alternate slot, subject to mentor availability and scheduling constraints.',
      'If a family misses a class without notice or joins so late that meaningful teaching cannot take place, that class may be treated as forfeited. Repeated late cancellations or repeated no-shows may affect future scheduling flexibility.',
    ],
  },
  {
    title: 'Code of conduct',
    paragraphs: [
      'Students and parents must treat Tiny Steps teachers, learning partners, support staff, and other families respectfully at all times. Harassment, abusive language, discriminatory conduct, threats, intentional disruption of classes, or misuse of communication channels is not allowed.',
      'Families must not attempt to misuse the platform, interfere with classroom systems, share inappropriate content, record sessions without permission where restricted, or engage in conduct that harms teachers, staff, or other learners. Tiny Steps may suspend or terminate service access if these standards are not met.',
    ],
  },
  {
    title: 'Intellectual property',
    paragraphs: [
      'All Tiny Steps curriculum materials, videos, worksheets, visual assets, lesson plans, downloadable resources, trademarks, logos, and related content remain the property of Tiny Steps Learning or its licensors.',
      'Families may use these materials only for the enrolled child’s personal learning. Materials may not be copied, shared outside the household, uploaded publicly, reproduced commercially, repackaged, or sold without prior written permission from Tiny Steps.',
    ],
  },
  {
    title: 'Limitation of liability',
    paragraphs: [
      'Tiny Steps works hard to support children in improving their reading, writing, grammar, and speaking confidence, but individual progress depends on many factors including attendance, practice, starting level, engagement, and parental support. Specific outcomes or timelines cannot be guaranteed for every learner.',
      'To the fullest extent permitted by law, Tiny Steps is not liable for indirect, incidental, consequential, special, or punitive damages arising out of the use of the website, the classes, or any related service. Our total liability for direct claims will not exceed the fees actually paid by the family for the affected service period.',
    ],
  },
  {
    title: 'Governing law and changes',
    paragraphs: [
      'These Terms and Conditions are governed by the laws of India. Any dispute relating to these terms or the Tiny Steps services will be subject to the jurisdiction of the courts in Hyderabad, Telangana.',
      `We may revise these terms from time to time by posting an updated version on this page. Continued use of the website or service after the revised version is posted means the updated terms are accepted. Last updated: ${lastUpdated}.`,
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-white">
      <Meta
        title="Terms and Conditions | Tiny Steps Learning"
        description="Review the Tiny Steps Learning terms covering enrolment, payments, scheduling, conduct, intellectual property, liability, and governing law."
        canonical="https://tinystepslearning.com/terms-and-conditions"
        robots="noindex, follow"
      />

      <PageHero
        eyebrow="Legal"
        title="Terms and Conditions"
        description="The rules that govern use of the Tiny Steps website, enrolment in classes, payments, scheduling, and family responsibilities."
        badges={['Online classes', 'Payments', `Last updated ${lastUpdated}`]}
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
