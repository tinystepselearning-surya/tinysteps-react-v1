import * as admin from 'firebase-admin';
import {expect, test, type Page} from '@playwright/test';

/**
 * Actual Chrome UI acceptance with the LIVE source components and disposable
 * Firebase Auth, Firestore and Functions emulators. Does not make a public
 * preview, access production data, or follow external Teams destinations.
 */
const PROJECT = 'demo-tinysteps-calendar-test';
const TEACHER_UID = 'stage2-browser-teacher';
const PARENT_UID = 'stage2-browser-parent';
const KID_ID = 'stage2-browser-kid';
const ENROLLMENT_ID = 'stage2-browser-enrollment';
const DATE = '2026-10-12'; // Monday after the controlled 2026-10-11 clock
const PASSWORD = 'BrowserEmulatorOnly_2026!';
const TEACHER_EMAIL = 'stage2-teacher@example.test';
const PARENT_EMAIL = 'stage2-parent@example.test';

function assertDemoOnly() {
  const keys: Record<string, string> = {
    GCLOUD_PROJECT: PROJECT,
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085',
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
    FUNCTIONS_EMULATOR_HOST: '127.0.0.1:5001',
    VITE_FIREBASE_PROJECT_ID: PROJECT,
    VITE_USE_AUTH_EMULATOR: 'true',
    VITE_USE_FIRESTORE_EMULATOR: 'true',
    VITE_USE_FUNCTIONS_EMULATOR: 'true',
    VIRTUAL_CALENDAR_ATTENDANCE_ENABLED: 'true',
  };
  for (const [key, required] of Object.entries(keys)) {
    if (process.env[key] !== required) {
      throw new Error('Stage 2 denied: ' + key + ' must equal ' + required);
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_TOKEN ||
    (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_PROJECT !== PROJECT)) {
    throw new Error('Stage 2 forbids real project credentials');
  }
}
assertDemoOnly();

const app = admin.apps.find(a => a?.name === 'stage2-browser') ||
  admin.initializeApp({projectId: PROJECT}, 'stage2-browser');
const db = app.firestore();
const auth = app.auth();

test.beforeAll(async () => {
  await Promise.all([
    auth.createUser({uid: TEACHER_UID, email: TEACHER_EMAIL, password: PASSWORD,
      displayName: 'Stage Two Teacher'}),
    auth.createUser({uid: PARENT_UID, email: PARENT_EMAIL, password: PASSWORD,
      displayName: 'Stage Two Parent'}),
  ]);
  await Promise.all([
    auth.setCustomUserClaims(TEACHER_UID, {role: 'teacher'}),
    auth.setCustomUserClaims(PARENT_UID, {role: 'parent'}),
  ]);
  await Promise.all([
    db.collection('users').doc(TEACHER_UID).set({
      role: 'teacher', status: 'active', email: TEACHER_EMAIL,
      displayName: 'Stage Two Teacher', fullName: 'Stage Two Teacher',
    }),
    db.collection('users').doc(PARENT_UID).set({
      role: 'parent', status: 'active', email: PARENT_EMAIL,
      displayName: 'Stage Two Parent', fullName: 'Stage Two Parent',
    }),
    db.collection('kids').doc(KID_ID).set({
      fullName: 'Browser Test Child', name: 'Browser Test Child', status: 'active',
      parentId: PARENT_UID, parentIds: [PARENT_UID], studentId: KID_ID,
    }),
    db.collection('enrollments').doc(ENROLLMENT_ID).set({
      kidId: KID_ID, kidIds: [KID_ID], studentId: KID_ID, childId: KID_ID,
      studentName: 'Browser Test Child', kidName: 'Browser Test Child',
      teacherId: TEACHER_UID, teacherName: 'Stage Two Teacher',
      parentId: PARENT_UID, parentIds: [PARENT_UID],
      courseId: 'phonics-foundations', courseName: 'Phonics Foundations',
      status: 'active', classesStartDateYmd: '2026-01-01',
      schedule: {
        timezone: 'Asia/Kolkata', revision: 1,
        weeklySlots: [{weekday: 1, time: '17:00', durationMinutes: 35}],
      },
      ratePerSession: 400, feePerClass: 400,
      teacherPayPerSession: 175, currency: 'INR',
      creditsRemaining: 12, creditsUsed: 3,
      meetingLink: 'https://teams.microsoft.com/l/meetup-join/STAGE2-EMULATOR-ONLY',
    }),
  ]);
});

test.afterAll(async () => {
  await app.delete();
});

test.beforeEach(async ({page}) => {
  // Deterministic virtual-day navigation; no dependence on runner timezone/date.
  await page.clock.install({time: new Date('2026-10-11T10:00:00+05:30')});
  // Even if a component accidentally initializes a second Firebase client,
  // no network request to production/analytics/storage can leave this browser.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return route.continue();
    }
    return route.abort('blockedbyclient');
  });
});

async function login(page: Page, role: 'teacher'|'parent') {
  const email = role === 'teacher' ? TEACHER_EMAIL : PARENT_EMAIL;
  await page.goto('/' + role + '/login', {waitUntil: 'domcontentloaded'});
  await page.getByRole('textbox', {name: /Email, username, or phone number/i})
    .fill(email);
  await page.locator('input[type=password]').fill(PASSWORD);
  await page.getByRole('button', {name: /^Sign In$/i}).click();
  await expect.poll(() => page.url(), {timeout: 35_000})
    .toMatch(new RegExp('/' + role + '(?:\\?|$)'));
}

test('teacher Day View shows next-day virtual timetable without writing a session', async ({page}) => {
  await login(page, 'teacher');
  await page.goto('/teacher?tab=schedule');
  await expect(page.getByRole('heading', {name: 'Teacher Schedule'}))
    .toBeVisible({timeout: 25_000});
  await expect(page.getByText('No bookings for this day')).toBeVisible();
  await page.getByRole('button', {name: 'Next', exact: true}).click();
  await expect(page.getByText('Browser Test Child')).toBeVisible({timeout: 30_000});
  await expect(page.getByRole('button', {name: 'Join Teams'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Mark Present / Absent'})).toBeVisible();
  const classes = await db.collection('classSessions').where('date', '==', DATE).get();
  expect(classes.docs.filter(d => d.data().kidId === KID_ID)).toHaveLength(0);
});

test('parent Classes view displays matching upcoming class from enrollment timetable', async ({page}) => {
  await login(page, 'parent');
  await page.goto('/parent?tab=classes');
  await expect(page.getByTestId('parent-classes-view')).toBeVisible({timeout: 30_000});
  const sessionClaims = page.getByText('Phonics Foundations');
  await expect(sessionClaims.first()).toBeVisible({timeout: 30_000});
  await expect(page.getByText('Stage Two Teacher').first()).toBeVisible();
  const classes = await db.collection('classSessions').where('date', '==', DATE).get();
  expect(classes.docs.filter(d => d.data().kidId === KID_ID)).toHaveLength(0);
});
