import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { displayNameFromPhoto, getTeamPhotoManifest } from '../teamPhotoManifest.mjs';

const validWebp = Buffer.from('UklGRjIAAABXRUJQVlA4ICYAAACQAQCdASoCAAMAAkA4JYgCdLoAA5gA/vbSB6+AKeqOtC0HwAAAAA==', 'base64');

function fixture(run) {
  const folder = mkdtempSync(join(tmpdir(), 'tiny-steps-team-'));
  try { run(folder); } finally { rmSync(folder, { recursive: true, force: true }); }
}

test('empty public/team keeps approved founder photo and publishes no invented teacher', () => {
  fixture((folder) => {
    assert.deepEqual(getTeamPhotoManifest(folder), {
      founderPhotoSrc: '/priya-founder-tiny-steps-learning.webp',
      teachers: [],
    });
  });
});

test('Founder.webp is distinct from teachers; all approved WebP filenames become names only', () => {
  fixture((folder) => {
    for (const file of ['Founder.webp', 'Nashra-Khan.webp', 'Javeria_Ahmed.webp', 'Alia Siddiqui.webp', 'skip.jpg', '.gitkeep']) {
      writeFileSync(join(folder, file), file.toLowerCase().endsWith('.webp') ? validWebp : '');
    }
    assert.deepEqual(getTeamPhotoManifest(folder), {
      founderPhotoSrc: '/team/Founder.webp',
      teachers: [
        { name: 'Alia Siddiqui', src: '/team/Alia%20Siddiqui.webp' },
        { name: 'Javeria Ahmed', src: '/team/Javeria_Ahmed.webp' },
        { name: 'Nashra Khan', src: '/team/Nashra-Khan.webp' },
      ],
    });
  });
});

test('duplicate public names fail visibly instead of silently publishing two identical cards', () => {
  fixture((folder) => {
    writeFileSync(join(folder, 'Nashra-Khan.webp'), validWebp);
    writeFileSync(join(folder, 'Nashra_Khan.webp'), validWebp);
    assert.throws(() => getTeamPhotoManifest(folder), /Duplicate public teacher name/);
  });
});

test('teacher names keep human casing and do not infer degrees or IB programme status', () => {
  assert.equal(displayNameFromPhoto('nashra-khan.webp'), 'Nashra Khan');
  assert.equal(displayNameFromPhoto('Maryam-Fatima.webp'), 'Maryam Fatima');
  const gallery = readFileSync(new URL('../../src/pages/team/TeacherPortraitsSection.tsx', import.meta.url), 'utf8');
  const team = readFileSync(new URL('../../src/pages/TeamPage.tsx', import.meta.url), 'utf8');
  assert.match(gallery, /Early Years &amp; Primary English Educators/);
  assert.match(gallery, /<h3[^>]*>\{teacher.name\}<\/h3>/);
  assert.doesNotMatch(gallery, /IB PYP|certified teacher|qualification:|degree:/i);
  assert.match(team, /<FounderSection \/>/);
  assert.match(team, /<TeacherPortraitsSection \/>/);
  assert.match(team, /<TeachingAssuranceSection \/>/);
  assert.doesNotMatch(team, /<TeachingCommunitySection \/>/);
});

test('public-facing assurance accurately describes targeted audits and follow-up', () => {
  const trust = readFileSync(new URL('../../src/pages/team/TeachingAssuranceSection.tsx', import.meta.url), 'utf8');
  assert.match(trust, /Ongoing lesson and conduct reviews/);
  assert.match(trust, /selected lessons and recordings/);
  assert.match(trust, /Feedback, coaching and follow-up/);
  assert.match(trust, /Our academic reviews focus on instructional quality and professional standards/);
});

test('wrong-cased founder filename is rejected rather than silently lost', () => {
  fixture((folder) => {
    writeFileSync(join(folder, 'founder.webp'), validWebp);
    assert.throws(() => getTeamPhotoManifest(folder), /named exactly Founder.webp/);
  });
});

test('rejects JPEG or PNG renamed as .webp before publication', () => {
  fixture((folder) => {
    writeFileSync(join(folder, 'Example Educator.webp'), Buffer.from('fake image pretending to be webp'));
    assert.throws(() => getTeamPhotoManifest(folder), /Invalid WebP image/);
  });
});

test('founder and teacher photos use responsive oval masks without extra titles on each card', () => {
  const founder = readFileSync(new URL('../../src/pages/team/TeamPageSections.tsx', import.meta.url), 'utf8');
  const teacher = readFileSync(new URL('../../src/pages/team/TeacherPortraitsSection.tsx', import.meta.url), 'utf8');
  assert.ok(founder.includes('rounded-[50%]'));
  assert.ok(founder.includes('alt="Priya, Founder of Tiny Steps Learning"'));
  assert.ok(!founder.includes('reviewing academic materials'));
  assert.ok(teacher.includes('aspect-[4/5]'));
  assert.ok(teacher.includes('rounded-[50%]'));
  assert.ok(teacher.includes('{teacher.name}'));
});

test('Team page keeps the merged concise structure while using Phonics pastel palette', () => {
  const sections = readFileSync(new URL('../../src/pages/team/TeamPageSections.tsx', import.meta.url), 'utf8');
  const gallery = readFileSync(new URL('../../src/pages/team/TeacherPortraitsSection.tsx', import.meta.url), 'utf8');
  const team = readFileSync(new URL('../../src/pages/TeamPage.tsx', import.meta.url), 'utf8');
  for (const token of ['from-[#D9EEFF] via-[#F4FAFF] to-[#FFF4DC]', 'from-[#E7F3FF] via-[#F5F0FF] to-[#FFF4DC]']) {
    assert.ok(sections.includes(token), 'Missing approved gradient ' + token);
  }
  assert.ok(gallery.includes('from-[#FFF7EC] via-[#FBF8FF] to-[#EAF6FF]'));
  assert.ok(gallery.includes('Early Years &amp; Primary English Educators'));
  assert.ok(gallery.includes('publicTeacherPhotos.map'));
  assert.ok(team.includes('<TeamOfficialLinksSection />'));
  assert.ok(!team.includes('<TrustMetrics />'));
  assert.ok(!team.includes('<ResearchToClassroomSection />'));
  assert.ok(!team.includes('<QualitySystemSection />'));
  assert.equal((sections.match(/alt="Priya, Founder of Tiny Steps Learning"/g) || []).length, 1);
});

test('Team hero uses substantive teaching evidence rather than unverified seniority or school affiliations', () => {
  const sections = readFileSync(new URL('../../src/pages/team/TeamPageSections.tsx', import.meta.url), 'utf8');
  const content = readFileSync(new URL('../../src/pages/team/teamPageContent.ts', import.meta.url), 'utf8');
  assert.ok(sections.includes('Thoughtful teaching. More confident learning.'));
  assert.ok(sections.includes('How we guide learning'));
  assert.ok(sections.includes('to="/class-samples"'));
  assert.ok(content.includes('graduate-qualified educators with school-classroom teaching experience'));
  assert.doesNotMatch(sections + content, /senior[- ]most|international[- ]school teachers|IB certified|exclusive faculty|100% audited/i);
});
