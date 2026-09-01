import { describe, expect, it } from 'vitest';
import {
  recomputeParentClassAttendanceAuthoritativeBaselines,
} from '../src/helpers/parentClassAttendanceAuthoritativeBaseline';

const NOW = Date.parse('2026-09-01T06:00:00+05:30');

type FakeReadModelRef = {
  kind: 'readModel';
  key: string;
};

type FakeQuery = {
  kind: 'query';
  filters: Array<[string, string, unknown]>;
  limitValue: number;
};

type FakeTransaction = {
  get: (ref: FakeReadModelRef | FakeQuery) => Promise<Record<string, unknown>>;
  set: (ref: FakeReadModelRef, data: Record<string, unknown>, options: Record<string, unknown>) => void;
};

const makeFakeDb = (input: {
  sessionsByTarget: Record<string, Array<Record<string, unknown>>>;
  readModelsByTarget?: Record<string, Record<string, unknown>>;
}) => {
  const operations: string[] = [];
  const writes: Array<{ key: string; data: Record<string, unknown> }> = [];
  let transactionRuns = 0;

  const db = {
    collection: (name: string) => {
      if (name === 'parentMonthlyReadModels') {
        return {
          doc: (parentId: string) => ({
            collection: (childName: string) => {
              if (childName !== 'months') throw new Error(`unexpected child collection ${childName}`);
              return {
                doc: (monthKey: string): FakeReadModelRef => ({
                  kind: 'readModel',
                  key: `${parentId}__${monthKey}`,
                }),
              };
            },
          }),
        };
      }

      if (name === 'classSessions') {
        const filters: Array<[string, string, unknown]> = [];
        const builder = {
          where: (field: string, op: string, value: unknown) => {
            filters.push([field, op, value]);
            return builder;
          },
          limit: (limitValue: number): FakeQuery => ({
            kind: 'query',
            filters: [...filters],
            limitValue,
          }),
        };
        return builder;
      }

      throw new Error(`unexpected collection ${name}`);
    },
    runTransaction: async (
      callback: (tx: FakeTransaction) => Promise<unknown>,
    ): Promise<unknown> => {
      transactionRuns += 1;
      let writeStarted = false;
      const tx: FakeTransaction = {
        get: async (ref) => {
          if (writeStarted) throw new Error('read attempted after transaction write');
          if (ref.kind === 'readModel') {
            operations.push(`get:readModel:${ref.key}`);
            const row = input.readModelsByTarget?.[ref.key];
            return {
              exists: Boolean(row),
              data: () => row || {},
            };
          }

          const parentId = String(
            ref.filters.find(([field, op]) => field === 'parentId' && op === '==')?.[2] || '',
          );
          const startYmd = String(
            ref.filters.find(([field, op]) => field === 'date' && op === '>=')?.[2] || '',
          );
          const monthKey = startYmd.slice(0, 7);
          const key = `${parentId}__${monthKey}`;
          operations.push(`get:query:${key}`);
          const rows = input.sessionsByTarget[key] || [];
          return {
            size: rows.length,
            docs: rows.map((row) => ({ data: () => row })),
          };
        },
        set: (ref, data) => {
          writeStarted = true;
          operations.push(`set:${ref.key}`);
          writes.push({ key: ref.key, data });
        },
      };
      return callback(tx);
    },
  };

  return {
    db,
    operations,
    writes,
    transactionRuns: () => transactionRuns,
  };
};

describe('parent class-attendance authoritative multi-target transaction', () => {
  it('reads both parent/month source sets before writing either baseline', async () => {
    const before = {
      parentId: 'parent-1',
      date: '2026-09-30',
      startAt: '2026-09-30T18:00:00+05:30',
      status: 'scheduled',
      kidId: 'kid-1',
    };
    const oldUnchanged = {
      parentId: 'parent-1',
      date: '2026-09-20',
      status: 'completed',
      kidId: 'kid-old',
    };
    const moved = {
      ...before,
      parentId: 'parent-2',
      date: '2026-10-01',
      startAt: '2026-10-01T18:00:00+05:30',
    };
    const newUnchanged = {
      parentId: 'parent-2',
      date: '2026-10-02',
      status: 'completed',
      kidId: 'kid-new',
    };

    const fake = makeFakeDb({
      sessionsByTarget: {
        'parent-1__2026-09': [oldUnchanged],
        'parent-2__2026-10': [moved, newUnchanged],
      },
    });

    const result = await recomputeParentClassAttendanceAuthoritativeBaselines({
      db: fake.db as never,
      targets: [
        { parentId: 'parent-1', monthKey: '2026-09' },
        { parentId: 'parent-2', monthKey: '2026-10' },
      ],
      authoritativeEventId: 'event-move',
      generatedAtMs: NOW,
    });

    expect(result.mode).toBe('certified');
    if (result.mode !== 'certified') return;
    expect(result.baselines).toHaveLength(2);
    expect(fake.transactionRuns()).toBe(1);
    expect(fake.writes.map((entry) => entry.key).sort()).toEqual([
      'parent-1__2026-09',
      'parent-2__2026-10',
    ]);

    const firstWrite = fake.operations.findIndex((entry) => entry.startsWith('set:'));
    expect(firstWrite).toBe(4);
    expect(fake.operations.slice(0, firstWrite)).toEqual([
      'get:readModel:parent-1__2026-09',
      'get:query:parent-1__2026-09',
      'get:readModel:parent-2__2026-10',
      'get:query:parent-2__2026-10',
    ]);
    expect(fake.operations.slice(firstWrite)).toEqual([
      'set:parent-1__2026-09',
      'set:parent-2__2026-10',
    ]);
  });

  it('fails closed before opening a transaction for duplicate or excessive target sets', async () => {
    const fake = makeFakeDb({ sessionsByTarget: {} });
    const duplicate = await recomputeParentClassAttendanceAuthoritativeBaselines({
      db: fake.db as never,
      targets: [
        { parentId: 'parent-1', monthKey: '2026-09' },
        { parentId: 'parent-1', monthKey: '2026-09' },
      ],
      authoritativeEventId: 'event-duplicate',
      generatedAtMs: NOW,
    });
    expect(duplicate).toEqual({ mode: 'fallback', reason: 'duplicate_authoritative_target' });
    expect(fake.transactionRuns()).toBe(0);

    const excessive = await recomputeParentClassAttendanceAuthoritativeBaselines({
      db: fake.db as never,
      targets: [
        { parentId: 'parent-1', monthKey: '2026-09' },
        { parentId: 'parent-2', monthKey: '2026-09' },
        { parentId: 'parent-3', monthKey: '2026-09' },
      ],
      authoritativeEventId: 'event-excessive',
      generatedAtMs: NOW,
    });
    expect(excessive).toEqual({ mode: 'fallback', reason: 'authoritative_target_cap_exceeded' });
    expect(fake.transactionRuns()).toBe(0);
  });
});
