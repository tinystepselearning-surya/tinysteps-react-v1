/**
 * Fullscreen Utility
 * 
 * Cross-browser fullscreen API with Safari support and event handling.
 */

type FullscreenChangeCallback = (isFullscreen: boolean) => void;

/**
 * Request fullscreen on an element (defaults to document.documentElement)
 */
export async function requestFullscreen(element?: HTMLElement): Promise<boolean> {
  const el = element || document.documentElement;
  
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    } else if ((el as any).webkitRequestFullscreen) {
      // Safari
      await (el as any).webkitRequestFullscreen();
      return true;
    } else if ((el as any).mozRequestFullScreen) {
      // Firefox
      await (el as any).mozRequestFullScreen();
      return true;
    } else if ((el as any).msRequestFullscreen) {
      // IE/Edge
      await (el as any).msRequestFullscreen();
      return true;
    }
    
    console.warn('[Fullscreen] API not supported');
    return false;
  } catch (error) {
    console.error('[Fullscreen] Request failed:', error);
    return false;
  }
}

/**
 * Exit fullscreen
 */
export async function exitFullscreen(): Promise<boolean> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return true;
    } else if ((document as any).webkitExitFullscreen) {
      // Safari
      await (document as any).webkitExitFullscreen();
      return true;
    } else if ((document as any).mozCancelFullScreen) {
      // Firefox
      await (document as any).mozCancelFullScreen();
      return true;
    } else if ((document as any).msExitFullscreen) {
      // IE/Edge
      await (document as any).msExitFullscreen();
      return true;
    }
    
    console.warn('[Fullscreen] Exit API not supported');
    return false;
  } catch (error) {
    console.error('[Fullscreen] Exit failed:', error);
    return false;
  }
}

/**
 * Check if currently in fullscreen mode
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * Get the current fullscreen element
 */
export function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  );
}

/**
 * Subscribe to fullscreen change events
 * Returns an unsubscribe function
 */
export function onChange(callback: FullscreenChangeCallback): () => void {
  const handler = () => {
    callback(isFullscreen());
  };

  // Add all vendor-prefixed event listeners
  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('mozfullscreenchange', handler);
  document.addEventListener('MSFullscreenChange', handler);

  // Return cleanup function
  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('MSFullscreenChange', handler);
  };
}

/**
 * Toggle fullscreen on/off
 */
export async function toggleFullscreen(element?: HTMLElement): Promise<boolean> {
  if (isFullscreen()) {
    return await exitFullscreen();
  } else {
    return await requestFullscreen(element);
  }
}
