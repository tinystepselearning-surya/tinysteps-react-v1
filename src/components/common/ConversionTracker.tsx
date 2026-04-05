import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildBaseConversionParams,
  extractDestinationPathFromHref,
  isBookDemoDestination,
  isBookDemoLabel,
  isHighIntentCtaLabel,
  isHighIntentPath,
  isMarketingPath,
  isWhatsAppDestination,
  sanitizeLabel,
  trackConversionEvent,
} from '../../lib/conversionTracking';

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

export default function ConversionTracker() {
  const location = useLocation();

  useEffect(() => {
    const pagePath = location.pathname;
    if (!isMarketingPath(pagePath)) return;

    const clickHandler = (event: MouseEvent) => {
      const node = findTrackableNode(event.target);
      if (!node) return;
      if (node.closest('[data-floating-assistant="1"]')) return;

      const label = getCtaLabelFromElement(node);
      if (!label) return;

      const href = node instanceof HTMLAnchorElement ? node.getAttribute('href') || undefined : undefined;
      const destinationPath = extractDestinationPathFromHref(href || '');
      const baseParams = buildBaseConversionParams(pagePath);

      if (isWhatsAppDestination(href) || label.toLowerCase().includes('whatsapp')) {
        trackConversionEvent('whatsapp_click', {
          ...baseParams,
          cta_label: label,
          destination_path: destinationPath || href || '',
        });
        return;
      }

      const isBookDemo = isBookDemoDestination(destinationPath) || isBookDemoLabel(label);
      if (isBookDemo && destinationPath) {
        trackConversionEvent('book_demo_click', {
          ...baseParams,
          cta_label: label,
          destination_path: destinationPath,
        });
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
