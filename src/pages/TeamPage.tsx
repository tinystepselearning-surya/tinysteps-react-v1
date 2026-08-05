import { useEffect } from 'react';
import { applySeo, getRouteConfig } from '../lib/seo';
import {
  FOUNDER_ID,
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
          image: `${SITE_ORIGIN}/priya-founder-tiny-steps-learning.webp`,
          worksFor: { '@id': ORGANIZATION_ID, name: PUBLIC_FACTS.brandName },
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
      <AcademicSystemSection />
      <TeacherDevelopmentSection />
      <QualitySystemSection />
      <TeachingCommunitySection />
      <SchoolPartnershipSection />
      <FinalAssessmentSection />
      <TeamFaqSection />
    </div>
  );
}
