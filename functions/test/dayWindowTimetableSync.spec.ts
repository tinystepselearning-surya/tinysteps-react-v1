import {describe, expect, it} from 'vitest';
import {Timestamp} from 'firebase-admin/firestore';
import {
  canMutateAutoSession,
  dayWindowSyncWritesEnabled,
  indiaDay,
  planTodayTomorrowForEnrollment,
  syncTodayTomorrowForEnrollment,
} from '../src/scheduling/dayWindowTimetableSync';

type Data = Record<string, any>;
type DocRef = {kind: 'doc'; name: string; id: string; path: string};
type Clause = {field: string; op: string; value: any};
type QueryRef = {kind: 'query'; name: string; clauses: Clause[]; max: number; where: Function; limit: Function};

const base = (): Data => ({
  status: 'active', kidId: 'kid-a', kidIds: ['kid-a'],
  teacherId: 'teacher-a', courseId: 'phonics', currency: 'INR',
  feePerClass: 400, teacherPayPerSession: 175,
  classesStartDateYmd: '2026-10-12',
  schedule: {
    timezone: 'Asia/Kolkata', revision: 4, weeklySlots: [
      {weekday: 1, time: '05:00', durationMinutes: 35},
      {weekday: 2, time: '06:00', durationMinutes: 35},
    ],
  },
});

const NOW = new Date('2026-10-11T18:31:00Z'); // Oct 12, 00:01 IST
const DAY_ONE = 'enrollment-a_20261012_0500';
const DAY_TWO = 'enrollment-a_20261013_0600';

function fakeDb(enrollment = base()) {
  const dbRows = new Map<string, Map<string, Data>>();
  const getCollection = (name: string): Map<string, Data> => {
    if (!dbRows.has(name)) dbRows.set(name, new Map());
    return dbRows.get(name)!;
  };
  getCollection('enrollments').set('enrollment-a', enrollment);
  getCollection('kids').set('kid-a', {status: 'active'});
  let reads = 0;
  function doc(name: string, id: string): DocRef {
    return {kind: 'doc', name, id, path: name + '/' + id};
  }
  function query(name: string, clauses: Clause[] = [], max = 9999): QueryRef {
    return {
      kind: 'query', name, clauses, max,
      where(field: string, op: string, value: unknown) {
        return query(name, [...clauses, {field, op, value}], max);
      },
      limit(next: number) {return query(name, clauses, next);},
    };
  }
  const collection = (name: string) => ({
    doc: (id: string) => doc(name, id),
    where: (field: string, op: string, value: unknown) =>
      query(name, [{field, op, value}]),
  });
  async function runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const actions: Array<() => void> = [];
    const tx = {
      async get(ref: DocRef | QueryRef) {
        reads += 1;
        if (ref.kind === 'doc') {
          const data = getCollection(ref.name).get(ref.id);
          return {id: ref.id, ref, exists: Boolean(data), data: () => data};
        }
        const matches = Array.from(getCollection(ref.name), ([id, data]) => ({id, data}))
          .filter(({data}) => ref.clauses.every(({field, op, value}) => {
            if (op === '==') return data[field] === value;
            if (op === 'in') return value.includes(data[field]);
            throw new Error('Unexpected query operator: ' + op);
          }))
          .slice(0, ref.max);
        return {
          size: matches.length,
          docs: matches.map(({id, data}) => ({
            id, ref: doc(ref.name, id), exists: true, data: () => data,
          })),
        };
      },
      create(ref: DocRef, payload: Data) {
        actions.push(() => {
          if (getCollection(ref.name).has(ref.id)) throw new Error('already exists');
          getCollection(ref.name).set(ref.id, payload);
        });
      },
      update(ref: DocRef, patch: Data) {
        actions.push(() => {
          const prior = getCollection(ref.name).get(ref.id);
          if (!prior) throw new Error('missing update');
          getCollection(ref.name).set(ref.id, {...prior, ...patch});
        });
      },
      delete(ref: DocRef) {
        actions.push(() => { getCollection(ref.name).delete(ref.id); });
      },
    };
    const result = await fn(tx);
    for (const action of actions) action();
    return result;
  }
  return {
    client: {collection, runTransaction} as any,
    rows: getCollection,
    get reads() {return reads;},
  };
}

const sync = (fake: ReturnType<typeof fakeDb>, options: {
  now?: Date; expectedRevision?: number; enabled?: boolean;
} = {}) => syncTodayTomorrowForEnrollment({
  db: fake.client, enrollmentId: 'enrollment-a',
  actorId: 'test-admin', now: NOW, enabled: true, ...options,
});

