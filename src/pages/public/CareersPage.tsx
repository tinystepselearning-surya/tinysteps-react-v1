import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Globe2,
  GraduationCap,
  IndianRupee,
  Laptop,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { trackEvent } from '../../lib/analytics';
import { applySeo } from '../../lib/seo';

const CAREERS_PATH = '/careers';
const CAREERS_URL = 'https://tinystepslearning.com/careers';
const ROLE_TITLE = 'Online English Teacher - Phonics, Grammar & Public Speaking';
const WHATSAPP_NUMBER = '919618398383';
const CAREERS_TITLE = 'Online English Teacher Jobs Worldwide | Tiny Steps Learning';
const CAREERS_DESCRIPTION =
  'Apply for remote online English teacher jobs with Tiny Steps Learning. Teach phonics, grammar, spoken English and public speaking to children in live 1:1 classes.';

const buildGeneralWhatsAppLink = () => {
  const message = [
    'Hello Tiny Steps Learning! I would like to apply for the Online English Teacher role.',
    '',
    'Name: _____',
    'City / Country: _____',
    'Teaching experience: _____',
    'Primary teaching strength: Phonics / Grammar / Public Speaking / Spoken English',
    'Current / recent teaching context: _____',
    'Daily availability + time zone: _____',
    '',
    'I can attach my resume or supporting documents here if required.',
  ].join('\n');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

const AT_A_GLANCE = [
  ['Role', 'Online English Teacher'],
  ['Work mode', 'Fully remote / work from home'],
  ['Applications', 'Qualified teachers worldwide'],
  ['Learners', 'Children aged 3–12'],
  ['Subjects', 'Phonics, Grammar, Speaking'],
  ['Class format', 'Live 1:1 online classes'],
  ['Class duration', '35 minutes'],
  ['Current rate', '₹175 per completed class'],
];

const BENEFITS = [
  {
    icon: Clock3,
    title: 'Focused 35-minute classes',
    description: 'Teach concise, structured sessions built for young learners instead of long lecture-style classes.',
    cardClass: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white hover:border-blue-200',
    iconClass: 'bg-blue-100 text-blue-700',
  },
  {
    icon: BookOpenCheck,
    title: 'Curriculum and materials provided',
    description: 'Use Tiny Steps lesson content, activities and teaching guidance rather than building every class from scratch.',
    cardClass: 'border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white hover:border-violet-200',
    iconClass: 'bg-violet-100 text-violet-700',
  },
  {
    icon: Globe2,
    title: 'A genuinely remote role',
    description: 'Apply from anywhere, subject to role fit, time-zone overlap, local requirements and reliable online delivery.',
    cardClass: 'border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-white hover:border-cyan-200',
    iconClass: 'bg-cyan-100 text-cyan-700',
  },
  {
    icon: IndianRupee,
    title: 'Clear per-class compensation',
    description: 'The current standard teaching rate is ₹175 for each completed 35-minute class.',
    cardClass: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white hover:border-amber-200',
    iconClass: 'bg-amber-100 text-amber-700',
  },
  {
    icon: GraduationCap,
    title: 'Training and academic support',
    description: 'Receive onboarding guidance on programs, class standards, lesson flow, presentation and child engagement.',
    cardClass: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white hover:border-emerald-200',
    iconClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: Users,
    title: '1:1 child-focused teaching',
    description: 'Work closely with individual learners and adapt delivery to the child’s pace within a structured curriculum.',
    cardClass: 'border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white hover:border-orange-200',
    iconClass: 'bg-orange-100 text-orange-700',
  },
];

const RESPONSIBILITIES = [
  'Conduct engaging live 1:1 English classes for children aged 3–12.',
  'Teach assigned lessons in Phonics, Grammar, Public Speaking or Spoken English using Tiny Steps materials.',
  'Maintain clear pronunciation, age-appropriate language and a warm, child-friendly teaching style.',
  'Follow Tiny Steps classroom presentation standards, including the approved virtual teaching background.',
  'Share screens correctly, including lesson audio when required, and present digital lesson materials professionally.',
  'Record concise class progress and follow scheduling, attendance and quality processes consistently.',
  'Maintain full attention throughout every 35-minute class and create a professional online learning environment.',
];

const REQUIREMENTS = [
  'Strong spoken and written English with clear pronunciation and confident communication.',
  'Graduation is preferred; relevant structured teaching experience is valued.',
  'Experience teaching children, English, phonics, grammar, communication or public speaking is an advantage.',
  'A laptop or desktop with camera and microphone, reliable broadband and a quiet teaching space.',
  'Comfort using Zoom / Teams-style online classrooms, screen sharing and digital lesson materials.',
  'Consistent availability; around 3–4 teaching hours per day is especially useful for scheduling.',
  'Professional reliability, punctuality and willingness to follow Tiny Steps teaching and child-safety standards.',
];

const PROCESS_STEPS = [
  {
    title: 'Apply on this page',
    description: 'Enter your teaching profile and availability. Submit opens WhatsApp with your details already prepared.',
    tone: 'border-blue-200 bg-blue-50/70',
  },
  {
    title: 'HR screening',
    description: 'A short conversation checks English communication, teaching background, availability and role fit.',
    tone: 'border-violet-200 bg-violet-50/70',
  },
  {
    title: 'Training + teaching demo',
    description: 'Review the assigned Tiny Steps program and conduct a demo using our classroom standards and lesson format.',
    tone: 'border-emerald-200 bg-emerald-50/70',
  },
  {
    title: 'Onboarding + class matching',
    description: 'Selected teachers complete onboarding, confirm reliable slots and become eligible for class allocation.',
    tone: 'border-orange-200 bg-orange-50/70',
  },
];

const FAQS = [
  {
    question: 'Is Tiny Steps hiring remote online English teachers?',
    answer:
      'Yes. Tiny Steps Learning accepts applications for remote online English teaching roles covering Phonics, Grammar, Public Speaking and Spoken English for children aged 3–12. Applications may be submitted internationally, subject to role fit, time-zone compatibility and local engagement requirements.',
  },
  {
    question: 'Can teachers outside India apply?',
    answer:
      'Yes. Qualified teachers from different countries may apply. Because classes are live, reliable internet, professional English communication and schedule overlap with available learners are essential. Final engagement may also depend on payment and contracting feasibility in the applicant’s location.',
  },
  {
    question: 'Can PlanetSpark, Vedantu, Learn2Read or Instrucko teachers apply to Tiny Steps?',
    answer:
      'Yes. Teachers who currently work with, previously worked with, or are considering opportunities at Vedantu, PlanetSpark, Learn2Read, Instrucko or other education platforms may apply. Candidates must respect any existing employment, confidentiality or conflict-of-interest obligations.',
  },
  {
    question: 'Is Tiny Steps affiliated with Vedantu, PlanetSpark, Learn2Read or Instrucko?',
    answer:
      'No. Tiny Steps Learning is an independent education company and is not affiliated with, endorsed by, or part of Vedantu, PlanetSpark, Learn2Read or Instrucko. Those names are mentioned only because teachers often compare remote teaching opportunities across education platforms.',
  },
  {
    question: 'How much does Tiny Steps pay online teachers?',
    answer:
      'The current standard teaching compensation is ₹175 per completed 35-minute class. Class allocation depends on student admissions, teacher availability, scheduling fit and ongoing teaching quality.',
  },
  {
    question: 'What subjects can I teach at Tiny Steps?',
    answer:
      'Tiny Steps recruits online teachers for Phonics, Grammar, Public Speaking and Spoken English. Candidates can indicate one primary strength and additional areas they are confident teaching.',
  },
  {
    question: 'Do I need phonics experience to apply?',
    answer:
      'Phonics experience is valuable but is not the only route. Strong English teachers with child-teaching experience may also be considered for Grammar, Spoken English or Public Speaking roles and can be trained on Tiny Steps lesson standards where appropriate.',
  },
  {
    question: 'What equipment do I need for online teaching?',
    answer:
      'You need a laptop or desktop with a working camera and microphone, stable broadband, a quiet teaching environment and the ability to share lesson audio and present digital materials professionally.',
  },
  {
    question: 'What teaching hours are preferred?',
    answer:
      'We value consistent availability and currently prefer teachers who can offer around 3–4 hours per day. Evening and weekend availability can be especially useful, while international applicants should clearly state their time zone and available teaching window.',
  },
  {
    question: 'How do I send my resume or supporting documents?',
    answer:
      'The application form does not ask for a resume upload or resume link. When you submit the form, WhatsApp opens with your application details. You can then attach your resume, certificates or other supporting documents directly in WhatsApp if you wish.',
  },
];

const COMPARISON_POINTS = [
  'Is the class 1:1 or group-based?',
  'How long is each live class?',
  'Are curriculum and teaching materials provided?',
  'How is compensation calculated and communicated?',
  'What training and academic support are available?',
  'Which ages, skills and time zones will you teach?',
];

const applicationInitialValues = {
  name: '',
  email: '',
  phone: '',
  location: '',
  experience: '',
  specialization: 'Phonics',
  currentContext: '',
  availability: '',
  note: '',
};

type ApplicationValues = typeof applicationInitialValues;

function buildApplicationWhatsAppLink(values: ApplicationValues) {
  const message = [
    'Hello Tiny Steps Learning! I would like to apply for the Online English Teacher role.',
    '',
    `Name: ${values.name}`,
    `Email: ${values.email || 'Not provided'}`,
    `Phone / WhatsApp: ${values.phone}`,
    `City / Country: ${values.location}`,
    `Teaching experience: ${values.experience}`,
    `Primary teaching strength: ${values.specialization}`,
    `Current / recent teaching context: ${values.currentContext || 'Not provided'}`,
    `Daily availability + time zone: ${values.availability}`,
    `Additional note: ${values.note || 'Not provided'}`,
    '',
    'I can attach my resume, certificates or supporting documents here if required.',
  ].join('\n');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function CareerApplicationForm() {
  const [values, setValues] = useState<ApplicationValues>(applicationInitialValues);
  const [submitted, setSubmitted] = useState(false);
  const hasTrackedStart = useRef(false);

  const update = (field: keyof ApplicationValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitted(false);
  };

  const trackStart = () => {
    if (hasTrackedStart.current) return;
    hasTrackedStart.current = true;
    trackEvent('career_application_start', {
      page_path: CAREERS_PATH,
      role: 'online_english_teacher',
      application_channel: 'whatsapp',
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    trackEvent('career_application_whatsapp_submit', {
      page_path: CAREERS_PATH,
      role: 'online_english_teacher',
      specialization: values.specialization.toLowerCase().replace(/\s+/g, '_'),
      application_channel: 'whatsapp',
    });

    setSubmitted(true);
    window.open(buildApplicationWhatsAppLink(values), '_blank', 'noopener,noreferrer');
  };

  const inputClass =
    'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

  return (
    <form onSubmit={handleSubmit} onFocusCapture={trackStart} className="mt-7 grid gap-5 md:grid-cols-2">
      <label className="text-sm font-semibold text-slate-800">
        Full name
        <input
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          className={inputClass}
          placeholder="Your full name"
          autoComplete="name"
          required
        />
      </label>

      <label className="text-sm font-semibold text-slate-800">
        Phone / WhatsApp number
        <input
          type="tel"
          value={values.phone}
          onChange={(event) => update('phone', event.target.value)}
          className={inputClass}
          placeholder="+country code ..."
          autoComplete="tel"
          required
        />
      </label>

      <label className="text-sm font-semibold text-slate-800">
        Email address <span className="font-normal text-slate-400">(optional)</span>
        <input
          type="email"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          className={inputClass}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>

      <label className="text-sm font-semibold text-slate-800">
        City / Country
        <input
          value={values.location}
          onChange={(event) => update('location', event.target.value)}
          className={inputClass}
          placeholder="Example: Dubai, UAE"
          autoComplete="address-level2"
          required
        />
      </label>

      <label className="text-sm font-semibold text-slate-800">
        Teaching experience
        <input
          value={values.experience}
          onChange={(event) => update('experience', event.target.value)}
          className={inputClass}
          placeholder="Example: 3 years online English teaching"
          required
        />
      </label>

      <label className="text-sm font-semibold text-slate-800">
        Primary teaching strength
        <select
          value={values.specialization}
          onChange={(event) => update('specialization', event.target.value)}
          className={inputClass}
          required
        >
          <option>Phonics</option>
          <option>Grammar</option>
          <option>Public Speaking</option>
          <option>Spoken English</option>
          <option>Multiple areas</option>
        </select>
      </label>

      <label className="text-sm font-semibold text-slate-800">
        Current / recent teaching context <span className="font-normal text-slate-400">(optional)</span>
        <input
          value={values.currentContext}
          onChange={(event) => update('currentContext', event.target.value)}
          className={inputClass}
          placeholder="School, EdTech platform, tutoring, career break..."
        />
      </label>

      <label className="text-sm font-semibold text-slate-800">
        Daily availability + time zone
        <input
          value={values.availability}
          onChange={(event) => update('availability', event.target.value)}
          className={inputClass}
          placeholder="Example: 5–9 PM GST, Mon–Sat"
          required
        />
      </label>

      <label className="text-sm font-semibold text-slate-800 md:col-span-2">
        Anything else we should know? <span className="font-normal text-slate-400">(optional)</span>
        <textarea
          value={values.note}
          onChange={(event) => update('note', event.target.value)}
          className={`${inputClass} min-h-28 resize-y`}
          placeholder="Age groups taught, certifications, phonics methodology, preferred schedule, etc."
        />
      </label>

      <div className="md:col-span-2">
        <Button
          type="submit"
          size="lg"
          className="group w-full rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 px-7 text-white shadow-lg shadow-blue-950/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
        >
          Continue application on WhatsApp
          <Send className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </Button>
        <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-500">
          Your details are not uploaded by this form. Submitting simply opens WhatsApp with your information pre-filled. You can review the message and attach your resume, certificates or supporting files there before sending.
        </p>

        {submitted ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
            WhatsApp opened with your application details. Review the message, attach any supporting documents you want to share, and send it to Tiny Steps Learning.
          </div>
        ) : null}
      </div>
    </form>
  );
}

export default function CareersPage() {
  useEffect(() => {
    const jobDescription = [
      'Tiny Steps Learning is recruiting remote Online English Teachers to teach children aged 3–12 in live 1:1 classes.',
      'Teachers may be assigned Phonics, Grammar, Public Speaking or Spoken English lessons using structured Tiny Steps curriculum and teaching materials.',
      `Responsibilities include ${RESPONSIBILITIES.join(' ')}`,
      `Qualifications and requirements include ${REQUIREMENTS.join(' ')}`,
      'Applications are welcome from qualified teachers worldwide, subject to time-zone compatibility, role fit, payment feasibility and local engagement requirements.',
      'Consistent availability of around 3–4 teaching hours per day is preferred; evening and weekend availability may be especially useful depending on learner demand.',
      'The current standard teaching rate is ₹175 per completed 35-minute class. Class allocation is not guaranteed and depends on student admissions, scheduling fit, teacher availability and ongoing teaching quality.',
    ].join(' ');

    const jobPostingSchema = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      '@id': `${CAREERS_URL}#online-english-teacher`,
      identifier: {
        '@type': 'PropertyValue',
        name: 'Tiny Steps Learning',
        value: 'TS-ONLINE-ENGLISH-TEACHER-2026',
      },
      title: ROLE_TITLE,
      description: jobDescription,
      datePosted: '2026-08-20',
      employmentType: 'PART_TIME',
      directApply: true,
      industry: 'Online Education',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Tiny Steps Learning',
        sameAs: 'https://tinystepslearning.com',
        url: 'https://tinystepslearning.com',
      },
      jobLocationType: 'TELECOMMUTE',
      responsibilities: RESPONSIBILITIES.join(' '),
      qualifications: REQUIREMENTS.join(' '),
      educationRequirements: 'Graduation preferred; relevant structured teaching experience is valued.',
      experienceRequirements:
        'Prior experience teaching children, English, phonics, grammar, communication or public speaking is an advantage. Strong English teachers with relevant child-teaching experience may also be considered.',
      skills:
        'Online English teaching; phonics; grammar; spoken English; public speaking; child engagement; clear pronunciation; screen sharing; digital classroom delivery.',
      workHours:
        'Consistent availability is required. Around 3–4 teaching hours per day is preferred; evening and weekend availability can be useful depending on learner demand and time-zone overlap.',
      url: CAREERS_URL,
    };

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
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
          item: CAREERS_URL,
        },
      ],
    };

    applySeo({
      title: CAREERS_TITLE,
      description: CAREERS_DESCRIPTION,
      keywords: [
        'online English teacher jobs',
        'remote English teacher jobs',
        'online English teacher jobs worldwide',
        'work from home English teacher jobs',
        'online phonics teacher jobs',
        'phonics teacher jobs remote',
        'online grammar teacher jobs',
        'public speaking teacher jobs online',
        'spoken English teacher jobs',
        'online English tutor jobs',
        'remote tutoring jobs for English teachers',
        'English teaching jobs from home',
        'international online teaching jobs',
        'Vedantu teacher jobs alternative',
        'PlanetSpark teacher jobs alternative',
        'Learn2Read phonics teacher jobs',
        'Instrucko teacher jobs',
        'Tiny Steps Learning careers',
      ],
      canonicalPath: CAREERS_PATH,
      ogType: 'website',
      jsonLd: [jobPostingSchema, faqSchema, breadcrumbSchema],
    });
  }, []);

  const whatsappLink = buildGeneralWhatsAppLink();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-orange-50 via-white to-blue-50 px-5 py-12 md:px-6 md:py-16">
        <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-4 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-sm font-bold text-orange-800 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Remote English teaching opportunities worldwide
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-6xl md:leading-[1.02]">
              Online English Teacher Jobs for Phonics, Grammar & Speaking
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              Teach children through live 1:1 online classes with structured curriculum, ready-to-use lesson materials and academic support. We welcome qualified English teachers from different countries and teaching backgrounds.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 text-sm font-bold text-slate-700">
              {['₹175 / 35-min class', 'Fully remote', 'Live 1:1 classes', 'Curriculum provided', 'Global applications'].map((item) => (
                <span key={item} className="rounded-full border border-white bg-white/90 px-4 py-2 shadow-sm">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="group rounded-full bg-slate-950 px-7 text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800">
                <a href="#apply">
                  Apply to teach
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-blue-200 bg-white/90 px-7 text-blue-950 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Start on WhatsApp
                </a>
              </Button>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
              Current and former teachers from schools, tutoring companies and EdTech platforms are welcome to apply, subject to their existing contractual, confidentiality and conflict-of-interest obligations.
            </p>
          </div>

          <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-0 text-white shadow-2xl shadow-blue-950/20">
            <div className="border-b border-white/10 bg-white/5 p-6 md:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 p-3 text-slate-950 shadow-lg">
                  <Globe2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">At a glance</p>
                  <h2 className="mt-1 text-2xl font-black">Tiny Steps teacher role</h2>
                </div>
              </div>
            </div>

            <dl className="px-6 py-3 md:px-7">
              {AT_A_GLANCE.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[0.82fr_1.18fr] gap-4 border-b border-white/10 py-3 text-sm last:border-b-0">
                  <dt className="text-slate-300">{label}</dt>
                  <dd className="font-bold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </section>

      <section className="px-5 py-12 md:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Why teachers consider Tiny Steps</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">A polished remote teaching role with clear expectations</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">
              Focus on teaching while the lesson structure, materials and academic framework are already in place.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, description, cardClass, iconClass }) => (
              <Card
                key={title}
                className={`group border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 ${cardClass}`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110 ${iconClass}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-12 md:px-6 md:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Comparing remote teaching opportunities?
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              Teaching with—or considering—Vedantu, PlanetSpark, Learn2Read or Instrucko?
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              You can apply to Tiny Steps Learning. Previous employment with any specific platform is not required; we assess communication, teaching quality, reliability and role fit.
            </p>
            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
              Tiny Steps Learning is independent and is not affiliated with, endorsed by, or part of Vedantu, PlanetSpark, Learn2Read or Instrucko. These company names are referenced only because teachers commonly compare online teaching opportunities.
            </p>
          </div>

          <Card className="border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/60 p-6 shadow-sm md:p-7">
            <h3 className="text-xl font-black text-slate-950">Compare the role on the details that matter</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {COMPARISON_POINTS.map((item) => (
                <li key={item} className="group flex items-start gap-3 rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700 transition duration-200 hover:border-blue-100 hover:bg-white hover:shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 transition group-hover:scale-110" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section id="role" className="scroll-mt-24 px-5 py-12 md:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="overflow-hidden border border-orange-100 bg-white p-0 shadow-sm transition duration-300 hover:shadow-lg">
              <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-7 py-5 md:px-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">What you will do</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Online English Teacher responsibilities</h2>
              </div>
              <ul className="space-y-3 p-7 md:p-8">
                {RESPONSIBILITIES.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="overflow-hidden border border-blue-100 bg-white p-0 shadow-sm transition duration-300 hover:shadow-lg">
              <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-7 py-5 md:px-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">What we look for</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Teacher requirements</h2>
              </div>
              <ul className="space-y-3 p-7 md:p-8">
                {REQUIREMENTS.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-5 grid gap-4 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/70 to-white p-6 md:grid-cols-[auto_1fr] md:items-start md:p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-950">Transparent class allocation</h3>
              <p className="mt-1 text-sm leading-6 text-amber-950/75">
                Applying or being selected does not guarantee a fixed number of classes. Allocation depends on student admissions, learner-teacher matching, schedule overlap, teacher availability and ongoing teaching quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 px-5 py-12 text-white md:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Selection process</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">From application to onboarding</h2>
            <p className="mt-3 text-lg leading-8 text-slate-300">A straightforward process focused on communication, teaching quality and reliable availability.</p>
          </div>

          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, index) => (
              <li
                key={step.title}
                className={`group rounded-3xl border p-5 text-slate-950 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${step.tone}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950 shadow-sm transition group-hover:scale-110">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="apply" className="scroll-mt-20 bg-gradient-to-br from-blue-50 via-white to-orange-50 px-5 py-12 md:px-6 md:py-14">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white bg-white/95 shadow-2xl shadow-slate-200/70">
          <div className="grid gap-0 lg:grid-cols-[0.34fr_0.66fr]">
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 p-7 text-white md:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-blue-200">Teacher application</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Apply in one simple WhatsApp flow</h2>
              <p className="mt-4 text-sm leading-7 text-blue-100">
                Fill in your basic details here. When you submit, WhatsApp opens with the information already prepared. No resume upload is required on this page.
              </p>
              <div className="mt-6 space-y-3 text-sm text-blue-50">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
                  <span>Review your message before sending.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
                  <span>Attach your resume or certificates directly in WhatsApp if you want to share them.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
                  <span>No failed website submission or duplicate application step.</span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 lg:p-9">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">Tell us about your teaching profile</p>
                <h3 className="mt-2 text-3xl font-black tracking-tight">Continue your application on WhatsApp</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Keep your details concise. International applicants should include their country and time zone so scheduling can be reviewed accurately.
                </p>
              </div>

              <CareerApplicationForm />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-12 md:px-6 md:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Teacher job FAQ</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Questions online English teachers ask before applying</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">
              Clear answers about remote teaching, international applications, subjects, equipment, schedules and the application process.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-slate-200 bg-slate-50/70 transition duration-200 open:border-blue-200 open:bg-white open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-black text-slate-950 marker:content-none md:px-6">
                  <span>{faq.question}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm transition group-open:rotate-180">
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </span>
                </summary>
                <p className="max-w-4xl px-5 pb-5 text-sm leading-7 text-slate-600 md:px-6 md:pb-6">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-7 text-white shadow-xl md:p-9">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300">Understand what you will teach</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Explore the Tiny Steps academic approach</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                Review our public program pages to understand the skills, learner ages and teaching style behind Tiny Steps classes.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:border-blue-300/40 hover:bg-white/10"
                  >
                    <span>{label}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-7 shadow-sm md:p-9">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-cyan-800">Looking for English classes instead?</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Parents and learners can explore our programs here</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                This page is for teachers. If you are searching for phonics, grammar, spoken English or public speaking classes for a child, use our learner pathways instead.
              </p>
              <Button asChild variant="outline" className="mt-5 rounded-full border-cyan-200 bg-white text-slate-950 hover:bg-cyan-50">
                <Link to="/courses">
                  Explore English courses
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
