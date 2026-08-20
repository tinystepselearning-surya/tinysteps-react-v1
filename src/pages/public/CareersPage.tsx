import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  IndianRupee,
  Laptop,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { PUBLIC_CONTACT_EMAIL } from '../../constants/publicContact';
import { trackEvent } from '../../lib/analytics';
import { buildLeadAttributionPayload } from '../../lib/conversionTracking';
import { applySeo } from '../../lib/seo';

const CAREERS_PATH = '/careers';
const ROLE_TITLE = 'Online English Teacher - Phonics, Grammar & Public Speaking';
const WHATSAPP_NUMBER = '919618398383';

const buildWhatsAppLink = () => {
  const message = [
    'Hi Tiny Steps Learning! I would like to apply for the Online English Teacher role.',
    'Name: _____',
    'City: _____',
    'Teaching experience: _____',
    'Primary area: Phonics / Grammar / Public Speaking',
    'Daily availability: _____',
    'Resume / LinkedIn link: _____',
  ].join('\n');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

const AT_A_GLANCE = [
  ['Role', 'Online English Teacher'],
  ['Work mode', 'Fully remote / work from home'],
  ['Learners', 'Children aged 3–12'],
  ['Subjects', 'Phonics, Grammar & Public Speaking'],
  ['Class format', 'Live 1:1 online classes'],
  ['Class duration', '35 minutes'],
  ['Compensation', '₹175 per completed class'],
  ['Preferred availability', '3–4 hours per day; evenings/weekends helpful'],
];

const BENEFITS = [
  {
    icon: Clock3,
    title: 'Focused 35-minute classes',
    description: 'Teach short, structured sessions designed for young learners rather than long lecture-style classes.',
  },
  {
    icon: BookOpenCheck,
    title: 'Curriculum and lesson materials provided',
    description: 'Use Tiny Steps lesson content, activities and teaching guidance instead of building every class from scratch.',
  },
  {
    icon: Laptop,
    title: 'Teach fully online',
    description: 'Work from home with a laptop, stable internet connection and a quiet, professional teaching setup.',
  },
  {
    icon: IndianRupee,
    title: 'Clear per-class compensation',
    description: 'The current teaching rate is ₹175 for each completed 35-minute class.',
  },
  {
    icon: GraduationCap,
    title: 'Training and academic support',
    description: 'Receive onboarding guidance on Tiny Steps programs, class standards, lesson flow and child engagement.',
  },
  {
    icon: Users,
    title: '1:1 child-focused teaching',
    description: 'Work closely with individual learners and adapt delivery to the child’s pace within a structured curriculum.',
  },
];

const RESPONSIBILITIES = [
  'Conduct engaging live 1:1 English classes for children aged 3–12.',
  'Teach assigned lessons in Phonics, Grammar, Public Speaking or Spoken English using Tiny Steps materials.',
  'Maintain clear pronunciation, age-appropriate language and a child-friendly teaching style.',
  'Use the required Tiny Steps virtual teaching background and follow classroom presentation standards.',
  'Share screens correctly, including lesson audio when required, and use full-screen presentation mode where appropriate.',
  'Record concise class progress and follow scheduling, attendance and quality processes consistently.',
  'Maintain full attention throughout each 35-minute class and create a professional online learning environment.',
];

const REQUIREMENTS = [
  'Strong spoken and written English with clear pronunciation and confident communication.',
  'Graduation is preferred; relevant structured teaching experience is valued.',
  'Prior experience teaching children, English, phonics, grammar, communication or public speaking is an advantage.',
  'A laptop or desktop with camera and microphone, reliable broadband and a quiet teaching space.',
  'Comfort using Zoom / Teams-style online classrooms, screen sharing and digital lesson materials.',
  'Consistent availability; candidates who can offer 3–4 teaching hours per day are especially useful to our scheduling team.',
  'Professional reliability, punctuality and willingness to follow Tiny Steps teaching and child-safety standards.',
];

const PROCESS_STEPS = [
  {
    title: 'Apply online',
    description: 'Share your contact details, teaching background, preferred subject area, availability and resume or LinkedIn link.',
  },
  {
    title: 'HR screening',
    description: 'A short screening conversation checks English communication, teaching background, availability and role fit.',
  },
  {
    title: 'Training + teaching demo',
    description: 'Review the assigned Tiny Steps program and conduct a short demo using our classroom expectations and lesson format.',
  },
  {
    title: 'Onboarding + slots',
    description: 'Selected teachers complete onboarding, confirm consistent availability and become eligible for class allocation.',
  },
];

const FAQS = [
  {
    question: 'Is Tiny Steps hiring online English teachers for work from home roles?',
    answer:
      'Yes. Tiny Steps Learning accepts applications for remote online English teaching. The primary role covers Phonics, Grammar and Public Speaking / Spoken English for children aged 3–12.',
  },
  {
    question: 'Can PlanetSpark, Vedantu, Learn2Read or Instrucko teachers apply to Tiny Steps?',
    answer:
      'Yes. Teachers who currently work with, previously worked with, or are considering opportunities at Vedantu, PlanetSpark, Learn2Read, Instrucko or other EdTech platforms may apply. Candidates must respect any existing employment, confidentiality or conflict-of-interest obligations.',
  },
  {
    question: 'Is Tiny Steps affiliated with Vedantu, PlanetSpark, Learn2Read or Instrucko?',
    answer:
      'No. Tiny Steps Learning is an independent education company and is not affiliated with, endorsed by, or part of Vedantu, PlanetSpark, Learn2Read or Instrucko. Those names are mentioned only because teachers often compare online teaching opportunities across EdTech platforms.',
  },
  {
    question: 'How much does Tiny Steps pay online teachers?',
    answer:
      'The current teaching compensation is ₹175 per completed 35-minute class. Class allocation depends on student admissions, teacher availability, scheduling fit and ongoing teaching quality.',
  },
  {
    question: 'What subjects can I teach at Tiny Steps?',
    answer:
      'Tiny Steps currently recruits teachers for Phonics, Grammar and Public Speaking / Spoken English. Candidates may indicate one primary strength and any additional subjects they can confidently teach.',
  },
  {
    question: 'Do I need phonics experience to apply?',
    answer:
      'Phonics experience is valuable but not the only route. Strong English teachers with child-teaching experience may also be considered for Grammar or Public Speaking roles and can be trained on Tiny Steps lesson standards where appropriate.',
  },
  {
    question: 'What equipment do I need for online teaching?',
    answer:
      'You need a laptop or desktop with a working camera and microphone, stable broadband, a quiet teaching environment and the ability to share lesson audio and present digital materials professionally.',
  },
  {
    question: 'What teaching hours are preferred?',
    answer:
      'We value consistent availability and currently prefer teachers who can offer around 3–4 hours per day. Evening and weekend availability can be particularly useful because many children attend classes outside school hours.',
  },
  {
    question: 'How do I apply for Tiny Steps teacher jobs?',
    answer:
      'Complete the application form on this page or send the pre-filled teacher application message on WhatsApp. Include your city, teaching experience, preferred subject area, daily availability and a resume or LinkedIn link.',
  },
];

const COMPARISON_POINTS = [
  'How long is each class and is it 1:1 or group-based?',
  'How much daily availability is expected?',
  'Are curriculum and teaching materials provided?',
  'How is compensation calculated and communicated?',
  'What training and academic support are available?',
  'Which age groups and English skills will you teach?',
];

const applicationInitialValues = {
  name: '',
  email: '',
  phone: '',
  city: '',
  experience: '',
  specialization: 'Phonics',
  currentContext: '',
  availability: '',
  resumeLink: '',
  note: '',
};

type ApplicationValues = typeof applicationInitialValues;

function CareerApplicationForm() {
  const [values, setValues] = useState<ApplicationValues>(applicationInitialValues);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedStart = useRef(false);

  const update = (field: keyof ApplicationValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const trackStart = () => {
    if (hasTrackedStart.current) return;
    hasTrackedStart.current = true;
    trackEvent('career_application_start', {
      page_path: CAREERS_PATH,
      role: 'online_english_teacher',
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const message = [
      `Role: ${ROLE_TITLE}`,
      `City: ${values.city}`,
      `Teaching experience: ${values.experience}`,
      `Primary specialization: ${values.specialization}`,
      `Current / recent teaching context: ${values.currentContext || 'Not provided'}`,
      `Daily availability: ${values.availability}`,
      `Resume / LinkedIn: ${values.resumeLink || 'Not provided'}`,
      `Additional note: ${values.note || 'Not provided'}`,
    ].join('\n');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          message,
          topic: 'Teacher application',
          pagePath: CAREERS_PATH,
          submittedAt: new Date().toISOString(),
          ...buildLeadAttributionPayload(CAREERS_PATH),
        }),
      });

      if (!response.ok) throw new Error('career_application_submit_failed');

      trackEvent('career_application_submit', {
        page_path: CAREERS_PATH,
        role: 'online_english_teacher',
        specialization: values.specialization.toLowerCase().replace(/\s+/g, '_'),
      });

      setSubmitted(true);
      setValues(applicationInitialValues);
    } catch {
      trackEvent('career_application_error', {
        page_path: CAREERS_PATH,
        role: 'online_english_teacher',
      });
      setError(`We could not submit your application right now. Please email ${PUBLIC_CONTACT_EMAIL} or use WhatsApp.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} onFocusCapture={trackStart} className="mt-8 grid gap-5 md:grid-cols-2">
      <label className="text-sm font-medium text-slate-800">
        Full name
        <input
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="Your full name"
          autoComplete="name"
          required
        />
      </label>

      <label className="text-sm font-medium text-slate-800">
        Email address
        <input
          type="email"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>

      <label className="text-sm font-medium text-slate-800">
        Phone / WhatsApp number
        <input
          type="tel"
          value={values.phone}
          onChange={(event) => update('phone', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="+91 ..."
          autoComplete="tel"
          required
        />
      </label>

      <label className="text-sm font-medium text-slate-800">
        City
        <input
          value={values.city}
          onChange={(event) => update('city', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="Hyderabad, Bengaluru, Pune..."
          autoComplete="address-level2"
          required
        />
      </label>

      <label className="text-sm font-medium text-slate-800">
        Teaching experience
        <input
          value={values.experience}
          onChange={(event) => update('experience', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="Example: 3 years online English teaching"
          required
        />
      </label>

      <label className="text-sm font-medium text-slate-800">
        Primary teaching strength
        <select
          value={values.specialization}
          onChange={(event) => update('specialization', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          required
        >
          <option>Phonics</option>
          <option>Grammar</option>
          <option>Public Speaking</option>
          <option>Spoken English</option>
          <option>Multiple areas</option>
        </select>
      </label>

      <label className="text-sm font-medium text-slate-800">
        Current / recent teaching context
        <input
          value={values.currentContext}
          onChange={(event) => update('currentContext', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="School, EdTech platform, online tutoring, career break..."
        />
      </label>

      <label className="text-sm font-medium text-slate-800">
        Daily availability
        <input
          value={values.availability}
          onChange={(event) => update('availability', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="Example: 5 PM–9 PM IST, Mon–Sat"
          required
        />
      </label>

      <label className="text-sm font-medium text-slate-800 md:col-span-2">
        Resume or LinkedIn link <span className="font-normal text-slate-500">(recommended)</span>
        <input
          type="url"
          value={values.resumeLink}
          onChange={(event) => update('resumeLink', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="https://..."
        />
      </label>

      <label className="text-sm font-medium text-slate-800 md:col-span-2">
        Anything else we should know? <span className="font-normal text-slate-500">(optional)</span>
        <textarea
          value={values.note}
          onChange={(event) => update('note', event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="Certifications, age groups taught, phonics methodology, preferred schedule, etc."
        />
      </label>

      <div className="md:col-span-2">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full rounded-full bg-slate-950 px-8 text-white hover:bg-slate-800 md:w-auto"
        >
          {isSubmitting ? 'Submitting application...' : 'Submit teacher application'}
          {!isSubmitting ? <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /> : null}
        </Button>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          By applying, you confirm that the information you provide is accurate and that you will respect any contractual or confidentiality obligations you may have with a current or former employer.
        </p>
      </div>

      {submitted ? (
        <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status" aria-live="polite">
          Application received. Our team will review your profile and contact shortlisted candidates.
        </div>
      ) : null}

      {error ? (
        <div className="md:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      ) : null}
    </form>
  );
}

export default function CareersPage() {
  useEffect(() => {
    const jobPostingSchema = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      '@id': 'https://tinystepslearning.com/careers#online-english-teacher',
      identifier: {
        '@type': 'PropertyValue',
        name: 'Tiny Steps Learning',
        value: 'TS-ONLINE-ENGLISH-TEACHER-2026',
      },
      title: ROLE_TITLE,
      description:
        'Remote part-time online English teaching opportunity with Tiny Steps Learning. Teach live 1:1 classes for children aged 3–12 across phonics, grammar and public speaking / spoken English. Tiny Steps provides structured curriculum and lesson materials. Current compensation is ₹175 per completed 35-minute class. Candidates should have strong English communication, reliable internet, a laptop or desktop and consistent availability.',
      datePosted: '2026-08-20',
      employmentType: 'PART_TIME',
      directApply: true,
      industry: 'Online Education',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Tiny Steps Learning',
        sameAs: 'https://tinystepslearning.com/',
      },
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'India',
      },
      responsibilities:
        'Teach live 1:1 English classes for children aged 3–12, follow Tiny Steps lesson materials and classroom standards, maintain professional online delivery and complete progress and scheduling processes consistently.',
      skills:
        'English communication, online teaching, child engagement, phonics, grammar, public speaking, spoken English, screen sharing and digital classroom skills.',
      qualifications:
        'Strong spoken and written English. Graduation preferred. Relevant structured teaching experience is valued. Laptop or desktop, reliable broadband, camera, microphone and a quiet teaching environment are required.',
      url: 'https://tinystepslearning.com/careers',
    };

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': 'https://tinystepslearning.com/careers#faq',
      mainEntity: FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': 'https://tinystepslearning.com/careers#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://tinystepslearning.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Online Teaching Jobs',
          item: 'https://tinystepslearning.com/careers',
        },
      ],
    };

    applySeo({
      title: 'Online English Teacher Jobs (WFH) | Tiny Steps Learning',
      description:
        'Apply for remote online English teacher jobs at Tiny Steps Learning. Teach phonics, grammar and public speaking to kids. ₹175 per 35-minute class.',
      keywords: [
        'online English teacher jobs',
        'work from home teacher jobs',
        'remote English teacher jobs India',
        'online phonics teacher jobs',
        'public speaking teacher jobs online',
        'spoken English teacher jobs work from home',
        'PlanetSpark teacher jobs alternative',
        'Vedantu teacher jobs alternative',
        'Learn2Read phonics teacher jobs',
        'Instrucko teacher jobs',
        'online teaching jobs for English teachers',
        'Tiny Steps Learning careers',
      ],
      canonicalPath: CAREERS_PATH,
      ogType: 'website',
      jsonLd: [jobPostingSchema, faqSchema, breadcrumbSchema],
    });
  }, []);

  const whatsappLink = buildWhatsAppLink();

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white px-6 pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_40%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_38%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Remote online teaching opportunities
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl md:leading-[1.02]">
              Online English Teacher Jobs — Teach Phonics, Grammar & Public Speaking From Home
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              Join Tiny Steps Learning as an online English teacher and work with children aged 3–12 through live 1:1 classes. We provide structured curriculum, teaching materials and onboarding support so you can focus on clear, engaging instruction.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
              {['₹175 / 35-min class', 'Fully remote', 'Live 1:1 classes', 'Curriculum provided'].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-slate-950 px-7 text-white hover:bg-slate-800">
                <a href="#apply">
                  Apply for teacher role
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-white px-7">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Apply on WhatsApp
                </a>
              </Button>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
              Current and former teachers from other schools or EdTech platforms are welcome to apply, subject to their existing contractual obligations.
            </p>
          </div>

          <Card className="border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-200/70 md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Search className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">At a glance</p>
                <h2 className="mt-1 text-2xl font-bold">Tiny Steps teacher role</h2>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-white/10">
              {AT_A_GLANCE.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[0.8fr_1.2fr] gap-4 py-3 text-sm">
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Why teachers consider Tiny Steps</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">A focused online teaching role with clear expectations</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The role is designed for teachers who want structured content, short 1:1 classes, remote delivery and a clear per-class rate.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                Comparing online teaching opportunities?
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                Already teaching with—or considering—Vedantu, PlanetSpark, Learn2Read or Instrucko?
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                You can still apply to Tiny Steps Learning. We welcome experienced online educators as well as teachers comparing their next EdTech opportunity. Previous employment with any specific platform is not required.
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Tiny Steps Learning is independent and is not affiliated with, endorsed by, or part of Vedantu, PlanetSpark, Learn2Read or Instrucko. These company names are included only to help teachers evaluating multiple online teaching opportunities understand whether this role may be relevant to them.
              </p>
            </div>

            <Card className="border border-slate-200 bg-slate-50 p-6 md:p-7">
              <h3 className="text-xl font-bold text-slate-950">When comparing teacher jobs, check these six things</h3>
              <ul className="mt-5 space-y-3">
                {COMPARISON_POINTS.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section id="role" className="scroll-mt-24 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border border-slate-200 bg-white p-7 shadow-sm md:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-700">What you will do</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Online English Teacher responsibilities</h2>
              <ul className="mt-7 space-y-4">
                {RESPONSIBILITIES.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border border-slate-200 bg-white p-7 shadow-sm md:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">What we look for</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Teacher requirements</h2>
              <ul className="mt-7 space-y-4">
                {REQUIREMENTS.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-7">
            <div className="flex gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-800" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-bold text-amber-950">Transparent class allocation</h3>
                <p className="mt-2 text-sm leading-6 text-amber-900/80">
                  Applying or being selected does not guarantee a fixed number of classes. Class allocation depends on student admissions, matching, schedule overlap, teacher availability and ongoing teaching quality. We prefer to state this clearly before you apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-16 text-white md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">Selection process</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">From application to onboarding</h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">A simple process designed to assess communication, teaching quality and reliable availability.</p>
          </div>

          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, index) => (
              <li key={step.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="apply" className="scroll-mt-20 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-700">Teacher application</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Apply to teach with Tiny Steps Learning</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Complete the form below. A resume or LinkedIn link is recommended because it helps our hiring team review your teaching background faster.
            </p>
          </div>

          <CareerApplicationForm />

          <div className="mt-8 border-t border-slate-200 pt-7">
            <p className="text-sm font-semibold text-slate-800">Prefer WhatsApp?</p>
            <p className="mt-1 text-sm text-slate-600">Use the pre-filled teacher application message and add your details.</p>
            <Button asChild variant="outline" className="mt-4 rounded-full">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Open teacher application on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Teacher job FAQ</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Questions online English teachers ask before applying</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Direct answers for teachers searching Google, ChatGPT or other search and answer engines for remote teaching opportunities.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 open:bg-white">
                <summary className="cursor-pointer list-none pr-8 text-lg font-bold text-slate-950 marker:content-none">
                  {faq.question}
                </summary>
                <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-slate-950 p-7 text-white md:p-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-300">Understand what you will teach</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Explore the Tiny Steps academic approach before you apply</h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Candidates can review our public program pages to understand the skills, learner age range and teaching style behind Tiny Steps classes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['/phonics', 'Online Phonics Program'],
                ['/grammar', 'Grammar Program'],
                ['/speaking', 'Public Speaking Program'],
                ['/curriculum', 'Curriculum Roadmap'],
                ['/class-samples', 'Class Samples'],
                ['/team', 'Meet the Tiny Steps Team'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <span>{label}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">Ready to apply for an online teaching role?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Share your teaching experience, preferred subject area and consistent availability. We will review your profile for current teacher requirements.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full bg-slate-950 px-7 text-white hover:bg-slate-800">
              <a href="#apply">Apply now</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-white px-7">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">Apply on WhatsApp</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
