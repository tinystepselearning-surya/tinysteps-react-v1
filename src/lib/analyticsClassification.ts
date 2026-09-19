export type MarketingAudienceType =
  | 'commercial_visitor'
  | 'regular_visitor'
  | 'free_resource_visitor'
  | 'recruitment_visitor'
  | 'utility_visitor';

export type MarketingVisitorStage =
  | 'decision'
  | 'consideration'
  | 'discovery'
  | 'engagement'
  | 'recruitment'
  | 'utility';

export type CommercialIntent = 'high' | 'medium' | 'low' | 'none';

export type AnalyticsProgram =
  | 'phonics'
  | 'grammar'
  | 'speaking'
  | 'reading'
  | 'english'
  | 'summer_camp'
  | 'general';

export type MarketingPageCluster =
  | 'authority'
  | 'money'
  | 'age'
  | 'problem'
  | 'program'
  | 'seasonal'
  | 'trust'
  | 'blog'
  | 'resource_hub'
  | 'parent_resource'
  | 'free_resource'
  | 'recruitment'
  | 'utility'
  | 'general';

export type ProductUserRole =
  | 'parent'
  | 'teacher'
  | 'learner'
  | 'staff_admin'
  | 'learning_partner'
  | 'authenticated_user'
  | 'authentication';

export type MarketingAnalyticsContext = {
  analytics_scope: 'marketing_public';
  audience_type: MarketingAudienceType;
  visitor_stage: MarketingVisitorStage;
  commercial_intent: CommercialIntent;
  page_cluster: MarketingPageCluster;
  program: AnalyticsProgram;
};

export type ProductAnalyticsContext = {
  analytics_scope: 'product_app';
  user_role: ProductUserRole;
};

const HIGH_INTENT_CLUSTERS: Record<string, MarketingPageCluster> = {
  '/phonics': 'authority',
  '/grammar': 'authority',
  '/speaking': 'authority',
  '/pricing': 'money',
  '/book-demo': 'money',
  '/contact': 'money',
  '/reading-classes-for-kids': 'money',
  '/spoken-english-classes-for-kids-online': 'money',
  '/writing-classes-for-kids': 'money',
  '/phonics-fees-india': 'money',
  '/best-online-phonics-classes-for-kids-in-india': 'money',
  '/online-english-classes-for-kids': 'money',
  '/online-english-classes-hyderabad': 'money',
  '/english-grammar-writing-classes': 'money',
  '/english-classes-for-4-year-old': 'age',
  '/english-classes-for-5-year-old': 'age',
  '/english-classes-for-6-year-old': 'age',
  '/english-classes-for-7-10-year-old': 'age',
  '/child-not-reading-properly': 'problem',
  '/slow-reader-child-help': 'problem',
  '/shy-child-speaking-confidence': 'problem',
  '/reading-fluency-program': 'program',
  '/confidence-building-program-kids': 'program',
  '/english-foundation-program': 'program',
  '/for-schools': 'program',
  '/learning-partner': 'program',
  '/summer-camps': 'seasonal',
  '/summer-camp-for-kids-india': 'seasonal',
  '/summer-reading-program-kids': 'seasonal',
  '/summer-speaking-camp-kids': 'seasonal',
};

const TRUST_PATHS = new Set([
  '/',
  '/courses',
  '/curriculum',
  '/class-samples',
  '/testimonials',
  '/why-tiny-steps',
  '/faq',
  '/team',
  '/team/vannala-ravali-priya',
]);

const FREE_RESOURCE_EXACT_PATHS = new Set([
  '/phonics-learning-games',
  '/letter-tracing-with-sounds-game',
  '/phonics-games-for-preschoolers',
]);

const PRODUCT_PREFIX_ROLES: Array<[string, ProductUserRole]> = [
  ['/teacher', 'teacher'],
  ['/parent', 'parent'],
  ['/kids', 'learner'],
  ['/kid', 'learner'],
  ['/admin', 'staff_admin'],
  ['/surya', 'staff_admin'],
  ['/learning-partner/dashboard', 'learning_partner'],
  ['/messages', 'authenticated_user'],
];

