import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const speaking = fs.readFileSync(path.join(root, 'src/pages/speaking.tsx'), 'utf8');

describe('Speaking Commercial Authority v2 — Brick 4 AI-era communication', () => {
  it('adds a six-step human communication framework for an AI-enabled world', () => {
    expect(speaking).toContain('const speakingAiEraCapabilities = [');
    expect(speaking).toContain("step: 'ASK'");
    expect(speaking).toContain("step: 'THINK'");
    expect(speaking).toContain("step: 'ORGANISE'");
    expect(speaking).toContain("step: 'EXPLAIN'");
    expect(speaking).toContain("step: 'LISTEN'");
    expect(speaking).toContain("step: 'RESPOND'");
    expect(speaking).toContain('ASK → THINK → ORGANISE → EXPLAIN → LISTEN → RESPOND');
  });

  it('keeps the proposition centred on human communication and judgement rather than AI hype', () => {
    expect(speaking).toContain('Communication skills matter even more when information is easy to generate');
    expect(speaking).toContain('what question matters');
    expect(speaking).toContain('what needs checking');
    expect(speaking).toContain('how to explain their reasoning');
    expect(speaking).toContain('how to listen to another person');
    expect(speaking).toContain('how to respond responsibly');
    expect(speaking).toContain('not as a prompt-engineering course');
    expect(speaking).toContain('Does Tiny Steps teach children prompt engineering in Public Speaking classes?');
  });

  it('does not imply that young children need to use AI tools', () => {
    expect(speaking).toContain('This does not mean young children need to use AI tools.');
    expect(speaking).toContain('ordinary, age-appropriate conversation, storytelling, explanation, discussion, and questioning');
  });

  it('publishes authoritative future-skills references with explicit evidence boundaries', () => {
    expect(speaking).toContain('https://www.unesco.org/en/articles/ai-competency-framework-students');
    expect(speaking).toContain('https://www.oecd.org/en/data/tools/oecd-learning-compass-2030.html');
    expect(speaking).toContain('https://www.unicef.org/innocenti/reports/skills-ai-world');
    expect(speaking).toContain('https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/');
    expect(speaking).toContain('not as a public-speaking curriculum standard');
    expect(speaking).toContain('The consultation sample was ages 9–17');
    expect(speaking).toContain('This is labour-market context, not a child-development benchmark.');
    expect(speaking).toContain('They do not claim that public-speaking lessons alone produce AI competence, future job success, or any guaranteed outcome.');
  });

  it('keeps better questioning as a transferable communication skill, not a new product', () => {
    expect(speaking).toContain('Asking clearer questions is taught as a transferable communication and thinking skill');
    expect(speaking).toContain('The Speaking programme remains a public-speaking and communication programme.');
    expect(speaking).not.toContain('AI Public Speaking Course');
    expect(speaking).not.toContain('/ai-public-speaking');
  });

  it('adds semantic markup for the six communication capabilities', () => {
    expect(speaking).toContain('const speakingAiEraCapabilitiesSchema = {');
    expect(speaking).toContain("name: 'Tiny Steps communication capabilities for an AI-enabled world'");
    expect(speaking).toContain('speakingAiEraCapabilitiesSchema');
  });
});
