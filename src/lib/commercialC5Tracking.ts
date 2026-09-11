import { trackEvent } from './analytics';
import {
  captureLeadAttribution,
  normalizePath,
  sanitizeLabel,
} from './conversionTracking';
import {
  getCommercialC5OwnerFlow,
  resolveCommercialC5Decision,
} from './commercialC5ConversionFlow';

function attributionEventParams(pagePath: string) {
  const attribution = captureLeadAttribution(pagePath);
  if (!attribution) return {};

  return {
    landing_page: attribution.landingPage,
    lead_utm_source: attribution.utmSource,
    lead_utm_medium: attribution.utmMedium,
    lead_utm_campaign: attribution.utmCampaign,
    lead_referrer_domain: attribution.referrerDomain,
  };
}

export function trackCommercialC5OwnerView(params: {
  page_path: string;
  page_title?: string;
  source_context?: string;
}): boolean {
  const pagePath = normalizePath(params.page_path);
  const flow = getCommercialC5OwnerFlow(pagePath);
  if (!flow) return false;

  trackEvent('commercial_owner_view', {
    page_path: pagePath,
    page_title: params.page_title || (typeof document !== 'undefined' ? document.title : ''),
    owner_stage: flow.stage,
    owner_priority: flow.priority,
    owner_roles: flow.ownerRoles.join(','),
    owner_cluster_ids: flow.clusterIds.join(','),
    primary_action_kind: flow.primaryAction.kind,
    primary_destination: flow.primaryAction.destinationPath || 'assessment-form',
    source_context: params.source_context || 'commercial_c5',
    ...attributionEventParams(pagePath),
  });

  return true;
}

export function trackCommercialC5DecisionClick(params: {
  page_path: string;
  cta_label: string;
  cta_location: string;
  destination_path?: string;
  href?: string;
  source_context?: string;
}): boolean {
  const pagePath = normalizePath(params.page_path);
  const flow = getCommercialC5OwnerFlow(pagePath);
  if (!flow) return false;

  const decision = resolveCommercialC5Decision({
    fromPath: pagePath,
    destinationPath: params.destination_path,
    href: params.href,
    label: params.cta_label,
    ctaLocation: params.cta_location,
  });
  if (!decision) return false;

  trackEvent('commercial_decision_click', {
    page_path: pagePath,
    owner_stage: flow.stage,
    owner_priority: flow.priority,
    owner_roles: flow.ownerRoles.join(','),
    owner_cluster_ids: flow.clusterIds.join(','),
    cta_label: sanitizeLabel(params.cta_label),
    cta_location: params.cta_location,
    destination_path: decision.destinationPath || undefined,
    decision_kind: decision.kind,
    decision_alignment: decision.alignment,
    primary_destination: flow.primaryAction.destinationPath || 'assessment-form',
    source_context: params.source_context || 'commercial_c5',
    ...attributionEventParams(pagePath),
  });

  return true;
}
