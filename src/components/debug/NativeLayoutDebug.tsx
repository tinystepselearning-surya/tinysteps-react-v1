import React, { useEffect, useMemo, useState } from 'react';

const DEBUG_STORAGE_KEY = 'ts_native_layout_debug';
const MAX_OFFENDERS = 10;
const REFRESH_MS = 1200;

type OverflowOffender = {
  tagName: string;
  className: string;
  id: string;
  width: number;
  viewportWidth: number;
};

type NativeLayoutSnapshot = {
  timestamp: string;
  pathname: string;
  innerWidth: number;
  innerHeight: number;
  htmlClientWidth: number;
  htmlScrollWidth: number;
  bodyClientWidth: number;
  bodyScrollWidth: number;
  rootClientWidth: number;
  rootScrollWidth: number;
  hasTsCapacitorNative: boolean;
  activeElementTag: string;
  tabbarHeightVar: string;
  tabbarReserveVar: string;
  htmlScrollWidthExceedsClientWidth: boolean;
  offenders: OverflowOffender[];
};

const truncate = (value: string, max = 96) => {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

const isNativeCapacitorRuntime = () => {
  if (typeof window === 'undefined') return false;

  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    try {
      return Boolean(cap.isNativePlatform());
    } catch {
      return false;
    }
  }

  const protocol = window.location.protocol;
  return protocol === 'capacitor:' || protocol === 'ionic:';
};

const normalizeWidth = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
};

const resolveActiveElementTag = () => {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return 'none';

  const tag = active.tagName?.toLowerCase() || 'unknown';
  const maybeType =
    active instanceof HTMLInputElement || active instanceof HTMLButtonElement
      ? active.type
      : '';
  return maybeType ? `${tag}[type=${maybeType}]` : tag;
};

const collectOverflowOffenders = (viewportWidth: number): OverflowOffender[] => {
  const offenders: OverflowOffender[] = [];
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('body *'));

  for (const node of nodes) {
    if (node.closest('[data-native-layout-debug="1"]')) continue;

    const rect = node.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || rect.width <= viewportWidth + 1 || rect.width <= 0) {
      continue;
    }

    offenders.push({
      tagName: node.tagName.toLowerCase(),
      className: truncate((node.getAttribute('class') || '').replace(/\s+/g, ' ').trim()),
      id: truncate(node.id || '', 64),
      width: normalizeWidth(rect.width),
      viewportWidth: normalizeWidth(viewportWidth),
    });
  }

  offenders.sort((a, b) => b.width - a.width);
  return offenders.slice(0, MAX_OFFENDERS);
};

const collectSnapshot = (): NativeLayoutSnapshot => {
  const docEl = document.documentElement;
  const body = document.body;
  const root = document.getElementById('root');
  const computedDocStyles = window.getComputedStyle(docEl);
  const innerWidth = window.innerWidth;
  const pathname = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const offenders = collectOverflowOffenders(innerWidth);

  return {
    timestamp: new Date().toISOString(),
    pathname,
    innerWidth: normalizeWidth(innerWidth),
    innerHeight: normalizeWidth(window.innerHeight),
    htmlClientWidth: normalizeWidth(docEl.clientWidth),
    htmlScrollWidth: normalizeWidth(docEl.scrollWidth),
    bodyClientWidth: normalizeWidth(body?.clientWidth || 0),
    bodyScrollWidth: normalizeWidth(body?.scrollWidth || 0),
    rootClientWidth: normalizeWidth(root?.clientWidth || 0),
    rootScrollWidth: normalizeWidth(root?.scrollWidth || 0),
    hasTsCapacitorNative: docEl.classList.contains('ts-capacitor-native'),
    activeElementTag: resolveActiveElementTag(),
    tabbarHeightVar: computedDocStyles.getPropertyValue('--ts-mobile-tabbar-height').trim() || '(unset)',
    tabbarReserveVar: computedDocStyles.getPropertyValue('--ts-mobile-tabbar-reserve').trim() || '(unset)',
    htmlScrollWidthExceedsClientWidth: docEl.scrollWidth > docEl.clientWidth,
    offenders,
  };
};

const copyText = async (text: string) => {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', 'true');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);
  if (!copied) {
    throw new Error('execCommand copy failed');
  }
};

