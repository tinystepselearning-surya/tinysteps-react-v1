import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OfficialProfilesSection } from '../components/entity/OfficialProfilesSection';
import { applySeo, getRouteConfig } from '../lib/seo';
import {
  FOUNDER_ID,
  FOUNDER_PROFILE_PATH,
  FOUNDER_PROFILE_URL,
  ORGANIZATION_ID,
  PUBLIC_FACTS,
  SITE_ORIGIN,
  createFAQPageSchema,
  organizationSchema,
} from '../lib/schemas';
import {
  AcademicSystemSection,
  FinalAssessmentSection,
  FounderSection,
  QualitySystemSection,
  ResearchToClassroomSection,
  SchoolPartnershipSection,
  TeacherDevelopmentSection,
  TeachingCommunitySection,
  TeamFaqSection,
  TeamHero,
  TrustMetrics,
} from './team/TeamPageSections';
import { teamFaqItems } from './team/teamPageContent';

const teamSeo = getRouteConfig('/team');
const teamSeoTitle = teamSeo?.title ?? 'Meet the Tiny Steps Learning Team | Founder-Led English Learning';
const teamSeoDescription =
  teamSeo?.description ??
  'Meet the founder-led academic team behind Tiny Steps Learning and discover how structured curriculum, trained teachers and continuous academic support help children build confident English skills.';
const teamCanonicalPath = teamSeo?.canonicalPath ?? '/team';

export default function TeamPage() {
  useEffect(() => {
    applySeo({
      title: teamSeoTitle,
      description: teamSeoDescription,
      canonicalPath: teamCanonicalPath,
      ogType: 'website',
      ogImage: '/priya-founder-tiny-steps-learning.webp',
      jsonLd: [
        organizationSchema,
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          '@id': `${SITE_ORIGIN}/team#webpage`,
          name: 'Meet the founder-led academic team at Tiny Steps Learning',
          description: teamSeoDescription,
          url: `${SITE_ORIGIN}/team`,
          inLanguage: 'en-IN',
          about: { '@id': ORGANIZATION_ID },
          mainEntity: { '@id': ORGANIZATION_ID },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Person',
          '@id': FOUNDER_ID,
          name: PUBLIC_FACTS.founder.fullName,
          givenName: PUBLIC_FACTS.founder.givenName,
          familyName: PUBLIC_FACTS.founder.familyName,
          alternateName: [...PUBLIC_FACTS.founder.alternateNames],
          jobTitle: 'Founder',
          url: FOUNDER_PROFILE_URL,
          mainEntityOfPage: { '@id': `${FOUNDER_PROFILE_URL}#webpage` },
          image: `${SITE_ORIGIN}/priya-founder-tiny-steps-learning.webp`,
          worksFor: { '@id': ORGANIZATION_ID, name: PUBLIC_FACTS.organizationName },
          description:
            'Founder of Tiny Steps Learning, leading academic direction across curriculum, lesson design, teacher guidance, teaching quality and parent communication.',
          knowsAbout: ['Phonics', 'Reading', 'Grammar', 'Writing', 'Sentence Formation', 'Public Speaking'],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Team', item: `${SITE_ORIGIN}/team` },
          ],
        },
        { ...createFAQPageSchema([...teamFaqItems]), '@id': `${SITE_ORIGIN}/team#faq` },
      ],
    });
  }, []);

  return (
    <div className="overflow-x-clip bg-[#fffdf9] text-slate-950">
      <TeamHero />
      <TrustMetrics />
      <FounderSection />
      <section
        aria-label="Founder profile"
        className="border-y border-orange-100 bg-[#fffaf3] px-4 py-5 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Founder profile</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              Read Priya&apos;s dedicated founder profile, academic leadership scope and learning principles.
            </p>
          </div>
          <Link
            to={FOUNDER_PROFILE_PATH}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:border-slate-500 hover:bg-slate-50"
          >
            Vannala Ravali Priya — Founder
          </Link>
        </div>
      </section>
      <OfficialProfilesSection />
      <AcademicSystemSection />
      <ResearchToClassroomSection />
      <TeacherDevelopmentSection />
      <QualitySystemSection />
      <TeachingCommunitySection />
      <SchoolPartnershipSection />
      <FinalAssessmentSection />
      <TeamFaqSection />
    </div>
  );
}
