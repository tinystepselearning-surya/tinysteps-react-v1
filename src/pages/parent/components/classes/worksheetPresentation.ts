export const getWorksheetDisplayLesson = (lessonTitle: string): string => {
  const normalized = String(lessonTitle || '').trim();
  const lessonMatch = normalized.match(/\blesson\s*[-–—:]?\s*(\d+)\b/i);

  return lessonMatch ? `Lesson ${Number(lessonMatch[1])}` : normalized || 'Lesson';
};

export const getWorksheetFocusLabel = (lessonTitle: string, worksheetTitle: string): string => {
  const normalizedLesson = String(lessonTitle || '').trim();
  const focusFromLesson = normalizedLesson
    .replace(/\blesson\s*[-–—:]?\s*\d+\b/i, '')
    .replace(/^[\s·•|–—:,-]+/, '')
    .trim();

  return focusFromLesson || String(worksheetTitle || '').trim() || 'Practice worksheet';
};

export const getWorksheetDecorativeLetter = (focusLabel: string): string | null => {
  const match = String(focusLabel || '').trim().match(/^letter\s+([a-z])$/i);
  return match ? match[1].toUpperCase() : null;
};