export default function NativeLayoutDebug() {
  const isNativeRuntime = useMemo(() => isNativeCapacitorRuntime(), []);
  const [enabled, setEnabled] = useState(false);
  const [snapshot, setSnapshot] = useState<NativeLayoutSnapshot | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (!isNativeRuntime || typeof window === 'undefined') return;

    const syncEnabledState = () => {
      setEnabled(window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1');
    };

    syncEnabledState();
    const pollId = window.setInterval(syncEnabledState, 1500);
    window.addEventListener('storage', syncEnabledState);
    window.addEventListener('focus', syncEnabledState);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener('storage', syncEnabledState);
      window.removeEventListener('focus', syncEnabledState);
    };
  }, [isNativeRuntime]);

  useEffect(() => {
    if (!isNativeRuntime || !enabled) return;

    const refresh = () => {
      setSnapshot(collectSnapshot());
    };

    refresh();

    const intervalId = window.setInterval(refresh, REFRESH_MS);
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    document.addEventListener('focusin', refresh);
    window.addEventListener('popstate', refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('resize', refresh);
      window.removeEventListener('orientationchange', refresh);
      document.removeEventListener('focusin', refresh);
      window.removeEventListener('popstate', refresh);
    };
  }, [enabled, isNativeRuntime]);

  if (!isNativeRuntime || !enabled) return null;

  const handleCopy = async () => {
    if (!snapshot) return;
    try {
      await copyText(JSON.stringify(snapshot, null, 2));
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 1800);
    }
  };

  const handleDisable = () => {
    window.localStorage.removeItem(DEBUG_STORAGE_KEY);
    setEnabled(false);
    setSnapshot(null);
  };

  return (
    <aside
      data-native-layout-debug="1"
      className="fixed bottom-2 right-2 z-[2147483647] w-[min(92vw,360px)] max-h-[58vh] overflow-auto rounded-xl border border-white/20 bg-black/85 p-3 text-[11px] leading-tight text-white shadow-2xl backdrop-blur-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-semibold tracking-wide">Native Layout Debug</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded border border-white/30 px-2 py-0.5 text-[10px] hover:bg-white/10"
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleDisable}
            className="rounded border border-white/30 px-2 py-0.5 text-[10px] hover:bg-white/10"
          >
            Disable
          </button>
        </div>
      </div>

      {snapshot ? (
        <div className="space-y-2">
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
            <span className="text-white/70">path</span>
            <span className="truncate">{snapshot.pathname}</span>
            <span className="text-white/70">inner</span>
            <span>{snapshot.innerWidth} x {snapshot.innerHeight}</span>
            <span className="text-white/70">html c/s</span>
            <span>{snapshot.htmlClientWidth} / {snapshot.htmlScrollWidth}</span>
            <span className="text-white/70">body c/s</span>
            <span>{snapshot.bodyClientWidth} / {snapshot.bodyScrollWidth}</span>
            <span className="text-white/70">root c/s</span>
            <span>{snapshot.rootClientWidth} / {snapshot.rootScrollWidth}</span>
            <span className="text-white/70">native class</span>
            <span>{snapshot.hasTsCapacitorNative ? 'yes' : 'no'}</span>
            <span className="text-white/70">active el</span>
            <span className="truncate">{snapshot.activeElementTag}</span>
            <span className="text-white/70">tabbar h</span>
            <span>{snapshot.tabbarHeightVar}</span>
            <span className="text-white/70">tabbar reserve</span>
            <span>{snapshot.tabbarReserveVar}</span>
            <span className="text-white/70">html overflow</span>
            <span>{snapshot.htmlScrollWidthExceedsClientWidth ? 'yes' : 'no'}</span>
          </div>

          <div>
            <div className="mb-1 text-white/70">Widest elements (&gt; viewport, top {MAX_OFFENDERS})</div>
            {snapshot.offenders.length === 0 ? (
              <div className="text-white/80">none</div>
            ) : (
              <div className="space-y-1">
                {snapshot.offenders.map((offender, index) => (
                  <div key={`${offender.tagName}-${offender.id}-${index}`} className="rounded bg-white/10 px-2 py-1">
                    <div className="truncate">
                      {index + 1}. {offender.tagName}
                      {offender.id ? `#${offender.id}` : ''}
                    </div>
                    <div className="truncate text-white/70">{offender.className || '(no class)'}</div>
                    <div className="text-white/80">
                      {offender.width}px / {offender.viewportWidth}px
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-white/80">Collecting…</div>
      )}
    </aside>
  );
}