describe('student timetable Today/Tomorrow synchronization', () => {
  it('is off by default and performs zero Firestore reads until enabled', async () => {
    expect(dayWindowSyncWritesEnabled({})).toBe(false);
    expect(dayWindowSyncWritesEnabled({TIMETABLE_DAY_SYNC_ENABLED: 'true'})).toBe(true);
    const fake = fakeDb();
    const result = await sync(fake, {enabled: false});
    expect(result.state).toBe('disabled');
    expect(fake.reads).toBe(0);
  });

  it('applies the October 12 cutoff, IST midnight, and the correct two dates', async () => {
    expect(indiaDay(new Date('2026-10-11T18:31:00Z'))).toBe('2026-10-12');
    expect(indiaDay(new Date('2026-10-12T18:31:00Z'))).toBe('2026-10-13');
    const fake = fakeDb();
    await expect(sync(fake, {now: new Date('2026-10-11T12:00:00Z')}))
      .rejects.toThrow('before October 12');
    expect(fake.reads).toBe(0);
  });

  it('creates exactly Oct 12 and 13 and idempotently preserves them on retry', async () => {
    const fake = fakeDb();
    const first = await sync(fake);
    expect(first).toMatchObject({state: 'synchronized', created: 2, updated: 0, removed: 0});
    expect(first.targetDays).toEqual(['2026-10-12', '2026-10-13']);
    const sessions = fake.rows('classSessions');
    expect([...sessions.keys()].sort()).toEqual([DAY_ONE, DAY_TWO]);
    expect(sessions.get(DAY_ONE)?.source).toBe('rolling_schedule');
    expect(sessions.get(DAY_ONE)?.billingRateSnapshot).toBe(400);
    expect(sessions.get(DAY_ONE)?.teacherPayRateSnapshot).toBe(175);
    expect(sessions.get(DAY_ONE)?.startAt.toDate().toISOString()).toBe('2026-10-11T23:30:00.000Z');
    const second = await sync(fake);
    expect(second).toMatchObject({created: 0, updated: 0, removed: 0, preserved: 2});
  });

  it('moves tomorrow and today slots after edits without touching other dates', async () => {
    const fake = fakeDb();
    await sync(fake);
    fake.rows('classSessions').set('historical-20261011', {
      enrollmentId: 'enrollment-a', date: '2026-10-11', source: 'rolling_schedule',
      status: 'present', attendance: 'present', startAt: Timestamp.fromDate(NOW),
    });
    fake.rows('enrollments').get('enrollment-a')!.schedule = {
      revision: 5, timezone: 'Asia/Kolkata',
      weeklySlots: [
        {weekday: 1, time: '07:00', durationMinutes: 40},
        {weekday: 2, time: '08:00', durationMinutes: 35},
      ],
    };
    const result = await sync(fake, {expectedRevision: 5});
    expect(result).toMatchObject({created: 2, removed: 2, updated: 0});
    expect([...fake.rows('classSessions').keys()].sort()).toEqual([
      'enrollment-a_20261012_0700',
      'enrollment-a_20261013_0800',
      'historical-20261011',
    ]);
  });

  it('updates duration and teacher in place without overwriting other session state', async () => {
    const fake = fakeDb();
    await sync(fake);
    const initial = fake.rows('classSessions').get(DAY_ONE)!;
    initial.customAuditMarker = 'preserve-me';
    const origCreatedAt = initial.createdAt;
    const enrollment = fake.rows('enrollments').get('enrollment-a')!;
    enrollment.schedule.revision = 5;
    enrollment.schedule.weeklySlots[0].durationMinutes = 40;
    enrollment.teacherId = 'teacher-b';
    const result = await sync(fake, {expectedRevision: 5});
    expect(result.updated).toBe(2);
    const updated = fake.rows('classSessions').get(DAY_ONE)!;
    expect(updated.durationMins).toBe(40);
    expect(updated.teacherId).toBe('teacher-b');
    expect(updated.customAuditMarker).toBe('preserve-me');
    expect(updated.createdAt).toBe(origCreatedAt);
    expect(updated.status).toBe('scheduled');
  });

  it('removes only untouched unstarted automatic sessions when paused', async () => {
    const fake = fakeDb();
    await sync(fake);
    fake.rows('enrollments').get('enrollment-a')!.status = 'paused';
    const removed = await sync(fake);
    expect(removed).toMatchObject({created: 0, removed: 2});
    expect(fake.rows('classSessions').size).toBe(0);
  });

  it('retains attendance, finance-linked, cancelled, manual and past sessions', async () => {
    const fake = fakeDb();
    await sync(fake);
    fake.rows('classSessions').get(DAY_ONE)!.attendance = {status: 'present'};
    fake.rows('billingCharges').set(DAY_TWO, {amount: 400});
    fake.rows('enrollments').get('enrollment-a')!.status = 'paused';
    const result = await sync(fake);
    expect(result.removed).toBe(0);
    expect(result.preserved).toBe(2);
    expect(fake.rows('classSessions').has(DAY_ONE)).toBe(true);
    expect(fake.rows('classSessions').has(DAY_TWO)).toBe(true);

    expect(canMutateAutoSession({
      enrollmentId: 'enrollment-a', nowMs: NOW.getTime(), externallyFinanceLinked: false,
      session: {...fake.rows('classSessions').get(DAY_ONE), attendance: null, source: 'manual'},
    })).toBe(false);
    expect(canMutateAutoSession({
      enrollmentId: 'enrollment-a', nowMs: NOW.getTime(), externallyFinanceLinked: false,
      session: {...fake.rows('classSessions').get(DAY_ONE), attendance: null, status: 'cancelled'},
    })).toBe(false);
    expect(canMutateAutoSession({
      enrollmentId: 'enrollment-a', nowMs: NOW.getTime(),
      externallyFinanceLinked: false,
      session: {...fake.rows('classSessions').get(DAY_ONE), attendance: null,
        startAt: Timestamp.fromMillis(NOW.getTime() - 60000)},
    })).toBe(false);
  });

  it('does not generate for inactive students or a past start time', async () => {
    const fake = fakeDb();
    fake.rows('kids').get('kid-a')!.status = 'inactive';
    expect((await sync(fake)).created).toBe(0);
    fake.rows('kids').get('kid-a')!.status = 'active';
    const afterStart = new Date('2026-10-11T23:31:00Z');
    const result = await sync(fake, {now: afterStart});
    expect(result.created).toBe(1);
    expect(fake.rows('classSessions').has(DAY_ONE)).toBe(false);
    expect(fake.rows('classSessions').has(DAY_TWO)).toBe(true);
  });

  it('never recreates a cancelled deterministic session', async () => {
    const fake = fakeDb();
    await sync(fake);
    fake.rows('classSessions').get(DAY_ONE)!.status = 'cancelled';
    const retry = await sync(fake);
    expect(retry.created).toBe(0);
    expect(fake.rows('classSessions').get(DAY_ONE)?.status).toBe('cancelled');
  });

  it('does not create a competing recurring class where a manual class exists', async () => {
    const fake = fakeDb();
    fake.rows('classSessions').set('manual-existing', {
      enrollmentId: 'other', kidId: 'kid-a', date: '2026-10-12',
      startTime: '05:00', source: 'manual', isManual: true,
      status: 'scheduled', startAt: Timestamp.fromMillis(NOW.getTime() + 60000),
    });
    const result = await sync(fake);
    expect(result.created).toBe(1);
    expect(result.conflicts).toBe(1);
    expect(fake.rows('classSessions').has(DAY_ONE)).toBe(false);
    expect(fake.rows('classSessions').has(DAY_TWO)).toBe(true);
  });

  it('refuses a superseded save without making session changes', async () => {
    const fake = fakeDb();
    await expect(sync(fake, {expectedRevision: 3})).rejects.toThrow('changed again');
    expect(fake.rows('classSessions').size).toBe(0);
  });

  it('prepares all writes after validating fee; incomplete finances write nothing', async () => {
    const fake = fakeDb();
    fake.rows('enrollments').get('enrollment-a')!.feePerClass = 0;
    await expect(sync(fake)).rejects.toThrow('positive billing rate');
    expect(fake.rows('classSessions').size).toBe(0);
  });

  it('pure plan only contains future Today/Tomorrow slots and no 14-day horizon', () => {
    const planned = planTodayTomorrowForEnrollment({
      enrollmentId: 'enrollment-a', enrollment: base(),
      todayYmd: '2026-10-12', nowMs: NOW.getTime(), activeChild: true,
    });
    expect(planned.map((p) => p.date)).toEqual(['2026-10-12', '2026-10-13']);
    expect(planned.every((p) => p.startAtUtcMs > NOW.getTime())).toBe(true);
    expect(planTodayTomorrowForEnrollment({
      enrollmentId: 'enrollment-a', enrollment: base(),
      todayYmd: '2026-10-12', nowMs: NOW.getTime(), activeChild: false,
    })).toEqual([]);
  });
});
