/**
 * Centralized season state management for Tiny Steps campaigns
 * Purpose: Prevent scattering date checks throughout components;
 * ensure consistent behavior across schemas, forms, CTAs, and SEO
 */

export type SeasonStatus = 'upcoming' | 'open' | 'ended' | 'archived';

export interface SeasonConfig {
  name: string;
  status: SeasonStatus;
  startDate: Date;
  endDate: Date;
  enrollmentOpenDate?: Date;
  enrollmentCloseDate?: Date;
  description: string;
  /** Whether to publish InStock availability for this season */
  publishInStock: boolean;
  /** Whether to show active enrollment CTAs */
  showEnrollmentCTA: boolean;
  /** Whether to show the season on main routes */
  includeInActiveMarketing: boolean;
}

/**
 * Summer Camp 2026 season configuration
 * Status changed to 'archived' on 13 June 2026 (season end date)
 */
export const SUMMER_CAMP_2026_CONFIG: SeasonConfig = {
  name: 'Summer Camp 2026',
  status: 'archived',
  startDate: new Date('2026-04-27'),
  endDate: new Date('2026-06-13'),
  enrollmentOpenDate: new Date('2026-03-15'),
  enrollmentCloseDate: new Date('2026-06-13'),
  description: 'Tiny Steps Summer Camp 2026 is now archived. The 2026 season ran from 27 April to 13 June 2026.',
  publishInStock: false,
  showEnrollmentCTA: false,
  includeInActiveMarketing: false,
};

/**
 * Helper to check if a season is currently active or in a state that allows enrollment
 */
export function canShowEnrollment(config: SeasonConfig): boolean {
  return config.status === 'open' && config.showEnrollmentCTA;
}

/**
 * Helper to check if a season should publish availability as InStock
 */
export function shouldPublishInStock(config: SeasonConfig): boolean {
  return config.publishInStock && (config.status === 'upcoming' || config.status === 'open');
}

/**
 * Helper to get enrollment CTA text based on season status
 */
export function getEnrollmentCTAText(config: SeasonConfig): string {
  switch (config.status) {
    case 'upcoming':
      return `Register interest for ${config.name}`;
    case 'open':
      return `Enroll in ${config.name}`;
    case 'ended':
      return `${config.name} has ended`;
    case 'archived':
      return `Register interest for the next Summer Camp`;
    default:
      return 'Learn more';
  }
}

/**
 * Helper to get next-step CTA for expired seasons
 */
export function getNextStepCTA(config: SeasonConfig): string | null {
  if (config.status === 'archived' || config.status === 'ended') {
    return 'Book a regular English assessment';
  }
  return null;
}

/**
 * Helper to determine Event schema eventStatus
 * Reference: https://schema.org/EventStatusType
 * 
 * IMPORTANT: Do not use EventCancelled for completed events.
 * The 2026 season ended successfully on 13 June 2026 - it was not cancelled.
 * Use EventScheduled for events that occurred as planned, even if they ended.
 */
export function getEventStatusType(config: SeasonConfig): 'EventScheduled' | 'EventCancelled' | 'EventPostponed' | 'EventRescheduled' | 'EventMovedOnline' {
  // For archived/ended seasons that completed as scheduled, use EventScheduled
  // Only use EventCancelled if the season was actually cancelled (policy change, COVID, etc.)
  if (config.status === 'archived' || config.status === 'ended') {
    return 'EventScheduled';
  }
  return 'EventScheduled';
}
