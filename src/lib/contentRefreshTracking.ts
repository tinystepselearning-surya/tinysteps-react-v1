/**
 * Content Freshness Tracking Utility
 * 
 * Helps monitor and manage content update schedules for SEO freshness
 * Useful for automated reminders and tracking refresh cycles
 */

export type ContentRefreshLevel = 'critical' | 'overdue' | 'upcoming' | 'current';

export interface ContentMetadata {
  slug: string;
  title: string;
  lastPublished: string;         // YYYY-MM-DD
  lastModified?: string;          // YYYY-MM-DD (date of last refresh)
  lastRefreshDate?: string;       // YYYY-MM-DD (comprehensive refresh)
  nextRefreshTarget?: string;     // YYYY-MM-DD (when to refresh next)
  refreshCycleMonths?: number;    // How often to refresh (default: 3)
  category?: string;              // blog, guide, faq, etc.
  viewsPerMonth?: number;         // Traffic indicator for priority
  refreshNotes?: string;          // What was updated last time
}

/**
 * Calculate if content needs refresh
 * @param metadata - Content metadata
 * @param refreshCycleMonths - How many months between refreshes (default: 3)
 * @returns Freshness level and days until refresh
 */
export function calculateFreshnessStatus(
  metadata: ContentMetadata,
  refreshCycleMonths: number = 3
): {
  status: ContentRefreshLevel;
  daysSinceLastRefresh: number;
  daysUntilNextRefresh: number;
  recommendedAction: string;
} {
  const lastRefresh = new Date(metadata.lastRefreshDate || metadata.lastModified || metadata.lastPublished);
  const today = new Date();
  
  const daysSinceLastRefresh = Math.floor(
    (today.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const refreshIntervalDays = refreshCycleMonths * 30;
  const daysUntilNextRefresh = Math.max(0, refreshIntervalDays - daysSinceLastRefresh);
  
  let status: ContentRefreshLevel;
  let recommendedAction: string;
  
  if (daysUntilNextRefresh <= 0) {
    status = 'critical';
    recommendedAction = `REFRESH IMMEDIATELY: Content last updated ${daysSinceLastRefresh} days ago`;
  } else if (daysUntilNextRefresh <= 14) {
    status = 'overdue';
    recommendedAction = `REFRESH SOON: Content refresh due in ${daysUntilNextRefresh} days`;
  } else if (daysUntilNextRefresh <= 30) {
    status = 'upcoming';
    recommendedAction = `SCHEDULE REFRESH: Plan refresh for next ${Math.ceil(daysUntilNextRefresh / 7)} weeks`;
  } else {
    status = 'current';
    recommendedAction = `Content is current. Next refresh due in ${Math.ceil(daysUntilNextRefresh / 30)} months`;
  }
  
  return {
    status,
    daysSinceLastRefresh,
    daysUntilNextRefresh,
    recommendedAction
  };
}

/**
 * Get refresh priority score (0-100)
 * Higher traffic = higher priority for refresh
 * Older content = higher priority
 */
export function getRefreshPriority(metadata: ContentMetadata): number {
  const freshnessStatus = calculateFreshnessStatus(metadata);
  
  let score = 0;
  
  // Factor 1: Days overdue (0-40 points)
  if (freshnessStatus.daysUntilNextRefresh <= 0) {
    score += 40;
  } else {
    score += Math.max(0, 40 * (1 - freshnessStatus.daysUntilNextRefresh / 90));
  }
  
  // Factor 2: Traffic importance (0-40 points)
  const viewsPerMonth = metadata.viewsPerMonth || 0;
  if (viewsPerMonth > 500) {
    score += 40;
  } else if (viewsPerMonth > 100) {
    score += 30;
  } else if (viewsPerMonth > 50) {
    score += 20;
  } else {
    score += 10;
  }
  
  // Factor 3: Content type (0-20 points)
  // Blog posts and guides are higher priority than FAQs
  if (metadata.category === 'blog' || metadata.category === 'guide') {
    score += 20;
  } else if (metadata.category === 'faq') {
    score += 10;
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Generate content refresh report for a period
 */
export function generateRefreshReport(
  contentList: ContentMetadata[],
  statusFilter?: ContentRefreshLevel
): {
  critical: ContentMetadata[];
  overdue: ContentMetadata[];
  upcoming: ContentMetadata[];
  current: ContentMetadata[];
  summary: string;
} {
  const grouped = {
    critical: [] as ContentMetadata[],
    overdue: [] as ContentMetadata[],
    upcoming: [] as ContentMetadata[],
    current: [] as ContentMetadata[]
  };
  
  contentList.forEach(content => {
    const { status } = calculateFreshnessStatus(content);
    grouped[status].push(content);
  });
  
  const total = contentList.length;
  const summary = `
Content Refresh Report
======================
Total content items: ${total}
🔴 Critical (refresh now): ${grouped.critical.length}
🟠 Overdue (refresh soon): ${grouped.overdue.length}
🟡 Upcoming (schedule refresh): ${grouped.upcoming.length}
🟢 Current: ${grouped.current.length}

Priority Actions:
1. Refresh ${grouped.critical.length} critical items immediately
2. Schedule ${grouped.overdue.length} overdue items for next week
3. Plan ${grouped.upcoming.length} upcoming refreshes in calendar
  `.trim();
  
  return {
    ...grouped,
    summary
  };
}

/**
 * Template for updating content metadata after refresh
 */
export const contentRefreshTemplate = {
  updateAfterRefresh: (content: ContentMetadata, refreshNotes: string): ContentMetadata => ({
    ...content,
    lastRefreshDate: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    refreshNotes: refreshNotes,
    nextRefreshTarget: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months from now
      .toISOString()
      .split('T')[0]
  })
};

/**
 * Example usage in blog.ts:
 * 
 * const phonicsPost: ContentMetadata = {
 *   slug: 'week-1-phonics-satpin-launch',
 *   title: 'Week 1: SATPIN Letter Sound Launch',
 *   lastPublished: '2024-01-15',
 *   lastModified: '2025-01-28',
 *   lastRefreshDate: '2025-01-28',
 *   nextRefreshTarget: '2025-04-28',
 *   refreshCycleMonths: 3,
 *   category: 'blog',
 *   viewsPerMonth: 450,
 *   refreshNotes: 'Updated with 2025 student success stories'
 * };
 * 
 * // Check refresh status
 * const status = calculateFreshnessStatus(phonicsPost);
 * console.log(status.recommendedAction);
 * 
 * // Get priority for refresh scheduling
 * const priority = getRefreshPriority(phonicsPost);
 * console.log(`Refresh priority: ${priority}/100`);
 */

export default {
  calculateFreshnessStatus,
  getRefreshPriority,
  generateRefreshReport,
  contentRefreshTemplate
};
