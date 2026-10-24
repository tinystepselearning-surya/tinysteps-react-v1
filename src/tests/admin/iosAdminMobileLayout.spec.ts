import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const header = read('src/pages/admin/components/Header.tsx');
const css = read('src/index.css');
const users = read('src/pages/admin/UserManagement/UserList.tsx');
const students = read('src/pages/admin/StudentManagement/StudentList.tsx');
const monthClose = read('src/pages/admin/components/AttendanceValidationMonthlyTracker.tsx');

describe('iOS Admin safe area and compact scroll layouts', () => {
  it('places Admin/Founder logout below the native iPhone status bar', () => {
    expect(header).toContain('ts-native-header-safe sticky top-0');
    expect(header).toContain('onClick={handleLogout}');
    expect(css).toContain('html.ts-capacitor-native .ts-native-header-safe');
    expect(css).toContain('padding-top: calc(var(--ts-safe-top) + 0.5rem)');
  });

  it('uses paged vertical phone user cards while retaining desktop role-scoped actions', () => {
    expect(users).toContain('aria-label="User management mobile cards"');
    expect(users).toContain('grid min-w-0 gap-3 p-3 md:hidden');
    expect(users).toContain('hidden overflow-x-auto md:block');
    expect(users).toContain('renderUserActions(user)');
    expect(users).toContain('Sort users by');
    expect(users).toContain('min-h-11 items-center gap-1 md:min-h-8');
    expect(users).toContain('onResetPassword(user)');
    expect(users).toContain('onArchive(user)');
    expect(users).toContain('onReactivate(user)');
    expect(users).toContain('onDelete(user)');
    expect(users).toContain("window.matchMedia?.('(max-width: 767px)').matches");
    expect(users).toContain('? 25');
  });

  it('makes Month Close a single-column mobile workflow without changing stored finance facts', () => {
    expect(monthClose).toContain('aria-label="Month close parent cards"');
    expect(monthClose).toContain('md:hidden');
    expect(monthClose).toContain('hidden max-h-[470px] overflow-auto rounded-lg border md:block');
    expect(monthClose).toContain('parentMonthCloseNextActionLabel(nextAction)');
    expect(monthClose).toContain('parentMonthClosePaymentLabel(billing)');
    expect(monthClose).toContain('onClick={() => void openParent(parent.id)}');
  });

  it('shows mobile student and parent data with enrollment and row actions', () => {
    expect(students).toContain('aria-label="Student management mobile cards"');
    expect(students).toContain('grid min-w-0 grid-cols-2');
    expect(students).toContain('hidden max-h-[62vh] overflow-auto md:block');
    expect(students).toContain('onClick={() => setEnrollmentDetailsFor(student)}');
    expect(students).toContain('onClick={() => setActionsFor(student)}');
    expect(students).toContain('Showing {filtered.length} students');
  });
});
