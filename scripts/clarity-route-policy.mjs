import { isPublicAnalyticsPath } from '../src/lib/publicRouteManifest.js';

export function isClarityAllowedPath(pathname) {
  return isPublicAnalyticsPath(pathname);
}
