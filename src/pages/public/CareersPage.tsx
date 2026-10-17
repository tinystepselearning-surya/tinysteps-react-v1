import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Gift,
  Globe2,
  GraduationCap,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Video,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { applySeo } from '../../lib/seo';

const CAREERS_PATH = '/careers';
const CAREERS_URL = 'https://tinystepslearning.com/careers';
const CAREERS_CLOSED_DATE = '11 October 2026';
const CAREERS_CLOSED_DATE_ISO = '2026-10-11';
const CAREERS_TITLE = 'Tiny Steps Learning Careers | Teacher Recruitment Closed';
const CAREERS_DESCRIPTION =
  'Tiny Steps Learning teacher positions are filled. Applications closed on 11 October 2026; no new teacher applications are being accepted.';

const AT_A_GLANCE = [
  ['Role', 'Online English Teacher'],
  ['Work mode', 'Fully remote / work from home'],
  ['Recruitment status', 'Positions filled'],
  ['Open teacher vacancies', '0'],
  ['Applications closed', CAREERS_CLOSED_DATE],
  ['Next recruitment', 'Not announced'],
  ['Learners', 'Children aged 3–12'],
  ['Subjects', 'Phonics, Grammar, Speaking'],
  ['Class format', 'Live 1:1 online classes'],
  ['Class duration', '35 minutes'],
  ['Previous regular rate', '₹175 per completed class'],
  ['Previous extended rate', '₹200 per completed class'],
];

const BENEFITS = [
  {
    icon: Clock3,
    title: 'Focused 35-minute classes',
    description: 'Teach concise, structured sessions designed for young learners instead of long lecture-style classes.',
    cardClass: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white hover:border-blue-200',
    iconClass: 'bg-blue-100 text-blue-700',
  },
  {
    icon: BookOpenCheck,
    title: 'Curriculum and materials provided',
    description: 'Use Tiny Steps lesson content, activities and teaching guidance rather than preparing every class from scratch.',
    cardClass: 'border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white hover:border-violet-200',
    iconClass: 'bg-violet-100 text-violet-700',
  },
  {
    icon: Globe2,
    title: 'Remote teaching across India',
    description: 'Teach from home from anywhere in India, with scheduling matched to learner demand and your confirmed availability.',
    cardClass: 'border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-white hover:border-cyan-200',
    iconClass: 'bg-cyan-100 text-cyan-700',
  },
  {
    icon: IndianRupee,
    title: 'Clear per-class compensation',
    description: '₹175 for regular-timing classes and ₹200 for classes before 9 AM or after 9 PM IST.',
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
    description: 'Work closely with individual learners and adapt delivery to each child’s pace within a structured curriculum.',
    cardClass: 'border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white hover:border-orange-200',
    iconClass: 'bg-orange-100 text-orange-700',
  },
];

