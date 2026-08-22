import { describe, expect, it } from 'vitest';

import {
  getWorksheetDecorativeLetter,
  getWorksheetDisplayLesson,
  getWorksheetFocusLabel,
} from '../../../pages/parent/components/classes/worksheetPresentation';

describe('worksheet presentation helpers', () => {
  it.each([
    ['Lesson-2', 'Lesson 2'],
    ['Lesson-10', 'Lesson 10'],
    ['Lesson 11', 'Lesson 11'],
  ])('presents %s as %s without changing stored data', (stored, displayed) => {
    expect(getWorksheetDisplayLesson(stored)).toBe(displayed);
  });

  it('uses a descriptive lesson suffix before the worksheet title', () => {
    expect(getWorksheetFocusLabel('Lesson 6 · Digraphs — sh and th', 'Practice sheet')).toBe('Digraphs — sh and th');
    expect(getWorksheetFocusLabel('Lesson-2', 'Letter A')).toBe('Letter A');
  });

  it.each([
    ['Letter A', 'A'],
    ['Letter S', 'S'],
    ['Magic E', null],
    ['Letter SH', null],
  ])('derives the decorative letter for %s', (label, letter) => {
    expect(getWorksheetDecorativeLetter(label)).toBe(letter);
  });
});
