import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { founderPhotoSrc } from 'virtual:tiny-steps-team-photos';
import { TeamOfficialLinksSection } from './team/TeamOfficialLinksSection';
import { TeacherPortraitsSection } from './team/TeacherPortraitsSection';
import { TeachingAssuranceSection } from './team/TeachingAssuranceSection';
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
  SchoolPartnershipSection,
  TeamFaqSection,
  TeamHero,
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
      ogImage: founderPhotoSrc,
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
          image: `${SITE_ORIGIN}${founderPhotoSrc}`,
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
    <div className="overflow-x-clip bg-[#F6FBFF] text-slate-950">
      <TeamHero />
      <FounderSection />
      <div className="border-b border-[#f0e9dd] bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-sm leading-6 text-slate-600">
            Read more about Priya&apos;s academic leadership and learning philosophy.
          </p>
          <Link to={FOUNDER_PROFILE_PATH} className="inline-flex min-h-9 items-center text-sm font-semibold text-[#8b3917] underline underline-offset-4 hover:text-[#10243e]">
            Vannala Ravali Priya — Founder
          </Link>
        </div>
      </div>
      <TeacherPortraitsSection />
      <TeachingAssuranceSection />
      <AcademicSystemSection />
      <SchoolPartnershipSection />
      <FinalAssessmentSection />
      <TeamFaqSection />
      <TeamOfficialLinksSection />
    </div>
  );
}