(() => {
  'use strict';

  const REVISION = '2026-09-11-commercial-ux-r1';
  const OWNER_PATHS = Object.freeze([
    '/phonics',
    '/best-online-phonics-classes-for-kids-in-india',
    '/phonics-fees-india',
    '/reading-classes-for-kids',
    '/reading-fluency-program',
    '/grammar',
    '/writing-classes-for-kids',
    '/spoken-english-classes-for-kids-online',
    '/speaking',
    '/confidence-building-program-kids',
    '/online-english-classes-for-kids',
    '/online-english-classes-hyderabad',
    '/pricing',
    '/book-demo',
  ]);
  const OWNER_SET = new Set(OWNER_PATHS);
  const STYLE_ID = 'ts-commercial-owner-experience-css';
  const PROGRESS_ID = 'ts-commercial-owner-progress';
  const CTA_ID = 'ts-commercial-owner-cta';
  const ROOT_ACTIVE_CLASS = 'ts-commercial-owner-active';
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

  let currentPath = '';
  let active = false;
  let rafId = 0;
  let sectionObserver = null;
  let sectionSetupTimer = 0;
  let sectionMutationObserver = null;

  const normalizePath = (pathname) => {
    const cleaned = String(pathname || '/').replace(/\/+$/, '');
    return cleaned || '/';
  };

  const styles = `
html.${ROOT_ACTIVE_CLASS} {
  --ts-commercial-ink: #0f172a;
  --ts-commercial-muted: #475569;
  --ts-commercial-orange: #f97316;
  --ts-commercial-sky: #0ea5e9;
  --ts-commercial-surface: rgba(255,255,255,.94);
}
html.${ROOT_ACTIVE_CLASS} body {
  background: #ffffff;
}
html.${ROOT_ACTIVE_CLASS} #root main h1,
html.${ROOT_ACTIVE_CLASS} #root main h2 {
  text-wrap: balance;
}
html.${ROOT_ACTIVE_CLASS} #root main p,
html.${ROOT_ACTIVE_CLASS} #root main li {
  text-wrap: pretty;
}
html.${ROOT_ACTIVE_CLASS} #root main section,
html.${ROOT_ACTIVE_CLASS} #root main [id] {
  scroll-margin-top: 108px;
}
html.${ROOT_ACTIVE_CLASS} #root main :is(a,button)[class*="rounded"] {
  touch-action: manipulation;
}
html.${ROOT_ACTIVE_CLASS} #root main :is(a,button)[class*="rounded"]:active {
  transform: translateY(1px) scale(.99);
}
html.${ROOT_ACTIVE_CLASS} #root main details > summary {
  transition: color 180ms ease, background-color 180ms ease;
}
html.${ROOT_ACTIVE_CLASS} #root main details[open] > summary {
  color: var(--ts-commercial-ink);
}

/* Legacy pricing bridge: preserve content while matching the current commercial visual language. */
html[data-ts-commercial-path="/pricing"] #root .page-gradient {
  background: linear-gradient(180deg, rgba(255,248,239,.88) 0%, #ffffff 46%, rgba(238,248,255,.76) 100%) !important;
}
html[data-ts-commercial-path="/pricing"] #root .glass-panel {
  border: 1px solid rgba(226,232,240,.94) !important;
  border-radius: 32px !important;
  background: rgba(255,255,255,.94) !important;
  box-shadow: 0 24px 64px rgba(15,23,42,.08) !important;
  backdrop-filter: blur(14px);
}
html[data-ts-commercial-path="/pricing"] #root .gradient-chip {
  border: 1px solid #fed7aa !important;
  border-radius: 999px !important;
  background: rgba(255,247,237,.94) !important;
  color: #c2410c !important;
  box-shadow: 0 4px 14px rgba(249,115,22,.08) !important;
}
html[data-ts-commercial-path="/pricing"] #root .page-gradient > section:first-of-type {
  padding-top: clamp(2rem, 5vw, 4rem) !important;
}

/* Writing bridge: remove the boxed-page feel while keeping every existing section and semantic owner intact. */
html[data-ts-commercial-path="/writing-classes-for-kids"] #root main > main.container {
  max-width: none !important;
  padding: 0 0 5rem !important;
  background: linear-gradient(180deg, rgba(236,253,245,.58) 0%, #ffffff 38%, rgba(245,243,255,.54) 100%);
}
html[data-ts-commercial-path="/writing-classes-for-kids"] #root main > main.container > section {
  width: min(calc(100% - 2rem), 72rem);
  margin-left: auto;
  margin-right: auto;
}
html[data-ts-commercial-path="/writing-classes-for-kids"] #root main > main.container > section:first-child {
  margin-top: 2rem;
  border-radius: 32px !important;
  box-shadow: 0 24px 64px rgba(15,23,42,.08) !important;
}

#${PROGRESS_ID} {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 90;
  height: 3px;
  pointer-events: none;
  background: transparent;
}
#${PROGRESS_ID} > span {
  display: block;
  width: 100%;
  height: 100%;
  transform: scaleX(0);
  transform-origin: left center;
  background: linear-gradient(90deg, #f97316 0%, #fb7185 52%, #0ea5e9 100%);
  box-shadow: 0 0 16px rgba(249,115,22,.28);
  will-change: transform;
}
#${CTA_ID} {
  position: fixed;
  left: 20px;
  bottom: 22px;
  z-index: 58;
  display: grid;
  grid-template-columns: minmax(0,1fr) auto;
  align-items: center;
  gap: 14px;
  width: min(520px, calc(100vw - 40px));
  padding: 12px 12px 12px 16px;
  border: 1px solid rgba(226,232,240,.92);
  border-radius: 22px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 20px 50px rgba(15,23,42,.18);
  backdrop-filter: blur(16px);
  opacity: 0;
  transform: translateY(18px);
  pointer-events: none;
  transition: opacity 220ms ease, transform 220ms ease;
}
#${CTA_ID}.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
#${CTA_ID} .ts-commercial-cta-copy {
  min-width: 0;
}
#${CTA_ID} .ts-commercial-cta-eyebrow {
  display: block;
  margin-bottom: 2px;
  color: #c2410c;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .12em;
  line-height: 1.35;
  text-transform: uppercase;
}
#${CTA_ID} .ts-commercial-cta-title {
  display: block;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
}
#${CTA_ID} button {
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #0f172a;
  color: white;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 10px 24px rgba(15,23,42,.16);
  transition: background-color 180ms ease, transform 180ms ease;
}
#${CTA_ID} button:hover { background: #1e293b; }
#${CTA_ID} button:active { transform: translateY(1px) scale(.99); }
#${CTA_ID} button:focus-visible {
  outline: 3px solid rgba(249,115,22,.42);
  outline-offset: 3px;
}
html.${ROOT_ACTIVE_CLASS} .ts-commercial-section-enter {
  animation: tsCommercialSectionEnter 460ms cubic-bezier(.2,.8,.2,1) both;
}
@keyframes tsCommercialSectionEnter {
  from { opacity: .88; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (max-width: 767px) {
  #${CTA_ID} {
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 11px 12px;
    border-radius: 20px;
  }
  #${CTA_ID} .ts-commercial-cta-copy { display: none; }
  #${CTA_ID} button { width: 100%; min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  html.${ROOT_ACTIVE_CLASS} #root main *,
  #${CTA_ID},
  #${CTA_ID} button {
    scroll-behavior: auto !important;
    transition-duration: .001ms !important;
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
  }
  html.${ROOT_ACTIVE_CLASS} .ts-commercial-section-enter { animation: none !important; }
}
`;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function ensureProgress() {
    let progress = document.getElementById(PROGRESS_ID);
    if (progress) return progress;
    progress = document.createElement('div');
    progress.id = PROGRESS_ID;
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span></span>';
    document.body.appendChild(progress);
    return progress;
  }

  function triggerExistingAssessmentAction() {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const existing = buttons.find((button) => /book free 35-minute demo/i.test(button.textContent || ''));
    if (existing instanceof HTMLElement) {
      existing.click();
      return;
    }
    window.location.assign('/book-demo');
  }

  function ensureCta() {
    let cta = document.getElementById(CTA_ID);
    if (cta) return cta;

    cta = document.createElement('aside');
    cta.id = CTA_ID;
    cta.setAttribute('aria-label', 'Free Tiny Steps assessment');
    cta.innerHTML = `
      <div class="ts-commercial-cta-copy">
        <span class="ts-commercial-cta-eyebrow">Free 35-minute 1:1 assessment</span>
        <strong class="ts-commercial-cta-title">Find the right starting point before choosing a programme</strong>
      </div>
      <button type="button" aria-label="Book free 35-minute assessment">Book free assessment →</button>
    `;
    cta.querySelector('button')?.addEventListener('click', triggerExistingAssessmentAction);
    document.body.appendChild(cta);
    return cta;
  }

  function getPageRoot() {
    const layoutMain = document.querySelector('#root main');
    if (!layoutMain) return null;
    return layoutMain.firstElementChild || layoutMain;
  }

  function disconnectSectionObserver() {
    sectionObserver?.disconnect();
    sectionObserver = null;
    sectionMutationObserver?.disconnect();
    sectionMutationObserver = null;
    if (sectionSetupTimer) {
      window.clearTimeout(sectionSetupTimer);
      sectionSetupTimer = 0;
    }
  }

  function setupSectionReveals() {
    disconnectSectionObserver();
    if (!active || reducedMotion || !('IntersectionObserver' in window)) return;

    const start = () => {
      if (!active) return;
      const pageRoot = getPageRoot();
      if (!pageRoot) {
        sectionMutationObserver = new MutationObserver(() => {
          if (getPageRoot()) {
            sectionMutationObserver?.disconnect();
            sectionMutationObserver = null;
            setupSectionReveals();
          }
        });
        sectionMutationObserver.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
        return;
      }

      const sections = Array.from(pageRoot.children).filter((node) => node.tagName === 'SECTION').slice(1);
      if (!sections.length) return;

      sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('ts-commercial-section-enter');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

      sections.forEach((section) => sectionObserver.observe(section));
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: 1200 });
    } else {
      sectionSetupTimer = window.setTimeout(start, 420);
    }
  }

  function updateScrollState() {
    rafId = 0;
    if (!active) return;

    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progressValue = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    const progress = ensureProgress().firstElementChild;
    if (progress instanceof HTMLElement) {
      progress.style.transform = `scaleX(${progressValue})`;
    }

    const cta = ensureCta();
    const shouldShow = currentPath !== '/book-demo' && window.scrollY > Math.max(420, window.innerHeight * 0.42) && progressValue < 0.94;
    cta.classList.toggle('is-visible', shouldShow);

    const title = cta.querySelector('.ts-commercial-cta-title');
    if (title) {
      title.textContent = progressValue > 0.68
        ? 'Ready for a clear next step? Start with the free assessment.'
        : 'Find the right starting point before choosing a programme';
    }
  }

  function requestScrollUpdate() {
    if (!active || rafId) return;
    rafId = window.requestAnimationFrame(updateScrollState);
  }

  function activate(path) {
    currentPath = path;
    active = true;
    ensureStyles();
    document.documentElement.classList.add(ROOT_ACTIVE_CLASS);
    document.documentElement.dataset.tsCommercialPath = path;
    ensureProgress().hidden = false;
    ensureCta().hidden = false;
    setupSectionReveals();
    requestScrollUpdate();
  }

  function deactivate() {
    active = false;
    currentPath = '';
    document.documentElement.classList.remove(ROOT_ACTIVE_CLASS);
    delete document.documentElement.dataset.tsCommercialPath;
    const progress = document.getElementById(PROGRESS_ID);
    if (progress) progress.hidden = true;
    const cta = document.getElementById(CTA_ID);
    if (cta) {
      cta.classList.remove('is-visible');
      cta.hidden = true;
    }
    disconnectSectionObserver();
  }

  function syncRoute() {
    const path = normalizePath(window.location.pathname);
    if (OWNER_SET.has(path)) activate(path);
    else deactivate();
  }

  const patchHistory = (methodName) => {
    const original = window.history[methodName];
    if (typeof original !== 'function') return;
    window.history[methodName] = function patchedHistoryMethod(...args) {
      const result = original.apply(this, args);
      window.setTimeout(syncRoute, 0);
      return result;
    };
  };

  patchHistory('pushState');
  patchHistory('replaceState');
  window.addEventListener('popstate', syncRoute);
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });

  window.__TS_COMMERCIAL_OWNER_UX__ = Object.freeze({ revision: REVISION, ownerPaths: OWNER_PATHS });
  syncRoute();
})();
