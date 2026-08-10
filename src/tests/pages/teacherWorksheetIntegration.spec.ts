// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const lessonLibrary = readFileSync(resolve(process.cwd(), 'src/pages/teacher/LessonLibraryPage.tsx'), 'utf8');
const sessionCard = readFileSync(resolve(process.cwd(), 'src/pages/teacher/components/today-sessions/SessionCard.tsx'), 'utf8');

describe('teacher worksheet integration contracts', () => {
  it('keeps worksheet and class-script dialogs in Lesson Library', () => {
    expect(lessonLibrary).toContain('setWorksheetLesson(lesson)');
    expect(lessonLibrary).toContain('setScriptLesson(lesson)');
    expect(lessonLibrary).toContain('Class script');
  });

  it('keeps secure Open Lesson access on createLessonAccessSession', () => {
    expect(lessonLibrary).toContain("'createLessonAccessSession'");
    expect(lessonLibrary).toContain('{ lessonId: lesson.id }');
  });

  it('adds session Resources without changing Start Class or attendance actions', () => {
    expect(sessionCard).toContain('<SessionResourcesDialog');
    expect(sessionCard).toContain('handleStartClass');
    expect(sessionCard).toContain('onMarkAttendance(session)');
  });
});
