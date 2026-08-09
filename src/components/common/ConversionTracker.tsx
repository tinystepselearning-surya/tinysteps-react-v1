import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildBaseConversionParams,
  captureLeadAttribution,
  extractDestinationPathFromHref,
  inferProgramFromPath,
  isBookDemoDestination,
  isBookDemoLabel,
  isFreeResourcePath,
  isFunnelLandingPath,
  isHighIntentCtaLabel,
  isHighIntentPath,
  isMarketingPath,
  isProgramPagePath,
  isWhatsAppDestination,
  sanitizeLabel,
  trackBookDemoClick,
  trackCtaClick,
  trackConversionEvent,
  trackEmailClick,
  trackFreeResourceToTrialClick,
  trackLandingPageView,
  trackPhoneClick,
  trackPricingCtaClick,
  trackProgramCtaClick,
  trackWhatsappClick,
} from '../../lib/conversionTracking';
import { captureLeadAttribution as capturePublicLeadAttribution } from '../../lib/leadAttribution';

function getCtaLabelFromElement(element: HTMLElement): string {
  const explicit = element.getAttribute('data-cta-label') || element.getAttribute('aria-label') || element.getAttribute('title');
  if (explicit) return sanitizeLabel(explicit);

  const text = element.textContent || '';
  return sanitizeLabel(text);
}

function findTrackableNode(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest('a,button');
}

function inferCtaLocation(node: HTMLElement): string {
  const explicit = node.getAttribute('data-cta-location');
  if (explicit) return sanitizeLabel(explicit).toLowerCase();
  if (node.closest('header')) return 'header';
  if (node.closest('footer')) return 'footer';
  if (node.closest('form')) return 'form';
  if (node.closest('.sticky')) return 'sticky';
  return 'card';
}

export default function ConversionTracker() {
  const location = useLocation();
  const lastTrackedLandingPathRef = useRef<string>('');

  useEffect(() => {
    const pagePath = location.pathname;
    if (!isMarketingPath(pagePath)) return;

    // Keep GA4's existing attribution contract and the Firestore lead attribution
    // contract in sync from the visitor's first marketing-page arrival.
    captureLeadAttribution(pagePath);
    capturePublicLeadAttribution();

    if (isFunnelLandingPath(pagePath) && lastTrackedLandingPathRef.current !== pagePath) {
      trackLandingPageView({
        page_path: pagePath,
        page_title: typeof document !== 'undefined' ? document.title : '',
        funnel_name: 'website_lead_funnel',
        program: inferProgramFromPath(pagePath),
        source_context: 'conversion_tracker',
      });
      lastTrackedLandingPathRef.current = pagePath;
    }

    const clickHandler = (event: MouseEvent) => {
      const node = findTrackableNode(event.target);
      if (!node) return;
      if (node.closest('[data-floating-assistant="1"]')) return;

      const label = getCtaLabelFromElement(node);
      if (!label) return;

      const href = node instanceof HTMLAnchorElement ? node.getAttribute('href') || undefined : undefined;
      const destinationPath = extractDestinationPathFromHref(href || '');
      const baseParams = buildBaseConversionParams(pagePath);
      const ctaLocation = inferCtaLocation(node);
      const isWhatsApp = isWhatsAppDestination(href) || label.toLowerCase().includes('whatsapp');
      const isBookDemo = isBookDemoDestination(destinationPath) || isBookDemoLabel(label);
      const isPhone = Boolean(href?.startsWith('tel:'));
      const isEmail = Boolean(href?.startsWith('mailto:'));
      const isLeadIntentCta =
        isWhatsApp ||
        isBookDemo ||
        isPhone ||
        isEmail ||
        destinationPath === '/contact' ||
        destinationPath === '/pricing';
      const isHighIntentFunnelCta = isHighIntentPath(pagePath) && destinationPath && isHighIntentCtaLabel(label);

      if (isWhatsApp || isBookDemo || isHighIntentFunnelCta) {
        trackCtaClick({
          page_path: pagePath,
          cta_label: label,
          cta_location: ctaLocation,
          destination_path: destinationPath,
          funnel_name: 'website_lead_funnel',
          program: inferProgramFromPath(pagePath),
        });
      }

      if (isProgramPagePath(pagePath) && isLeadIntentCta) {
        trackProgramCtaClick({
          page_path: pagePath,
          cta_label: label,
          cta_location: ctaLocation,
          destination_path: destinationPath,
          program: inferProgramFromPath(pagePath),
        });
      }

      if (pagePath === '/pricing' && isLeadIntentCta) {
        trackPricingCtaClick({
          page_path: pagePath,
          cta_label: label,
          cta_location: ctaLocation,
          destination_path: destinationPath,
          program: inferProgramFromPath(pagePath),
        });
      }

      if (isFreeResourcePath(pagePath) && (destinationPath === '/phonics' || destinationPath === '/book-demo' || destinationPath === '/contact')) {
        trackFreeResourceToTrialClick({
          page_path: pagePath,
          cta_label: label,
          cta_location: ctaLocation,
          destination_path: destinationPath,
          program: inferProgramFromPath(pagePath),
        });
      }

      if (isWhatsApp) {
        trackWhatsappClick(`${pagePath}:${label}`);
        return;
      }

      if (isPhone) {
        trackPhoneClick(`${pagePath}:${label}`);
        return;
      }

      if (isEmail) {
        trackEmailClick(`${pagePath}:${label}`);
        return;
      }

      if (isBookDemo && destinationPath) {
        trackBookDemoClick(`${pagePath}:${label}`);
        return;
      }

      if (isHighIntentPath(pagePath) && destinationPath && isHighIntentCtaLabel(label)) {
        trackConversionEvent('high_intent_page_cta_click', {
          ...baseParams,
          cta_label: label,
          destination_path: destinationPath,
        });
      }
    };

    document.addEventListener('click', clickHandler, true);
    return () => document.removeEventListener('click', clickHandler, true);
  }, [location.pathname]);

  return null;
}
