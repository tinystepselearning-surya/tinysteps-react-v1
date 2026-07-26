import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export const openExternalHttpsUrl = async (rawUrl: unknown): Promise<boolean> => {
  if (typeof rawUrl !== 'string') return false;
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url: url.toString() });
      return true;
    } catch {
      // Fall back to the normal browser flow when the native intent fails.
    }
  }
  const opened = window.open(url.toString(), '_blank', 'noopener,noreferrer');
  return opened !== null;
};
