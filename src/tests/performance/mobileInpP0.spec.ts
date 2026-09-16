import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildInpCandidate, describeInpTarget } from '../../lib/inpRum';

const repoRoot = process.cwd();
const mainSource = fs.readFileSync(path.join(repoRoot, 'src/main.tsx'), 'utf8');
const homeSource = fs.readFileSync(path.join(repoRoot, 'src/pages/HomePage.tsx'), 'utf8');
const routesSource = fs.readFileSync(path.join(repoRoot, 'src/app/routes.tsx'), 'utf8');

describe('P0 mobile INP recovery', () => {
  it('keeps non-critical global boot off the first user interaction', () => {
    expect(mainSource).toContain('installInpRum();');
    expect(mainSource).toContain('requestIdleCallback(boot');
    expect(mainSource).not.toContain("addEventListener('pointerdown', onFirstInteraction");
    expect(mainSource).not.toContain("addEventListener('touchstart', onFirstInteraction");
    expect(mainSource).not.toContain("addEventListener('keydown', onFirstInteraction");
    expect(mainSource).not.toContain("addEventListener('scroll', onFirstInteraction");
  });

  it('loads homepage chapters by viewport/idle scheduling rather than input events', () => {
    expect(homeSource).toContain('deferredAnchorRef');
    expect(homeSource).toContain('IntersectionObserver');
    expect(homeSource).toContain('startTransition');
    expect(homeSource).not.toContain('onFirstInteraction');
    expect(homeSource).not.toContain('window.addEventListener("pointerdown"');
    expect(homeSource).not.toContain('window.addEventListener("touchstart"');
    expect(homeSource).not.toContain('window.addEventListener("keydown"');
    expect(homeSource).not.toContain('window.addEventListener("scroll"');
  });

  it('keeps shared public chrome and support-widget mounting off user input', () => {
    expect(routesSource).toContain('scheduleDeferredActivation');
    expect(routesSource).toContain('requestIdleCallback(activate');
    expect(routesSource).not.toContain('onFirstInteraction');
    expect(routesSource).not.toContain("window.addEventListener('pointerdown'");
    expect(routesSource).not.toContain("window.addEventListener('touchstart'");
    expect(routesSource).not.toContain("window.addEventListener('keydown'");
    expect(routesSource).not.toContain("window.addEventListener('scroll'");
  });

  it('derives INP attribution without reading visible or accessible user text', () => {
    const button = document.createElement('button');
    button.id = 'book-demo';
    button.textContent = 'Parent private text must not be collected';
    button.setAttribute('aria-label', 'Private accessible label');
    button.setAttribute('data-cwv-id', 'hero-cta');

    expect(describeInpTarget(button)).toBe('button[data-cwv-id=hero-cta]#book-demo[type=submit]');
  });

  it('calculates the Event Timing phases used for INP diagnosis', () => {
    const target = document.createElement('button');
    const candidate = buildInpCandidate({
      duration: 240,
      entryType: 'event',
      interactionId: 42,
      name: 'click',
      processingEnd: 170,
      processingStart: 70,
      startTime: 50,
      target,
      toJSON: () => ({}),
    } as PerformanceEntry & {
      duration: number;
      interactionId: number;
      name: string;
      processingEnd: number;
      processingStart: number;
      startTime: number;
      target: EventTarget;
    });

    expect(candidate).toMatchObject({
      duration: 240,
      eventName: 'click',
      inputDelay: 20,
      interactionId: 42,
      processingTime: 100,
      presentationDelay: 120,
      target: 'button[type=submit]',
    });
  });
});
