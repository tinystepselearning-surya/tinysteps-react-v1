import { trackEvent } from './analytics';
import {
  PHONICS_RESOURCE_DISCOVERY_EDGES,
  PHONICS_RESOURCE_HUB_PATH,
  getPhonicsResourceDiscoveryClusterForPath,
} from './phonicsResourceDiscoveryGraph.js';
import { getPhonicsProgrammaticPilotPageByPath } from './phonicsProgrammaticPilot.js';

export const RESOURCE_MEASUREMENT_REVISION = '2026-09-09-r11';
export const PHONICS_RESOURCE_PREFIX = '/resources/phonics';

export type ResourceSurface = 'phonics_hub' | 'phonics_guide';
export type ResourceNavigationRelation =
  | 'hub-child'
  | 'parent-hub'
  | 'cluster-sibling'
  | 'adjacent-pattern'
  | 'other-resource';
export type ResourceAssistType = 'practice' | 'commercial' | 'supporting-content';
export type ResourceExternalAssistChannel = 'whatsapp' | 'phone' | 'email';

export type ResourceMeasurementContext = {
  surface: ResourceSurface;
  subject: 'phonics';
  pagePath: string;
  clusterId?: string;
  clusterLabel?: string;
  conceptId?: string;
  publicationRevision?: string;
};

export function normalizeResourcePath(rawPath: string): string {
  const withoutHash = String(rawPath || '/').split('#', 1)[0];
  const withoutQuery = withoutHash.split('?', 1)[0];
  const normalized = withoutQuery.toLowerCase().replace(/\/+$/, '');
  return normalized || '/';
}

export function isPhonicsResourcePath(pathname: string): boolean {
  const path = normalizeResourcePath(pathname);
  return path === PHONICS_RESOURCE_HUB_PATH || path.startsWith(`${PHONICS_RESOURCE_PREFIX}/`);
}

export function getResourceMeasurementContext(pathname: string): ResourceMeasurementContext | null {
  const path = normalizeResourcePath(pathname);
  if (path === PHONICS_RESOURCE_HUB_PATH) {
    return { surface: 'phonics_hub', subject: 'phonics', pagePath: path };
  }

  const page = getPhonicsProgrammaticPilotPageByPath(path);
  if (!page) return null;
  const cluster = getPhonicsResourceDiscoveryClusterForPath(path);
  return {
    surface: 'phonics_guide',
    subject: 'phonics',
    pagePath: path,
    clusterId: cluster?.id,
    clusterLabel: cluster?.label,
    conceptId: page.conceptId,
    publicationRevision: page.publicationRevision,
  };
}

export function getResourceNavigationRelation(
  fromPath: string,
  toPath: string,
): ResourceNavigationRelation {
  const from = normalizeResourcePath(fromPath);
  const to = normalizeResourcePath(toPath);
  const edge = PHONICS_RESOURCE_DISCOVERY_EDGES.find(
    (candidate) => candidate.from === from && candidate.to === to,
  );
  return edge?.relation ?? 'other-resource';
}

function sanitizeLabel(label?: string) {
  return label?.replace(/\s+/g, ' ').trim().slice(0, 120);
}

function baseParams(context: ResourceMeasurementContext) {
  return {
    resource_revision: RESOURCE_MEASUREMENT_REVISION,
    resource_subject: context.subject,
    resource_surface: context.surface,
    resource_cluster: context.clusterId,
    resource_cluster_label: context.clusterLabel,
    resource_concept_id: context.conceptId,
    publication_revision: context.publicationRevision,
    page_path: context.pagePath,
  };
}

export function trackResourcePageView(pathname: string) {
  const context = getResourceMeasurementContext(pathname);
  if (!context) return;
  trackEvent('resource_page_view', baseParams(context));
}

export function trackResourceNavigationClick(fromPath: string, toPath: string, label?: string) {
  const context = getResourceMeasurementContext(fromPath);
  const destination = normalizeResourcePath(toPath);
  if (!context || !isPhonicsResourcePath(destination) || destination === context.pagePath) return;
  trackEvent('resource_navigation_click', {
    ...baseParams(context),
    destination_path: destination,
    navigation_relation: getResourceNavigationRelation(context.pagePath, destination),
    link_label: sanitizeLabel(label),
  });
}

export function classifyResourceAssistDestination(destinationPath: string): ResourceAssistType | null {
  const path = normalizeResourcePath(destinationPath);
  if (path === '/book-demo' || path === '/contact' || path === '/pricing' || path === '/phonics') {
    return 'commercial';
  }
  if (
    path.includes('/games/') ||
    path.includes('game') ||
    path.includes('tracing') ||
    path.includes('practice')
  ) {
    return 'practice';
  }
  if (path.startsWith('/blog/') || path.startsWith('/resources/')) return 'supporting-content';
  return null;
}

export function trackResourceAssistClick(fromPath: string, destinationPath: string, label?: string) {
  const context = getResourceMeasurementContext(fromPath);
  const destination = normalizeResourcePath(destinationPath);
  const assistType = classifyResourceAssistDestination(destination);
  if (!context || !assistType) return;
  trackEvent('resource_assist_click', {
    ...baseParams(context),
    destination_path: destination,
    assist_type: assistType,
    link_label: sanitizeLabel(label),
  });
}

export function trackResourceExternalAssist(
  fromPath: string,
  channel: ResourceExternalAssistChannel,
  label?: string,
) {
  const context = getResourceMeasurementContext(fromPath);
  if (!context) return;
  trackEvent('resource_assist_click', {
    ...baseParams(context),
    destination_path: `external:${channel}`,
    assist_type: 'commercial',
    assist_channel: channel,
    link_label: sanitizeLabel(label),
  });
}
