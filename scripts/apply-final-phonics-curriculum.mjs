import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function filePath(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(filePath(rel), 'utf8');
}

function write(rel, content) {
  fs.writeFileSync(filePath(rel), content, 'utf8');
  console.log(`[phonics-curriculum] updated ${rel}`);
}

function replaceOnce(content, pattern, replacement, label) {
  const matches = content.match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`));
  if (!matches || matches.length !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${matches?.length ?? 0}`);
  }
  return content.replace(pattern, replacement);
}

function ensureImport(content, anchor, importLine, label) {
  if (content.includes(importLine)) return content;
  if (!content.includes(anchor)) {
    throw new Error(`${label}: import anchor not found`);
  }
  return content.replace(anchor, `${anchor}${importLine}\n`);
}

function patchCourses() {
  const rel = 'src/content/courses.ts';
  let content = read(rel);

  content = ensureImport(
    content,
    "} from '../config/pricing';\n",
    "import { PHONICS_LESSONS_BY_COURSE, PHONICS_STAGE_DEFINITIONS } from './phonicsCurriculum';",
    'courses phonics import',
  );

  content = replaceOnce(
    content,
    /(slug: 'phonics-foundation'[\s\S]*?duration:\s*)'30 lessons'/,
    "$1'31 lessons'",
    'foundation public lesson count',
  );
  content = replaceOnce(
    content,
    /(slug: 'phonics-brush-up'[\s\S]*?duration:\s*)'41 lessons'/,
    "$1'40 lessons'",
    'early public lesson count',
  );
  content = replaceOnce(
    content,
    /(slug: 'phonics-advanced'[\s\S]*?duration:\s*)'20 lessons'/,
    "$1'30 lessons'",
    'advanced public lesson count',
  );

  content = replaceOnce(
    content,
    /const PHONICS_FOUNDATIONS_LESSONS = \[[\s\S]*?\nconst GRAMMAR_BASIC_LABELS = \[/,
    `const PHONICS_FOUNDATIONS_LESSONS = PHONICS_LESSONS_BY_COURSE['phonics-foundations'].map(\n  (lesson) => lesson.displayTitle,\n);\nconst EARLY_PHONICS_LESSONS = PHONICS_LESSONS_BY_COURSE['early-phonics'].map(\n  (lesson) => lesson.displayTitle,\n);\nconst ADVANCED_PHONICS_LESSONS = PHONICS_LESSONS_BY_COURSE['advanced-phonics'].map(\n  (lesson) => lesson.displayTitle,\n);\n\nconst GRAMMAR_BASIC_LABELS = [`,
    'courses duplicated phonics lesson lists',
  );

  content = replaceOnce(
    content,
    /const PHONICS_FOUNDATIONS_STAGES = \[[\s\S]*?\nconst GRAMMAR_BASIC_STAGES = \[/,
    `const toPublicPhonicsStages = (\n  stages: Array<{ stageOrder: number; label: string; start: number; end: number }>,\n) =>\n  stages.map((stage) => ({\n    title: stage.label,\n    start: stage.start,\n    end: stage.end,\n    focus: \`Lessons \${stage.start}–\${stage.end}: \${stage.label.replace(/^Stage \\d+ — /, '')}.\`,\n  }));\n\nconst PHONICS_FOUNDATIONS_STAGES = toPublicPhonicsStages(\n  PHONICS_STAGE_DEFINITIONS['phonics-foundations'],\n);\nconst EARLY_PHONICS_STAGES = toPublicPhonicsStages(\n  PHONICS_STAGE_DEFINITIONS['early-phonics'],\n);\nconst ADVANCED_PHONICS_STAGES = toPublicPhonicsStages(\n  PHONICS_STAGE_DEFINITIONS['advanced-phonics'],\n);\n\nconst GRAMMAR_BASIC_STAGES = [`,
    'courses duplicated phonics stages',
  );

  write(rel, content);
}

function patchStudentProgressEditor() {
  const rel = 'src/components/teacher/StudentTopicProgressEditor.tsx';
  let content = read(rel);

  content = ensureImport(
    content,
    "import { getProgressSkillsForLesson } from '../../lib/progressSkills';\n",
    "import { getPhonicsLessons, isPhonicsCourseId, PHONICS_STAGE_DEFINITIONS } from '../../content/phonicsCurriculum';",
    'student progress canonical phonics import',
  );

  content = replaceOnce(
    content,
    /  'phonics-foundations': \[[\s\S]*?\n  'basic-grammar': \[/,
    `  'phonics-foundations': PHONICS_STAGE_DEFINITIONS['phonics-foundations'],\n  'early-phonics': PHONICS_STAGE_DEFINITIONS['early-phonics'],\n  'advanced-phonics': PHONICS_STAGE_DEFINITIONS['advanced-phonics'],\n  'basic-grammar': [`,
    'student progress phonics stages',
  );

  content = replaceOnce(
    content,
    /(const TOPICS_BY_COURSE: Record<CourseId, CourseTopic\[]> = \{)[\s\S]*?\n  'basic-grammar':/,
    `$1\n  'phonics-foundations': getPhonicsLessons('phonics-foundations') as CourseTopic[],\n  'early-phonics': getPhonicsLessons('early-phonics') as CourseTopic[],\n  'advanced-phonics': getPhonicsLessons('advanced-phonics') as CourseTopic[],\n  'basic-grammar':`,
    'student progress duplicated phonics topic lists',
  );

  content = replaceOnce(
    content,
    /  const courseTopics = useMemo<CourseTopic\[]>\(\(\) => \{\n    if \(!selectedCourseId\) return \[];\n    const courseLabel = COURSE_LABEL_BY_ID\[selectedCourseId\];/,
    `  const courseTopics = useMemo<CourseTopic[]>(() => {\n    if (!selectedCourseId) return [];\n    const courseLabel = COURSE_LABEL_BY_ID[selectedCourseId];\n\n    // Phonics is code-authoritative so stale Firestore curriculumTopics cannot\n    // reintroduce an older sequence in teacher progress.\n    if (isPhonicsCourseId(selectedCourseId)) {\n      return getPhonicsLessons(selectedCourseId).map((topic) => {\n        const rubricType = topic.rubricType as RubricType;\n        return {\n          ...topic,\n          courseLabel,\n          rubricType,\n          subskillChips: SUBSKILL_CHIPS_BY_RUBRIC[rubricType] ?? [],\n          confusionOptions: CONFUSION_OPTIONS_BY_RUBRIC[rubricType] ?? [],\n        } as CourseTopic;\n      });\n    }`,
    'student progress canonical phonics runtime override',
  );

  write(rel, content);
}

function patchAttendanceForm() {
  const rel = 'src/pages/teacher/components/today-sessions/AttendanceForm.tsx';
  let content = read(rel);

  content = ensureImport(
    content,
    "} from '../../../../lib/attendanceCorrectionFreeze';\n",
    "import { getPhonicsLessons, isPhonicsCourseId } from '../../../../content/phonicsCurriculum';",
    'attendance canonical phonics import',
  );

  content = replaceOnce(
    content,
    /  const topics = useMemo\(\(\) => \{\n    const courseId = effectiveCourseId;\n    if \(!courseId\) return \[];\n    return curriculumTopics\.filter\(\(topic\) => topic\.courseId === courseId\);\n  \}, \[curriculumTopics, effectiveCourseId\]\);/,
    `  const topics = useMemo(() => {\n    const courseId = effectiveCourseId;\n    if (!courseId) return [];\n\n    // Keep the attendance/progress picker on the approved phonics sequence even\n    // if config/curriculumTopics still contains a legacy seed.\n    if (isPhonicsCourseId(courseId)) {\n      return getPhonicsLessons(courseId).map(({ id, courseId: canonicalCourseId, lesson, label }) => ({\n        id,\n        courseId: canonicalCourseId,\n        lesson,\n        label,\n      }));\n    }\n\n    return curriculumTopics.filter((topic) => topic.courseId === courseId);\n  }, [curriculumTopics, effectiveCourseId]);`,
    'attendance canonical phonics runtime override',
  );

  write(rel, content);
}

function patchStudentListSync() {
  const rel = 'src/pages/admin/StudentManagement/StudentList.tsx';
  let content = read(rel);

  content = ensureImport(
    content,
    "import type { RescheduleCreditStatus } from '../../../services/rescheduleCredits';\n",
    "import { PHONICS_CURRICULUM_TOPICS as CANONICAL_PHONICS_CURRICULUM_TOPICS, PHONICS_DISPLAY_TITLES as CANONICAL_PHONICS_DISPLAY_TITLES, PHONICS_STAGE_DEFINITIONS, getPhonicsLessons } from '../../../content/phonicsCurriculum';",
    'student list canonical phonics import',
  );

  content = replaceOnce(
    content,
    /const PHONICS_FOUNDATIONS_TITLES = \[[\s\S]*?\nconst PHONICS_DISPLAY_TITLES = \{[\s\S]*?\n\};/,
    `const PHONICS_FOUNDATIONS_TITLES = getPhonicsLessons('phonics-foundations').map((lesson) => lesson.displayTitle);\nconst EARLY_PHONICS_TITLES = getPhonicsLessons('early-phonics').map((lesson) => lesson.displayTitle);\nconst ADVANCED_PHONICS_TITLES = getPhonicsLessons('advanced-phonics').map((lesson) => lesson.displayTitle);\n\nconst PHONICS_DISPLAY_TITLES = CANONICAL_PHONICS_DISPLAY_TITLES;`,
    'student list duplicated phonics display titles',
  );

  content = replaceOnce(
    content,
    /  'phonics-foundations': \[[\s\S]*?\n  'basic-grammar': \[/,
    `  'phonics-foundations': PHONICS_STAGE_DEFINITIONS['phonics-foundations'],\n  'early-phonics': PHONICS_STAGE_DEFINITIONS['early-phonics'],\n  'advanced-phonics': PHONICS_STAGE_DEFINITIONS['advanced-phonics'],\n  'basic-grammar': [`,
    'student list duplicated phonics stages',
  );

  content = replaceOnce(
    content,
    /const PHONICS_CURRICULUM_TOPICS = \[[\s\S]*?\n\]\.map\(\(topic\) => \{[\s\S]*?\n\}\);\n\nconst GRAMMAR_CURRICULUM_TOPICS/,
    `const PHONICS_CURRICULUM_TOPICS = CANONICAL_PHONICS_CURRICULUM_TOPICS.map((topic) => {\n  const rubricType = topic.rubricType as RubricType;\n  const foundationOverride = topic.courseId === 'phonics-foundations'\n    ? buildPhonicsOverride(topic.courseId, topic.lessonNumber, topic.label)\n    : null;\n  return {\n    ...topic,\n    displayTitle: PHONICS_DISPLAY_TITLES[topic.id] ?? topic.displayTitle,\n    rubricType: foundationOverride?.rubricType ?? rubricType,\n    subskillChips: foundationOverride?.subskillChips ?? SUBSKILL_CHIPS_BY_RUBRIC[rubricType],\n    confusionOptions: foundationOverride?.confusionOptions ?? CONFUSION_OPTIONS_BY_RUBRIC[rubricType],\n  };\n});\n\nconst GRAMMAR_CURRICULUM_TOPICS`,
    'student list duplicated phonics sync topics',
  );

  write(rel, content);
}

function patchPhonicsMarketingPage() {
  const rel = 'src/pages/phonics.tsx';
  let content = read(rel);

  const replacements = [
    [
      'Letter sounds + structured synthetic phonics SATPIN blending routines',
      '31-lesson sequence: letter sounds, short vowels, structured revision + grand revision',
    ],
    [
      'Digraphs, vowel teams, silent-e',
      '40-lesson sequence: sound sets, rules, digraphs, vowel teams + Magic E',
    ],
    [
      'Magic E + long vowel patterns',
      'Controlling R, secret-vowel patterns + diphthongs',
    ],
    [
      'Diphthongs, bossy R, alternate vowels',
      '30-lesson sequence: core rules, Magic E, vowel teams + advanced sound families',
    ],
    [
      'Multisyllabic decoding + spelling rules',
      'Controlling R + long A/E/I/O/U sound families',
    ],
    [
      'Fluency + comprehension practice',
      'SHUN, missing/sleepy sounds + lazy-vowel patterns',
    ],
  ];

  for (const [from, to] of replacements) {
    if (!content.includes(from)) {
      throw new Error(`phonics marketing copy not found: ${from}`);
    }
    content = content.replace(from, to);
  }

  write(rel, content);
}

function patchPublicCurriculumOverrides() {
  const rel = 'public/curriculum-v2.1.json';
  const data = JSON.parse(read(rel));

  const stageOverrides = {
    'phonics-foundation': [
      ['Stage 1 — Letters S, A, T, I, P, N', 'Build confident recognition of the first six approved letter sounds.'],
      ['Stage 2 — Letters C, K, E, H, R, M', 'Extend letter-sound recall and use the next approved sound set in early words.'],
      ['Stage 3 — Letters D, G, O, U, L, F', 'Add six more letter sounds with blending and sound discrimination practice.'],
      ['Stage 4 — Letters B, J, Z, W, V, Y', 'Complete the next consonant group with guided reading and sound recall.'],
      ['Stage 5 — Letters X, Q + Short Vowels', 'Finish the letter set and consolidate short-vowel recognition.'],
      ['Stage 6 — Revision + Grand Revision', 'Use three revision lessons and a grand revision to consolidate the full Foundation pathway.'],
    ],
    'phonics-brush-up': [
      ['Stage 1 — Core letter sets + first rules', 'Lessons 1–12: core sound sets, CK Rule, Floss Rule, QU Sound, and Short Vowels.'],
      ['Stage 2 — Digraphs + vowel teams', 'Lessons 13–20: CH, SH, NG, TH, KN and vowel teams AI, EE, EA, IE, OA.'],
      ['Stage 3 — Magic E + word rules', 'Lessons 21–29: all five Magic E patterns, Rabbit Rule, Monster LE, and soft/hard C and G.'],
      ['Stage 4 — Controlling R + secret vowel', 'Lessons 30–33: AR, OR, ER/IR/UR and Y as a Secret Vowel.'],
      ['Stage 5 — Diphthongs', 'Lessons 34–37: OO, OI/OY, AU/AW, and OU/OW.'],
      ['Stage 6 — J, SHUN + Lazy Sound', 'Lessons 38–40: J Sounds, The SHUN Family, and The Lazy Sound.'],
    ],
    'phonics-advanced': [
      ['Stage 1 — Core rules + digraphs', 'Lessons 1–7: A–Z review, CK, Rabbit, Floss, CH/TCH, SH/TH, WH/PH.'],
      ['Stage 2 — Magic E + vowel teams', 'Lessons 8–14: Magic E families, AI/EE/EA, IE/OA, Monster LE, soft/hard C and G, and secret-vowel Y.'],
      ['Stage 3 — Revision + advanced sound families', 'Lessons 15–20: revision, J sounds, diphthongs, OO/UI, and the SHUN Sound Family.'],
      ['Stage 4 — Controlling R', 'Lessons 21–23: AR, OR, and IR/UR/ER.'],
      ['Stage 5 — Long vowel sound families', 'Lessons 24–28: Long A, E, I, O, and U sound families.'],
      ['Stage 6 — Missing, sleepy + lazy vowel sounds', 'Lessons 29–30: Missing and Sleepy Sounds followed by The Lazy Vowel Mystery.'],
    ],
  };

  for (const [slug, stages] of Object.entries(stageOverrides)) {
    const course = data?.courses?.[slug];
    if (!course || !Array.isArray(course.weeks) || course.weeks.length !== stages.length) {
      throw new Error(`${rel}: ${slug} expected ${stages.length} existing stages`);
    }
    course.weeks = stages.map(([title, focus], index) => ({
      ...course.weeks[index],
      title,
      focus,
      learns: [focus],
      mastery: `Completes the approved ${title.replace(/^Stage \\d+ — /, '')} lessons with guided accuracy.`,
    }));
  }

  write(rel, `${JSON.stringify(data, null, 2)}\n`);
}

patchCourses();
patchStudentProgressEditor();
patchAttendanceForm();
patchStudentListSync();
patchPhonicsMarketingPage();
patchPublicCurriculumOverrides();

console.log('[phonics-curriculum] integration patch completed successfully');
