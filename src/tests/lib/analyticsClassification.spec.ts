import { describe, expect, it } from 'vitest';
import {
  classifyMarketingPath,
  getProductAnalyticsContext,
  inferProductUserRole,
  normalizeAnalyticsPath,
} from '../../lib/analyticsClassification';

describe('analyticsClassification', () => {
  it('classifies core commercial routes', () => {
    expect(classifyMarketingPath('/phonics')).toMatchObject({
      audience_type: 'commercial_visitor',
      commercial_intent: 'high',
      page_cluster: 'authority',
      program: 'phonics',
    });

    expect(classifyMarketingPath('/pricing')).toMatchObject({
      audience_type: 'commercial_visitor',
      visitor_stage: 'decision',
      page_cluster: 'money',
    });
  });

  it('separates discovery and free-resource traffic', () => {
    expect(classifyMarketingPath('/blog/satpin-phonics-guide')).toMatchObject({
      audience_type: 'regular_visitor',
      page_cluster: 'blog',
      visitor_stage: 'discovery',
      program: 'phonics',
    });

    expect(classifyMarketingPath('/free-letter-tracing-game-for-kids')).toMatchObject({
      audience_type: 'free_resource_visitor',
      page_cluster: 'free_resource',
      commercial_intent: 'low',
    });
  });

  it('keeps recruitment out of the parent acquisition funnel', () => {
    expect(classifyMarketingPath('/careers')).toMatchObject({
      audience_type: 'recruitment_visitor',
      visitor_stage: 'recruitment',
      commercial_intent: 'none',
    });
  });

  it('recognizes product users by route without putting them in public marketing', () => {
    expect(inferProductUserRole('/parent/dashboard')).toBe('parent');
    expect(inferProductUserRole('/teacher/students/123')).toBe('teacher');
    expect(inferProductUserRole('/surya')).toBe('staff_admin');
    expect(inferProductUserRole('/kids/home')).toBe('learner');
    expect(getProductAnalyticsContext('/parent/dashboard')).toEqual({
      analytics_scope: 'product_app',
      user_role: 'parent',
    });
  });

  it('normalizes query strings and trailing slashes', () => {
    expect(normalizeAnalyticsPath('/Phonics/?utm_source=test')).toBe('/phonics');
  });
});
