import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/pages/admin/TodaysNotifications.tsx'),
  'utf8',
);

describe('Sessions Management compact updates layout', () => {
  it('keeps the primary Student Updates columns in the requested compact order', () => {
    const tableStart = pageSource.indexOf("mode === 'today'");
    const classTime = pageSource.indexOf('>Class Time</TableHead>', tableStart);
    const student = pageSource.indexOf('>Student</TableHead>', classTime);
    const parent = pageSource.indexOf('>Parent</TableHead>', student);
    const sendMessage = pageSource.indexOf('>Send Message</TableHead>', parent);
    const actions = pageSource.indexOf('>Actions</TableHead>', sendMessage);
    const teacher = pageSource.indexOf('>Teacher</TableHead>', actions);
    const course = pageSource.indexOf('>Course / Subject</TableHead>', teacher);

    expect(classTime).toBeGreaterThan(-1);
    expect(student).toBeGreaterThan(classTime);
    expect(parent).toBeGreaterThan(student);
    expect(sendMessage).toBeGreaterThan(parent);
    expect(actions).toBeGreaterThan(sendMessage);
    expect(teacher).toBeGreaterThan(actions);
    expect(course).toBeGreaterThan(teacher);
  });

  it('puts a direct Notify Parent button beside the parent column', () => {
    expect(pageSource).toContain('>Send Message</TableHead>');
    expect(pageSource).toContain(
      'onClick={() => openWhatsApp(parentPhoneDigits, parentMessage)}',
    );
    expect(pageSource).toContain('Notify Parent');
  });

  it('keeps comprehensive session actions inside the compact Actions dropdown', () => {
    expect(pageSource).toContain('Join Class');
    expect(pageSource).toContain('Copy Teams Link');
    expect(pageSource).toContain('Edit Parent Message');
    expect(pageSource).toContain('Add/Edit Parent Phone');
    expect(pageSource).toContain('Notify Teacher');
    expect(pageSource).toContain('Edit Teacher Message');
    expect(pageSource).toContain('Add/Edit Teacher Phone');
    expect(pageSource).toContain('Cancel Manual Session');
  });

  it('keeps Teacher and Course metadata at the far right of Student Updates', () => {
    const headersStart = pageSource.indexOf('>Send Message</TableHead>');
    const status = pageSource.indexOf('>Session Status</TableHead>', headersStart);
    const type = pageSource.indexOf('>Session Type</TableHead>', status);
    const teacher = pageSource.indexOf('>Teacher</TableHead>', type);
    const course = pageSource.indexOf('>Course / Subject</TableHead>', teacher);

    expect(status).toBeGreaterThan(headersStart);
    expect(type).toBeGreaterThan(status);
    expect(teacher).toBeGreaterThan(type);
    expect(course).toBeGreaterThan(teacher);
  });

  it('collapses each teacher schedule by default behind a native expandable control', () => {
    expect(pageSource).toContain('<details className="group">');
    expect(pageSource).toContain('View schedule');
    expect(pageSource).toContain('</details>');
    expect(pageSource).toContain('min-w-[740px]');
  });

  it('does not add a new read or write path for the compact UI actions', () => {
    const sendStart = pageSource.indexOf(
      'onClick={() => openWhatsApp(parentPhoneDigits, parentMessage)}',
    );
    const sendEnd = pageSource.indexOf('</TableCell>', sendStart);
    const sendSource = pageSource.slice(sendStart, sendEnd);

    expect(sendSource).not.toContain('getDoc(');
    expect(sendSource).not.toContain('getDocs(');
    expect(sendSource).not.toContain('httpsCallable(');
    expect(sendSource).not.toContain('setDoc(');

    const detailsStart = pageSource.indexOf('<details className="group">');
    const detailsEnd = pageSource.indexOf('</details>', detailsStart);
    const detailsSource = pageSource.slice(detailsStart, detailsEnd);

    expect(detailsSource).not.toContain('getDoc(');
    expect(detailsSource).not.toContain('getDocs(');
    expect(detailsSource).not.toContain('httpsCallable(');
    expect(detailsSource).not.toContain('setDoc(');
  });
});
