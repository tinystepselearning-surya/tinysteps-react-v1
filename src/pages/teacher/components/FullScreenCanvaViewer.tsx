import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@components/ui/button';
import { X, Maximize, Minimize } from 'lucide-react';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

type Violation = {
  type: 'RIGHT_CLICK' | 'PRINT' | 'SAVE' | 'VIEW_SOURCE' | 'DEVTOOLS' | 'CANVA_CONTROLS_BLOCKED';
  ts: number;
};

interface FullScreenCanvaViewerProps {
  lessonId: string;
  lessonTitle: string;
  canvaEmbedUrl: string;
  sessionId: string;
  teacherId: string;
  teacherName: string;
  onClose: () => void;
}

export function FullScreenCanvaViewer({
  lessonId,
  lessonTitle,
  canvaEmbedUrl,
  sessionId,
  teacherId,
  teacherName,
  onClose,
}: FullScreenCanvaViewerProps) {
  const [showWarning, setShowWarning] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsMessage, setShowControlsMessage] = useState(false);
  const openedAtRef = useRef<number>(Date.now());
  const hasWrittenOpenLog = useRef(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const lastToastTimeRef = useRef<number>(0);

  // Constants for hardening
  const MAX_VIOLATIONS = 50;
  const TOAST_THROTTLE_MS = 2000;

  // Format watermark timestamp
  const watermarkTimestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const watermarkText = `Tiny Steps Private • ${teacherName} • ${watermarkTimestamp}`;

  // Write audit log on open
  useEffect(() => {
    if (hasWrittenOpenLog.current) return;
    hasWrittenOpenLog.current = true;

    const writeOpenLog = async () => {
      try {
        const auditRef = doc(db, 'lesson_view_audit', sessionId);
        await setDoc(auditRef, {
          lessonId,
          teacherId,
          teacherName,
          mode: 'full',
          openedAt: serverTimestamp(),
          violations: [],
        });
        console.log('[FullScreenCanvaViewer] Audit log created:', sessionId);
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to write open audit log:', error);
      }
    };

    writeOpenLog();
  }, [lessonId, teacherId, teacherName, sessionId]);

  // Write policy acceptance when user clicks Continue
  const handleContinue = useCallback(async () => {
    if (!agreedToTerms) return;

    try {
      const auditRef = doc(db, 'lesson_view_audit', sessionId);
      await updateDoc(auditRef, {
        policyAcceptedAt: serverTimestamp(),
      });
      console.log('[FullScreenCanvaViewer] Policy acceptance logged');
    } catch (error) {
      console.error('[FullScreenCanvaViewer] Failed to log policy acceptance:', error);
    }

    setShowWarning(false);

    // Enter fullscreen after policy acceptance
    if (viewerRef.current) {
      try {
        await viewerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to enter fullscreen:', error);
      }
    }
  }, [agreedToTerms, sessionId]);

  // Close handler: write audit log and call onClose
  const handleClose = useCallback(async () => {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to exit fullscreen:', error);
      }
    }

    const closedAt = Date.now();
    const durationSec = Math.floor((closedAt - openedAtRef.current) / 1000);

    try {
      const auditRef = doc(db, 'lesson_view_audit', sessionId);
      await updateDoc(auditRef, {
        closedAt: serverTimestamp(),
        durationSec,
        violations,
      });
      console.log('[FullScreenCanvaViewer] Audit log closed:', sessionId, 'duration:', durationSec, 'violations:', violations.length);
    } catch (error) {
      console.error('[FullScreenCanvaViewer] Failed to write close audit log:', error);
    }

    onClose();
  }, [sessionId, violations, onClose]);

  // Handle right-click on viewer wrapper
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const violation: Violation = { type: 'RIGHT_CLICK', ts: Date.now() };
    setViolations((prev) => {
      const updated = [...prev, violation];
      // Cap violations at MAX_VIOLATIONS
      return updated.slice(-MAX_VIOLATIONS);
    });
    console.log('[FullScreenCanvaViewer] Right-click blocked');
  }, []);

  // Handle Canva control shield clicks
  const handleControlShieldClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    const violation: Violation = { type: 'CANVA_CONTROLS_BLOCKED', ts: now };
    
    setViolations((prev) => {
      const updated = [...prev, violation];
      // Cap violations at MAX_VIOLATIONS
      return updated.slice(-MAX_VIOLATIONS);
    });
    
    console.log('[FullScreenCanvaViewer] Canva controls blocked');

    // Throttle toast: show at most once per TOAST_THROTTLE_MS
    if (now - lastToastTimeRef.current >= TOAST_THROTTLE_MS) {
      lastToastTimeRef.current = now;
      setShowControlsMessage(true);
      setTimeout(() => setShowControlsMessage(false), 3000);
    }
  }, []);

  // Fullscreen toggle handlers
  const handleEnterFullscreen = useCallback(async () => {
    if (viewerRef.current && !document.fullscreenElement) {
      try {
        await viewerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to enter fullscreen:', error);
      }
    }
  }, []);

  const handleExitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to exit fullscreen:', error);
      }
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard protection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      let blocked = false;
      let violationType: Violation['type'] | null = null;

      // Ctrl/Cmd + P (Print)
      if (ctrl && e.key === 'p') {
        blocked = true;
        violationType = 'PRINT';
      }
      // Ctrl/Cmd + S (Save)
      else if (ctrl && e.key === 's') {
        blocked = true;
        violationType = 'SAVE';
      }
      // Ctrl/Cmd + U (View Source)
      else if (ctrl && e.key === 'u') {
        blocked = true;
        violationType = 'VIEW_SOURCE';
      }
      // Ctrl/Cmd + Shift + I (DevTools)
      else if (ctrl && e.shiftKey && e.key === 'I') {
        blocked = true;
        violationType = 'DEVTOOLS';
      }
      // F12 (DevTools)
      else if (e.key === 'F12') {
        blocked = true;
        violationType = 'DEVTOOLS';
      }

      if (blocked && violationType) {
        e.preventDefault();
        e.stopPropagation();
        const violation: Violation = { type: violationType, ts: Date.now() };
        setViolations((prev) => {
          const updated = [...prev, violation];
          // Cap violations at MAX_VIOLATIONS
          return updated.slice(-MAX_VIOLATIONS);
        });
        console.log('[FullScreenCanvaViewer] Keyboard shortcut blocked:', violationType);
      }
    };

    // Attach to document for page-level blocking
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Beforeunload handler: write close log if user refreshes/closes tab
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const closedAt = Date.now();
      const durationSec = Math.floor((closedAt - openedAtRef.current) / 1000);

      try {
        const auditRef = doc(db, 'lesson_view_audit', sessionId);
        // Use setDoc with merge to avoid race condition
        await setDoc(
          auditRef,
          {
            closedAt: serverTimestamp(),
            durationSec,
            violations,
          },
          { merge: true }
        );
        console.log('[FullScreenCanvaViewer] Beforeunload: audit log updated');
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to update audit on unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, violations]);

  return (
    <div
      ref={viewerRef}
      className="fixed inset-0 z-50 bg-white"
      onContextMenu={handleContextMenu}
      style={{ userSelect: 'none' }}
    >
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">⚠️ Copyright Notice</h2>
            <p className="text-gray-700 mb-6">
              This is private copyrighted content. Downloading, sharing, or screen recording is not
              allowed.
            </p>
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I agree to these terms and will not download, share, or record this content.
              </span>
            </label>
            <Button
              onClick={handleContinue}
              disabled={!agreedToTerms}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="h-16 bg-gray-900 text-white flex items-center justify-between px-6 relative z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold truncate max-w-md">{lessonTitle}</h1>
          <span className="text-sm text-gray-400">Full-Screen Viewer</span>
        </div>
        <div className="flex items-center gap-2">
          {!isFullscreen ? (
            <Button
              onClick={handleEnterFullscreen}
              variant="ghost"
              className="text-white hover:bg-gray-800"
            >
              <Maximize className="w-5 h-5 mr-2" />
              Enter Fullscreen
            </Button>
          ) : (
            <Button
              onClick={handleExitFullscreen}
              variant="ghost"
              className="text-white hover:bg-gray-800"
            >
              <Minimize className="w-5 h-5 mr-2" />
              Exit Fullscreen
            </Button>
          )}
          <Button
            onClick={handleClose}
            variant="ghost"
            className="text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Main Content Area with Watermark and Control Shields */}
      <div className="relative" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Watermark Overlay - High Z-Index, No Pointer Events */}
        {!showWarning && (
          <div
            className="absolute inset-0 z-40 flex flex-wrap items-center justify-center overflow-hidden"
            style={{
              pointerEvents: 'none',
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 200px,
                rgba(0, 0, 0, 0.02) 200px,
                rgba(0, 0, 0, 0.02) 400px
              )`,
            }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="text-gray-900/10 font-bold text-xl p-4 transform rotate-[-30deg] whitespace-nowrap"
                style={{ pointerEvents: 'none' }}
              >
                {watermarkText}
              </div>
            ))}
          </div>
        )}

        {/* Control Shield Message */}
        {showControlsMessage && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold">
            🚫 Controls are disabled. This is private content.
          </div>
        )}

        {/* Bottom Control Shield - Blocks entire Canva bottom control bar */}
        {!showWarning && (
          <div
            className="absolute left-0 right-0 bottom-0 z-30"
            style={{
              height: '140px',
              background: 'transparent',
              pointerEvents: 'auto',
              cursor: 'not-allowed',
            }}
            onClick={handleControlShieldClick}
            onContextMenu={handleControlShieldClick}
          />
        )}

        {/* Top-Right Control Shield - Blocks Canva overlay buttons (if any) */}
        {!showWarning && (
          <div
            className="absolute top-0 right-0 z-30"
            style={{
              width: '200px',
              height: '80px',
              background: 'transparent',
              pointerEvents: 'auto',
              cursor: 'not-allowed',
            }}
            onClick={handleControlShieldClick}
            onContextMenu={handleControlShieldClick}
          />
        )}

        {/* Canva Embed Iframe */}
        {!showWarning && (
          <iframe
            src={canvaEmbedUrl}
            title={lessonTitle}
            className="w-full h-full border-0"
            allow="fullscreen"
            loading="eager"
            style={{ position: 'relative', zIndex: 10 }}
          />
        )}
      </div>
    </div>
  );
}
