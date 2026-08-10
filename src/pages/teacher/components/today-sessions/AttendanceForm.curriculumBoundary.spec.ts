import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(__dirname, 'AttendanceForm.tsx'),
  'utf8',
);

describe('AttendanceForm curriculum boundary', () => {
  it('does not read or submit curriculum topic progress', () => {
    expect(source).not.toContain('curriculumTopics');
    expect(source).not.toContain('topicUpdates');
    expect(source).not.toContain('savedTopicProgress');
    expect(source).not.toContain('TopicMastery');
  });

  it('always submits attendance-only metadata', () => {
    expect(source).toContain('attendanceOnly: true');
  });

  it('routes lesson feedback to the dedicated topic progress page', () => {
    expect(source).toContain('/topic-progress?');
    expect(source).toContain('Open Topics & Lesson Feedback');
  });
});