const PAY_RATES = [
  {
    label: 'Regular teaching hours',
    hours: '9:00 AM–9:00 PM IST',
    rate: '₹175',
    note: 'per completed 35-minute class',
    cardClass: 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  {
    label: 'Extended teaching hours',
    hours: 'Before 9:00 AM or after 9:00 PM IST',
    rate: '₹200',
    note: 'per completed 35-minute class',
    cardClass: 'border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50',
    badgeClass: 'bg-orange-100 text-orange-800',
  },
];

const EXTRA_EARNINGS = [
  {
    icon: Video,
    title: 'Demo classes are paid separately',
    description: 'Every assigned demo class has separate compensation. Demo payment is in addition to regular teaching-class earnings.',
    tone: 'border-violet-200 bg-violet-50/80 text-violet-950',
    iconTone: 'bg-violet-100 text-violet-700',
  },
  {
    icon: Trophy,
    title: 'Conversion incentives',
    description: 'In the completed recruitment cycle, successful demo conversions could qualify for additional incentives under the applicable plan.',
    tone: 'border-emerald-200 bg-emerald-50/80 text-emerald-950',
    iconTone: 'bg-emerald-100 text-emerald-700',
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
  'Comfort using Microsoft Teams, screen sharing and digital lesson materials.',
  'Consistent availability; around 3–4 teaching hours per day is especially useful for scheduling.',
  'Professional reliability, punctuality and willingness to follow Tiny Steps teaching and child-safety standards.',
];

const PROCESS_STEPS = [
  {
    title: 'Applications closed',
    description: 'The 2026 teacher recruitment cycle closed on 11 October 2026. New applications are not being accepted.',
    tone: 'border-blue-200 bg-blue-50/80',
  },
  {
    title: 'HR screening',
    description: 'A short conversation reviews English communication, teaching background, availability and role fit.',
    tone: 'border-violet-200 bg-violet-50/80',
  },
  {
    title: 'Training + teaching demo',
    description: 'Review the assigned Tiny Steps program, receive preparation support and begin with paid demo opportunities.',
    tone: 'border-emerald-200 bg-emerald-50/80',
  },
  {
    title: 'Onboarding + schedule building',
    description: 'Confirm your reliable slots and our team actively works on learner matching and building your regular teaching schedule.',
    tone: 'border-orange-200 bg-orange-50/80',
  },
];

const FAQS = [
  {
    question: 'Is Tiny Steps Learning hiring online English teachers right now?',
    answer:
      'No. Tiny Steps Learning currently has zero open online English teacher vacancies. All positions in the 2026 Phonics, Grammar, Public Speaking and Spoken English recruitment cycle were filled, and applications closed on 11 October 2026.',
  },
  {
    question: 'When did Tiny Steps Learning close its 2026 teacher applications?',
    answer:
      'The online English teacher recruitment cycle closed on 11 October 2026 because the advertised positions were filled.',
  },
  {
    question: 'Can I send an application or CV by WhatsApp or email now?',
    answer:
      'No. Tiny Steps Learning is not collecting new teacher applications by website form, WhatsApp or email for this closed recruitment cycle. Existing candidate records remain with the HR team.',
  },
  {
    question: 'When will Tiny Steps Learning advertise teacher vacancies again?',
    answer:
      'No reopening date has been announced. Any future vacancies will be published on this official Careers page. Please check the vacancy status here before contacting the team about recruitment.',
  },
  {
    question: 'Who was eligible for the most recent teaching roles?',
    answer:
      'The completed 2026 recruitment cycle considered India-based teachers with relevant experience and reliable availability in Indian Standard Time (IST). Requirements for any future vacancies will be announced when recruitment resumes.',
  },
  {
    question: 'Does Tiny Steps consider teachers from other education platforms?',
    answer:
      'The completed recruitment cycle considered experienced teachers from other education platforms. There are currently no open teacher vacancies or application submissions.',
  },
  {
    question: 'How much does Tiny Steps pay online teachers?',
    answer:
      'For the completed 2026 recruitment cycle, regular classes scheduled from 9:00 AM to 9:00 PM IST were advertised at ₹175 per completed 35-minute class, and classes before 9:00 AM IST or after 9:00 PM IST at ₹200. Demo compensation and incentives were governed by the applicable plan. These are historical rates, not current vacancies.',
  },
  {
    question: 'What was the illustrative monthly earning potential in the completed cycle?',
    answer:
      'The completed 2026 recruitment page illustrated six completed regular classes per day over six days a week for four weeks: 144 classes at ₹175, or ₹25,200. This was an illustrative scenario, not a guaranteed salary or a current job offer. Actual earnings depended on assigned and completed classes.',
  },
  {
    question: 'Were demo classes paid in the completed recruitment cycle?',
    answer:
      'During the completed recruitment cycle, assigned demo classes were paid separately from regular classes. Additional conversion incentives depended on the applicable incentive plan.',
  },
  {
    question: 'How were selected teachers onboarded in the completed cycle?',
    answer:
      'Selected teachers received preparation support, demo opportunities and scheduling assistance based on their availability and student demand. There are no open roles at present, and future onboarding terms may differ.',
  },
  {
    question: 'Which English programs were included in the closed teaching vacancies?',
    answer:
      'Tiny Steps teacher roles have covered Phonics, Grammar, Public Speaking and Spoken English. All positions in the current recruitment cycle have been filled.',
  },
  {
    question: 'Is phonics experience useful for a future teacher role?',
    answer:
      'Phonics experience has been valuable, alongside teaching experience in Grammar, Spoken English or Public Speaking. Eligibility for future vacancies will be announced when recruitment resumes.',
  },
  {
    question: 'What equipment do I need for online teaching?',
    answer:
      'You need a laptop or desktop with a working camera and microphone, stable broadband, a quiet teaching environment and the ability to share lesson audio and present digital materials professionally.',
  },
  {
    question: 'What teaching hours are preferred?',
    answer:
      'The completed 2026 recruitment cycle preferred teachers with around 3–4 teaching hours available daily. Future vacancies may have different scheduling requirements.',
  },
  {
    question: 'Can I send my CV or supporting documents now?',
    answer:
      'No. Applications closed on 11 October 2026. Please do not send CVs or application materials for this completed recruitment cycle. This page will be updated if new positions become available.',
  },
];

export default function CareersPage() {
  useEffect(() => {
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
          name: 'Careers',
          item: CAREERS_URL,
        },
      ],
    };

    applySeo({
      title: CAREERS_TITLE,
      description: CAREERS_DESCRIPTION,
      keywords: [
        'Tiny Steps Learning careers',
        'Tiny Steps Learning teacher recruitment closed',
        'Tiny Steps Learning recruitment update',
        'Tiny Steps Learning teaching team',
      ],
      canonicalPath: CAREERS_PATH,
      ogType: 'website',
      jsonLd: [faqSchema, breadcrumbSchema],
    });
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-orange-50 via-white to-blue-50 px-5 py-10 md:px-6 md:py-14">
        <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-4 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-7 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-sm font-bold text-orange-800 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Teacher recruitment closed · <time dateTime={CAREERS_CLOSED_DATE_ISO}>{CAREERS_CLOSED_DATE}</time>
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-6xl md:leading-[1.02]">
              Teacher Recruitment Closed — All Positions Filled
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              All online English teaching positions for this recruitment cycle have been filled. Applications closed on 11 October 2026, and we are not accepting new teacher applications at this time.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 text-sm font-bold text-slate-700">
              {['Positions filled', 'Applications closed', 'Phonics', 'Grammar', 'Public Speaking', 'Spoken English'].map((item) => (
                <span key={item} className="rounded-full border border-white bg-white/90 px-4 py-2 shadow-sm">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="group rounded-full bg-slate-950 px-7 text-white shadow-lg transition hover:bg-slate-800">
                <Link to="/team">
                  Meet the Tiny Steps Team
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
              Thank you to everyone who expressed interest in joining Tiny Steps Learning. New teaching openings will be announced here if recruitment resumes.
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
                  <h2 className="mt-1 text-2xl font-black">Previous teacher recruitment cycle</h2>
                </div>
              </div>
            </div>

            <dl className="px-6 py-3 md:px-7">
              {AT_A_GLANCE.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[0.9fr_1.1fr] gap-4 border-b border-white/10 py-3 text-sm last:border-b-0">
                  <dt className="text-slate-300">{label}</dt>
                  <dd className="font-bold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </section>

      <section className="px-5 py-10 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Our teaching approach</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">How Tiny Steps supports quality online teaching</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">
              For reference, these are features of the teaching approach used in our completed 2026 recruitment cycle.
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

      <section className="border-y border-slate-200 bg-white px-5 py-10 md:px-6 md:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">Teaching compensation</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Compensation in the completed 2026 hiring cycle</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">
              For reference, these are the rates published during the completed recruitment cycle, not a current job offer. Future rates may differ.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {PAY_RATES.map((item) => (
              <Card
                key={item.label}
                className={`group border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${item.cardClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${item.badgeClass}`}>
                      {item.label}
                    </span>
                    <p className="mt-4 text-base font-bold text-slate-700">{item.hours}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition group-hover:scale-110">
                    <Clock3 className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-4xl font-black tracking-tight text-slate-950">{item.rate}</span>
                  <span className="pb-1 text-sm font-semibold text-slate-500">{item.note}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {EXTRA_EARNINGS.map(({ icon: Icon, title, description, tone, iconTone }) => (
              <div key={title} className={`group rounded-3xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${tone}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-110 ${iconTone}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black">{title}</h3>
                    <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 text-white shadow-xl shadow-blue-950/10">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border-b border-white/10 p-6 md:p-7 lg:border-b-0 lg:border-r">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Illustrative monthly earnings</p>
                <h3 className="mt-3 text-3xl font-black tracking-tight">Illustrative earnings from the completed cycle</h3>
                <p className="mt-3 text-sm leading-7 text-blue-100">
                  Example: 6 regular classes per day × 6 teaching days per week. Sunday remains a weekly holiday.
                </p>
                <p className="mt-3 text-xs leading-5 text-blue-200">
                  In a four-week month, 144 completed regular classes at ₹175 each equals ₹25,200. Paid demos, conversion incentives and any ₹200 extended-hours classes are additional.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4 lg:grid-cols-2">
                {[
                  ['6', 'classes / day'],
                  ['3.5 hrs', 'live teaching / day'],
                  ['6 days', 'Monday–Saturday'],
                  ['≈144', 'regular classes / 4 weeks'],
                ].map(([value, label]) => (
                  <div key={label} className="bg-white/5 p-5 transition hover:bg-white/10 md:p-6">
                    <div className="text-2xl font-black text-white">{value}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-200">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">
            Rates are in INR and describe the completed 2026 recruitment cycle. The ₹25,000+ example assumes six completed regular classes per day across six teaching days per week for four weeks; actual earnings depend on assigned and completed classes.
          </p>
        </div>
      </section>

      <section id="role" className="scroll-mt-24 px-5 py-10 md:px-6 md:py-12">
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

          <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-cyan-50/60 to-white p-6 shadow-sm md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">How selected teachers were supported</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">Teaching schedule support in the previous cycle</h3>
                <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
                  During the completed 2026 recruitment cycle, selected teachers received structured training, demo preparation and support with learner matching based on confirmed availability. The former scheduling target was 1–2 weeks, but placement was not guaranteed. These details do not represent an active vacancy.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Training', 'Structured preparation'],
                    ['Paid demos', 'Opportunities to get started'],
                    ['1–2 weeks', 'Active schedule building'],
                  ].map(([title, detail]) => (
                    <div key={title} className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
                      <div className="font-black text-slate-950">{title}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 px-5 py-10 text-white md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Selection process</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">How our teacher selection process works</h2>
            <p className="mt-3 text-lg leading-8 text-slate-300">For reference, this is how our completed 2026 recruitment cycle worked. Applications are currently closed.</p>
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

      <section id="apply" aria-labelledby="careers-closed-title" className="scroll-mt-20 bg-gradient-to-br from-blue-50 via-white to-orange-50 px-5 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white px-7 py-10 text-center shadow-xl shadow-slate-200/60 md:px-12 md:py-14">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-blue-700">Teacher recruitment update</p>
          <h2 id="careers-closed-title" className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Teaching positions filled — applications closed
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-700">
            All teaching positions for the current recruitment cycle have been filled. Applications closed on 11 October 2026, and we are not accepting new teacher applications at this time.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Thank you to everyone who expressed interest in Tiny Steps Learning. If recruitment resumes, new vacancies will be announced here. Please do not send CVs or applications via WhatsApp for this closed cycle.
          </p>
          <Button asChild variant="outline" className="mt-7 rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50">
            <Link to="/team">
              Meet our team
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-10 md:px-6 md:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Teacher careers FAQ</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Questions about teaching at Tiny Steps</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">
              Information about our previous teacher recruitment cycle. Applications are currently closed.
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

      <section className="px-5 py-10 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-7 text-white shadow-xl md:p-9">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300">Explore our academic approach</p>
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
                <Gift className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-cyan-800">Looking for English classes instead?</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Parents and learners can explore our programs here</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Teacher recruitment is closed. If you are searching for phonics, grammar, spoken English or public speaking classes for a child, explore our learner programs instead.
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
