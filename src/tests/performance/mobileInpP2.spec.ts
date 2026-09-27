import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const analyticsSource = fs.readFileSync(path.join(repoRoot, 'src/lib/analytics.ts'), 'utf8');
const conversionTrackerSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/common/ConversionTracker.tsx'),
  'utf8',
);
const homeSource = fs.readFileSync(path.join(repoRoot, 'src/pages/HomePage.tsx'), 'utf8');

describe('P2 mobile INP hotspot repairs', () => {
  it('never arms analytics script loading from user input', () => {
    expect(analyticsSource).toContain('queueScriptLoad(measurementId);');
    expect(analyticsSource).not.toContain('armInteractionLoader');
    expect(analyticsSource).not.toContain("addEventListener('pointerdown'");
    expect(analyticsSource).not.toContain("addEventListener('touchstart'");
    expect(analyticsSource).not.toContain("addEventListener('keydown'");
    expect(analyticsSource).not.toContain("addEventListener('scroll'");
    expect(analyticsSource).not.toContain("addEventListener('click'");
  });

  it('defers in-app conversion analytics until after the interaction presentation frame', () => {
    expect(conversionTrackerSource).toContain('function scheduleAfterPaint');
    expect(conversionTrackerSource).toContain('window.requestAnimationFrame(run)');
    expect(conversionTrackerSource).toContain('scheduleAfterPaint(() => processTrackedClick(node));');
    expect(conversionTrackerSource).toContain('shouldTrackSynchronously(node)');
  });

  it('does not expose the heavy homepage deferred anchor before primary sections mount', () => {
    expect(homeSource).toContain('if (!showPrimaryBelowFoldSections) return;');
    expect(homeSource).toContain('}, [showPrimaryBelowFoldSections]);');

    const primaryGateIndex = homeSource.indexOf('{showPrimaryBelowFoldSections ? (');
    const deferredAnchorIndex = homeSource.indexOf('<div ref={deferredAnchorRef}');
    const deferredSectionsIndex = homeSource.indexOf('{showDeferredSections ? (');

    expect(primaryGateIndex).toBeGreaterThan(-1);
    expect(deferredAnchorIndex).toBeGreaterThan(primaryGateIndex);
    expect(deferredSectionsIndex).toBeGreaterThan(deferredAnchorIndex);
  });
});
