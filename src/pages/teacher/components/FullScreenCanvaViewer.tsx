import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@components/ui/button';
import { X, Maximize, Minimize } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

type ViolationType =
  | 'RIGHT_CLICK'
  | 'PRINT'
  | 'SAVE'
  | 'VIEW_SOURCE'
  | 'DEVTOOLS'
  | 'CANVA_CONTROLS_BLOCKED'
  | 'COPY'
  | 'CUT'
  | 'SELECT'
  | 'DRAG'
  | 'TAB_HIDDEN'
  | 'WINDOW_BLUR';

interface FullScreenCanvaViewerProps {
  accessId: string;
  teacherId: string;
  teacherName: string;
  onClose: () => void;
  initialLessonTitle?: string;
}

const MAX_VIOLATIONS = 75;
const TOAST_THROTTLE_MS = 2000;

function normalizeCanvaEmbedUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '';
  const candidate = rawUrl.trim();
  if (!candidate) return '';

  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname.endsWith('canva.com')) return '';
    if (parsed.protocol !== 'https:') return '';

    parsed.searchParams.set('embed', '1');
    parsed.searchParams.set('ui', '0');
    return parsed.toString();
  } catch {
    return '';
  }
}

function timestampToMs(value: unknown): number {
  if (typeof value === 'object' && value !== null && typeof (value as any).toMillis === 'function') {
    const ms = Number((value as any).toMillis());
    return Number.isFinite(ms) ? ms : 0;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
}

export function FullScreenCanvaViewer({
  accessId,
  teacherId,
  teacherName,
  onClose,
  initialLessonTitle,
}: FullScreenCanvaViewerProps) {
  const [showWarning, setShowWarning] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [blockedActionCount, setBlockedActionCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsMessage, setShowControlsMessage] = useState(false);
  const [resolvedLessonTitle, setResolvedLessonTitle] = useState(initialLessonTitle || 'Lesson');
  const [resolvedCanvaEmbedUrl, setResolvedCanvaEmbedUrl] = useState('');
  const [expiresAtMs, setExpiresAtMs] = useState(0);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonLoadError, setLessonLoadError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const openedAtRef = useRef<number>(Date.now());
  const hasWrittenOpenLog = useRef(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const lastToastTimeRef = useRef<number>(0);
  const lastBlockedActionAtMsRef = useRef<number | null>(null);
  const blockedActionTypeCountsRef = useRef<Record<ViolationType, number>>({
    RIGHT_CLICK: 0,
    PRINT: 0,
    SAVE: 0,
    VIEW_SOURCE: 0,
    DEVTOOLS: 0,
    CANVA_CONTROLS_BLOCKED: 0,
    COPY: 0,
    CUT: 0,
    SELECT: 0,
    DRAG: 0,
    TAB_HIDDEN: 0,
    WINDOW_BLUR: 0,
  });

  const pushViolation = useCallback((type: ViolationType) => {
    lastBlockedActionAtMsRef.current = Date.now();
    blockedActionTypeCountsRef.current[type] = (blockedActionTypeCountsRef.current[type] || 0) + 1;
    setBlockedActionCount((prev) => Math.min(prev + 1, MAX_VIOLATIONS));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAccessSession() {
      setLessonLoading(true);
      setLessonLoadError(null);
      setSessionExpired(false);

      try {
        const accessRef = doc(db, 'lessonAccessSessions', accessId);
        const accessSnap = await getDoc(accessRef);

        if (!accessSnap.exists()) {
          throw new Error('Access session not found. Reopen the lesson from library.');
        }

        const data = accessSnap.data() as any;

        if (String(data?.teacherUid || '') !== teacherId) {
          throw new Error('This lesson access does not belong to your account.');
        }

        const status = String(data?.status || 'active');
        if (status === 'revoked') {
          throw new Error('This lesson access has been revoked by admin.');
        }

        const expiresMs = timestampToMs(data?.expiresAt);
        if (!expiresMs) {
          throw new Error('Lesson access is invalid. Reopen from library.');
        }

        const embedUrl = normalizeCanvaEmbedUrl(data?.canvaEmbedUrl || '');
        if (!embedUrl) {
          throw new Error('Lesson access has no valid Canva embed URL.');
        }

        const title = String(data?.lessonTitle || '').trim() || initialLessonTitle || 'Lesson';
        const expired = Date.now() >= expiresMs;

        if (!mounted) return;

        setResolvedLessonTitle(title);
        setResolvedCanvaEmbedUrl(embedUrl);
        setExpiresAtMs(expiresMs);
        setSessionExpired(expired || status === 'expired');
      } catch (error: any) {
        if (!mounted) return;
        setLessonLoadError(error?.message || 'Failed to load lesson access session.');
      } finally {
        if (mounted) {
          setLessonLoading(false);
        }
      }
    }

    loadAccessSession();
    return () => {
      mounted = false;
    };
  }, [accessId, initialLessonTitle, teacherId]);

  useEffect(() => {
    if (!expiresAtMs) return;

    const timer = window.setInterval(() => {
      if (Date.now() >= expiresAtMs) {
        setSessionExpired(true);
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [expiresAtMs]);

  useEffect(() => {
    if (hasWrittenOpenLog.current) return;
    hasWrittenOpenLog.current = true;

    const writeOpenLog = async () => {
      try {
        const auditRef = doc(db, 'lesson_view_audit', accessId);
        await setDoc(
          auditRef,
          {
            accessId,
            teacherId,
            teacherName,
            mode: 'full',
            openedAt: serverTimestamp(),
            blockedActionCount: 0,
            blockedActionTypes: blockedActionTypeCountsRef.current,
          },
          { merge: true }
        );
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to write open audit log:', error);
      }
    };

    writeOpenLog();
  }, [accessId, teacherId, teacherName]);

  const handleContinue = useCallback(async () => {
    if (!agreedToTerms) return;

    try {
      await setDoc(
        doc(db, 'lesson_view_audit', accessId),
        {
          policyAcceptedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[FullScreenCanvaViewer] Failed to log policy acceptance:', error);
    }

    setShowWarning(false);

    if (viewerRef.current && !sessionExpired && !lessonLoadError) {
      try {
        await viewerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to enter fullscreen:', error);
      }
    }
  }, [accessId, agreedToTerms, lessonLoadError, sessionExpired]);

  const handleClose = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // no-op
      }
    }

    const durationSec = Math.floor((Date.now() - openedAtRef.current) / 1000);

    try {
      await setDoc(
        doc(db, 'lesson_view_audit', accessId),
        {
          closedAt: serverTimestamp(),
          durationSec,
          blockedActionCount,
          blockedActionTypes: blockedActionTypeCountsRef.current,
          lastBlockedActionAtMs: lastBlockedActionAtMsRef.current,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[FullScreenCanvaViewer] Failed to write close audit log:', error);
    }

    onClose();
  }, [accessId, blockedActionCount, onClose]);

  const handleControlShieldClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      pushViolation('CANVA_CONTROLS_BLOCKED');

      const now = Date.now();
      if (now - lastToastTimeRef.current >= TOAST_THROTTLE_MS) {
        lastToastTimeRef.current = now;
        setShowControlsMessage(true);
        window.setTimeout(() => setShowControlsMessage(false), 2500);
      }
    },
    [pushViolation]
  );

  const handleEnterFullscreen = useCallback(async () => {
    if (viewerRef.current && !document.fullscreenElement) {
      try {
        await viewerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // no-op
      }
    }
  }, []);

  const handleExitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        // no-op
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const onContextMenu = (event: Event) => {
      event.preventDefault();
      pushViolation('RIGHT_CLICK');
    };
    const onCopy = (event: Event) => {
      event.preventDefault();
      pushViolation('COPY');
    };
    const onCut = (event: Event) => {
      event.preventDefault();
      pushViolation('CUT');
    };
    const onDragStart = (event: Event) => {
      event.preventDefault();
      pushViolation('DRAG');
    };
    const onSelectStart = (event: Event) => {
      event.preventDefault();
      pushViolation('SELECT');
    };

    const onBlur = () => {
      pushViolation('WINDOW_BLUR');
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        pushViolation('TAB_HIDDEN');
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const ctrl = event.ctrlKey || event.metaKey;
      let violationType: ViolationType | null = null;

      if (ctrl && event.key.toLowerCase() === 'p') violationType = 'PRINT';
      else if (ctrl && event.key.toLowerCase() === 's') violationType = 'SAVE';
      else if (ctrl && event.key.toLowerCase() === 'u') violationType = 'VIEW_SOURCE';
      else if (ctrl && event.shiftKey && event.key.toLowerCase() === 'i') violationType = 'DEVTOOLS';
      else if (event.key === 'F12') violationType = 'DEVTOOLS';

      if (!violationType) return;
      event.preventDefault();
      event.stopPropagation();
      pushViolation(violationType);
    };

    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('cut', onCut, true);
    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('selectstart', onSelectStart, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu, true);
      document.removeEventListener('copy', onCopy, true);
      document.removeEventListener('cut', onCut, true);
      document.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('selectstart', onSelectStart, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pushViolation]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      const durationSec = Math.floor((Date.now() - openedAtRef.current) / 1000);
      try {
        await setDoc(
          doc(db, 'lesson_view_audit', accessId),
          {
            closedAt: serverTimestamp(),
            durationSec,
            blockedActionCount,
            blockedActionTypes: blockedActionTypeCountsRef.current,
            lastBlockedActionAtMs: lastBlockedActionAtMsRef.current,
          },
          { merge: true }
        );
      } catch {
        // no-op
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [accessId, blockedActionCount]);

  const contentReady = !lessonLoading && !lessonLoadError && !sessionExpired && !!resolvedCanvaEmbedUrl;
  const remainingSeconds = expiresAtMs ? Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)) : 0;
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsRemainder = remainingSeconds % 60;

  return (
    <div ref={viewerRef} className="fixed inset-0 z-50 bg-white" style={{ userSelect: 'none' }}>
      {showWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Copyright Notice</h2>
            <p className="text-gray-700 mb-6">
              This lesson is proprietary TinySteps content. Downloading, recording, sharing, or
              redistributing this material is prohibited and audited.
            </p>
            <p className="text-sm font-semibold text-amber-700 mb-6">
              Open only during active class time. Access expires in 50 minutes.
            </p>
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I understand and agree to these terms.
              </span>
            </label>
            <Button onClick={handleContinue} disabled={!agreedToTerms} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      )}

      <div className="h-16 bg-gray-900 text-white flex items-center justify-between px-6 relative z-50">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-lg font-semibold truncate max-w-xl">{resolvedLessonTitle}</h1>
          <span className="text-sm text-gray-400">Secure Viewer</span>
          {!showWarning && !lessonLoadError && !sessionExpired && expiresAtMs ? (
            <span className="text-xs text-amber-300">
              Expires in {remainingMinutes}:{String(remainingSecondsRemainder).padStart(2, '0')}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!isFullscreen ? (
            <Button onClick={handleEnterFullscreen} variant="ghost" className="text-white hover:bg-gray-800">
              <Maximize className="w-5 h-5 mr-2" />
              Fullscreen
            </Button>
          ) : (
            <Button onClick={handleExitFullscreen} variant="ghost" className="text-white hover:bg-gray-800">
              <Minimize className="w-5 h-5 mr-2" />
              Exit
            </Button>
          )}
          <Button onClick={handleClose} variant="ghost" className="text-white hover:bg-gray-800">
            <X className="w-5 h-5 mr-2" />
            Close
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
        {showControlsMessage && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold">
            Restricted action blocked
          </div>
        )}

        {lessonLoadError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
            <div className="max-w-lg p-6 border rounded-lg bg-red-50 border-red-200">
              <h3 className="text-lg font-semibold text-red-700">Unable to open lesson</h3>
              <p className="text-sm text-red-600 mt-2">{lessonLoadError}</p>
            </div>
          </div>
        )}

        {sessionExpired && !lessonLoadError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
            <div className="max-w-lg p-6 border rounded-lg bg-amber-50 border-amber-200">
              <h3 className="text-lg font-semibold text-amber-700">Access expired</h3>
              <p className="text-sm text-amber-700 mt-2">
                Your 50-minute access window has ended. Reopen this lesson from Lesson Library.
              </p>
              <div className="mt-4">
                <Button onClick={handleClose}>Back to Lesson Library</Button>
              </div>
            </div>
          </div>
        )}

        {lessonLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
            <div className="text-sm text-gray-600">Loading secure lesson viewer...</div>
          </div>
        )}

        {contentReady && !showWarning && (
          <>
            <iframe
              src={resolvedCanvaEmbedUrl}
              title={resolvedLessonTitle}
              className="w-full h-full border-0"
              allow="fullscreen"
              loading="eager"
              style={{ position: 'relative', zIndex: 10 }}
            />

            <div
              className="absolute left-0 right-0 bottom-0 z-30"
              style={{
                height: '140px',
                pointerEvents: 'auto',
                cursor: 'not-allowed',
              }}
              onClick={handleControlShieldClick}
              onContextMenu={handleControlShieldClick}
            />

            <div
              className="absolute top-0 right-0 z-30"
              style={{
                width: '240px',
                height: '96px',
                pointerEvents: 'auto',
                cursor: 'not-allowed',
              }}
              onClick={handleControlShieldClick}
              onContextMenu={handleControlShieldClick}
            />
          </>
        )}
      </div>
    </div>
  );
}