export function normalizeAnalyticsPath(pathname: string): string {
  const withoutQuery = String(pathname || '/').split(/[?#]/, 1)[0] || '/';
  const lowered = withoutQuery.toLowerCase();
  if (lowered === '/') return '/';
  return lowered.replace(/\/+$/, '') || '/';
}

export function inferAnalyticsProgram(pathname: string): AnalyticsProgram {
  const path = normalizeAnalyticsPath(pathname);
  if (path.includes('phonics')) return 'phonics';
  if (path.includes('grammar')) return 'grammar';
  if (path.includes('speaking') || path.includes('confidence')) return 'speaking';
  if (path.includes('reading')) return 'reading';
  if (path.includes('english') || path.includes('writing')) return 'english';
  if (path.includes('summer')) return 'summer_camp';
  return 'general';
}

function isFreeResourcePath(path: string): boolean {
  return (
    path.startsWith('/free-') ||
    path.startsWith('/free-games/') ||
    FREE_RESOURCE_EXACT_PATHS.has(path)
  );
}

export function classifyMarketingPath(pathname: string): MarketingAnalyticsContext {
  const path = normalizeAnalyticsPath(pathname);
  const program = inferAnalyticsProgram(path);

  if (path === '/careers') {
    return {
      analytics_scope: 'marketing_public',
      audience_type: 'recruitment_visitor',
      visitor_stage: 'recruitment',
      commercial_intent: 'none',
      page_cluster: 'recruitment',
      program: 'general',
    };
  }

  if (isFreeResourcePath(path)) {
    return {
      analytics_scope: 'marketing_public',
      audience_type: 'free_resource_visitor',
      visitor_stage: 'engagement',
      commercial_intent: 'low',
      page_cluster: 'free_resource',
      program,
    };
  }

  if (path === '/resources' || path.startsWith('/resources/')) {
    return {
      analytics_scope: 'marketing_public',
      audience_type: 'regular_visitor',
      visitor_stage: 'discovery',
      commercial_intent: 'low',
      page_cluster: 'resource_hub',
      program,
    };
  }

  if (path === '/blog' || path.startsWith('/blog/')) {
    return {
      analytics_scope: 'marketing_public',
      audience_type: 'regular_visitor',
      visitor_stage: 'discovery',
      commercial_intent: 'low',
      page_cluster: 'blog',
      program,
    };
  }

  if (path === '/parents' || path.startsWith('/parents/')) {
    return {
      analytics_scope: 'marketing_public',
      audience_type: 'regular_visitor',
      visitor_stage: 'consideration',
      commercial_intent: 'medium',
      page_cluster: 'parent_resource',
      program,
    };
  }

  const mappedHighIntentCluster = HIGH_INTENT_CLUSTERS[path];
  if (mappedHighIntentCluster) {
    const decisionStage = mappedHighIntentCluster === 'money';
    return {
      analytics_scope: 'marketing_public',
      audience_type: 'commercial_visitor',
      visitor_stage: decisionStage ? 'decision' : 'consideration',
      commercial_intent: 'high',
      page_cluster: mappedHighIntentCluster,
      program,
    };
  }

  if (path.startsWith('/courses/') || path.startsWith('/summer-camps/')) {
    return {
      analytics_scope: 'marketing_public',
      audience_type: 'commercial_visitor',
      visitor_stage: 'consideration',
      commercial_intent: 'high',
      page_cluster: path.startsWith('/summer-camps/') ? 'seasonal' : 'program',
      program,
    };
  }

  if (TRUST_PATHS.has(path)) {
    return {
      analytics_scope: 'marketing_public',
      audience_type: 'regular_visitor',
      visitor_stage: 'consideration',
      commercial_intent: 'medium',
      page_cluster: 'trust',
      program,
    };
  }

  if (
    path === '/privacy-policy' ||
    path === '/terms-and-conditions' ||
    path === '/refund-guarantee' ||
    path === '/sitemap'
  ) {
    return {
      analytics_scope: 'marketing_public',
      audience_type: 'utility_visitor',
      visitor_stage: 'utility',
      commercial_intent: 'none',
      page_cluster: 'utility',
      program: 'general',
    };
  }

  return {
    analytics_scope: 'marketing_public',
    audience_type: 'regular_visitor',
    visitor_stage: 'discovery',
    commercial_intent: 'low',
    page_cluster: 'general',
    program,
  };
}

export function inferProductUserRole(pathname: string): ProductUserRole | null {
  const path = normalizeAnalyticsPath(pathname);
  for (const [prefix, role] of PRODUCT_PREFIX_ROLES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return role;
  }
  if (path === '/login' || path.endsWith('/login')) return 'authentication';
  return null;
}

export function isProductAnalyticsPath(pathname: string): boolean {
  return inferProductUserRole(pathname) !== null;
}

export function getProductAnalyticsContext(pathname: string): ProductAnalyticsContext | null {
  const userRole = inferProductUserRole(pathname);
  if (!userRole) return null;
  return {
    analytics_scope: 'product_app',
    user_role: userRole,
  };
}
