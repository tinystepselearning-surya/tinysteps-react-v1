import { useEffect } from 'react';
import { applySeo } from '../../lib/seo';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';

const WHATSAPP_LINK =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps%20Team!%20I%20want%20to%20apply%20for%20%5BTeacher%20%2F%20Learning%20Partner%20%2F%20Curriculum%20Admin%5D.%20My%20name%3A%20_____%20%7C%20City%3A%20_____%20%7C%20Experience%3A%20_____%20%7C%20Availability%3A%20_____%20%7C%20Resume%20link%3A%20_____';

const ROLES = [
  {
    title: 'Online Teacher (Phonics / Grammar / Public Speaking)',
    what: [
      'Deliver 1:1 live sessions for children ages 3–12.',
      'Adapt lessons to each child’s pace and learning style.',
      'Record brief progress notes after each class.',
      'Coordinate with parents on goals and next steps.',
    ],
    should: [
      'Strong spoken English with clear, friendly communication.',
      'Experience teaching kids or ESL learners.',
      'Reliable internet, laptop, and quiet teaching setup.',
      'Consistent weekly availability (6–12 hrs/week).',
    ],
    nice: [
      'Phonics or IB curriculum exposure.',
      'TEFL / TESOL certification.',
    ],
  },
  {
    title: 'Learning Partner (Child Support During Class)',
    what: [
      'Join live sessions to support focus, motivation, and tech setup.',
      'Help children follow activities and complete in-class tasks.',
      'Share quick observations with the teacher after class.',
      'Keep the child’s experience calm, safe, and encouraging.',
    ],
    should: [
      'Warm, patient, and confident with young children.',
      'Comfortable communicating in English.',
      'Reliable internet connection and device.',
      'Availability for consistent weekly slots.',
    ],
    nice: [
      'Early childhood or special needs experience.',
      'Prior classroom or tutoring exposure.',
    ],
  },
  {
    title: 'Curriculum Administrator (Content + Quality + Coordination)',
    what: [
      'Review lesson plans for clarity, accuracy, and consistency.',
      'Maintain content libraries and program documentation.',
      'Coordinate updates with teachers and academic leads.',
      'Track quality checks and improvement actions.',
    ],
    should: [
      'Experience in curriculum design or academic operations.',
      'Strong English writing and editing skills.',
      'Highly organized with attention to detail.',
      'Comfortable with spreadsheets and task trackers.',
    ],
    nice: [
      'K–12 or IB curriculum familiarity.',
      'Phonics or literacy program experience.',
    ],
  },
];

const PROCESS_STEPS = [
  {
    title: 'Message on WhatsApp',
    description: 'Send your details and preferred role to our team.',
  },
  {
    title: 'Quick Screening',
    description: 'A short call to understand your availability and fit.',
  },
  {
    title: 'Demo / Task',
    description: 'Teach a short sample or review a small curriculum task.',
  },
  {
    title: 'Onboarding',
    description: 'Paid trial + training materials to get you started.',
  },
];

const FAQS = [
  {
    question: 'Is this fully remote?',
    answer:
      'Yes. All roles are remote and online. You can work from home with a stable internet connection.',
  },
  {
    question: 'What are the working hours?',
    answer:
      'Roles are part-time with flexible slots, usually scheduled across evenings and weekends (IST).',
  },
  {
    question: 'Do you provide training?',
    answer:
      'Yes. We share curriculum guides, lesson formats, and onboarding support before your first sessions.',
  },
  {
    question: 'Can I apply for more than one role?',
    answer:
      'Absolutely. Mention all roles you’re interested in when you message us.',
  },
  {
    question: 'How does payment work?',
    answer:
      'Payments are handled monthly via bank transfer or UPI, based on your role and hours.',
  },
  {
    question: 'How soon can I start?',
    answer:
      'Most candidates complete onboarding within 1–2 weeks after selection.',
  },
];

export default function CareersPage() {
  useEffect(() => {
    applySeo({
      title: 'Careers | Join the Tiny Steps Team',
      description:
        'We’re hiring remote part-time Online Teachers, Learning Partners, and Curriculum Administrators. Work with children aged 3–12. Apply on WhatsApp.',
      canonicalPath: '/careers',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="page-gradient min-h-screen">
      <section className="px-6 pt-24 pb-12">
        <div className="mx-auto max-w-5xl text-center">
          <div className="gradient-chip mx-auto w-max">We’re hiring</div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Join the Tiny Steps Team
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-700">
            Remote • Part-time • Meaningful work with children (ages 3–12)
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild variant="cta" size="lg">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                Message on WhatsApp to Apply
              </a>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            We typically respond within 24 hours.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Open Roles</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {ROLES.map((role) => (
            <Card key={role.title} className="h-full border border-gray-200 bg-white p-6">
              <h3 className="text-xl font-semibold text-gray-900">{role.title}</h3>

              <div className="mt-6 space-y-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900">What you’ll do</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {role.what.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900">You should have</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {role.should.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900">Nice to have</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {role.nice.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <Button asChild variant="cta" className="w-full">
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                    Apply on WhatsApp
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-tiny-blue-50 to-tiny-purple-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">Hiring Process</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, index) => (
              <Card key={step.title} className="border border-gray-200 bg-white p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-bold text-primary shadow-sm">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">FAQ</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((faq) => (
            <Card key={faq.question} className="border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
              <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Ready to apply?</h2>
          <p className="mt-2 text-gray-600">
            Message us with your details and preferred role.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild variant="cta" size="lg">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                Apply on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
