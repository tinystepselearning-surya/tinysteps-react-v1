import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const pagePath = path.join(process.cwd(), 'public', 'admin', 'whatsapp-coexistence-setup.html');
const page = fs.readFileSync(pagePath, 'utf8');

describe('WhatsApp coexistence admin setup page', () => {
  it('uses the recovered Tiny Steps Meta app and Embedded Signup configuration', () => {
    expect(page).toContain("const META_APP_ID = '1401105561770791'");
    expect(page).toContain("const META_CONFIG_ID = '1054093100779716'");
    expect(page).toContain("featureType: 'whatsapp_business_app_onboarding'");
    expect(page).toContain("sessionInfoVersion: '3'");
  });

  it('requires a Tiny Steps admin role before enabling onboarding', () => {
    expect(page).toContain("if (role !== 'admin')");
    expect(page).toContain('Access denied. This setup tool is restricted to Tiny Steps administrators.');
    expect(page).toContain('connectButton.disabled = !(isAdmin && facebookReady && acknowledgement.checked)');
  });

  it('does not include AI provider calls or token exchange', () => {
    expect(page).not.toMatch(/api\.openai\.com/i);
    expect(page).not.toMatch(/generativelanguage\.googleapis\.com/i);
    expect(page).not.toMatch(/anthropic\.com/i);
    expect(page).not.toMatch(/ollama/i);
    expect(page).not.toMatch(/graph\.facebook\.com\/.+access_token/i);
    expect(page).toContain('It does not exchange or store Meta access tokens.');
  });

  it('warns admins to stop if Meta presents migration or disconnect wording', () => {
    expect(page).toContain('migrate');
    expect(page).toContain('disconnect from existing account');
    expect(page).toContain('stop immediately');
  });
});
