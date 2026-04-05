// @ts-nocheck
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../lib/analytics';

export default function AnalyticsTracker() {
  const location = useLocation();
  const pagePath = `${location.pathname}${location.search}`;

  useEffect(() => {
    trackPageView(pagePath);
  }, [pagePath]);

  return null;
}

