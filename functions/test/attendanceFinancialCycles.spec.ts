import {describe, expect, it} from 'vitest';
import {
  attendanceFinanceCycle,
  attendanceWalletCycleKeys,
  mayReopenAttendanceVoidedLedgers,
} from '../src/helpers/attendanceFinancialCycles';

function eligible() {
  return {
    sessionId: 'original-class',
    session: {revenueAccrued: false},
    charge: {
      sessionId: 'original-class', source: 'session_present_completed',
      enrollmentId: 'enrollment-a', kidId: 'student-a', teacherId: 'teacher-a',
      status: 'void', amount: 400, voidedAt: 'last-week',
    },
    earning: {
      sessionId: 'original-class', source: 'session_present_completed',
      enrollmentId: 'enrollment-a', kidId: 'student-a', teacherId: 'teacher-a',
      status: 'void', amount: 200, voidedAt: 'last-week',
    },
  };
}

describe('one canonical session with independent attendance-finance cycles', () => {
  it('preserves legacy wallet keys for the first billable interval', () => {
    expect(attendanceFinanceCycle({})).toBe(1);
    expect(attendanceWalletCycleKeys('same-session', {})).toEqual({
      deduction: 'charge_same-session',
      reversal: 'reverse_charge_same-session',
      cycle: 1,
    });
  });

  it('creates unique keys per subsequent legitimate Present interval only', () => {
    const ids = [1, 2, 3].map(cycle => attendanceWalletCycleKeys(
      'same-session', {attendanceFinanceCycle: cycle},
    ));
    expect(ids).toEqual([
      {deduction: 'charge_same-session', reversal: 'reverse_charge_same-session', cycle: 1},
      {deduction: 'charge_same-session_cycle_2', reversal: 'reverse_charge_same-session_cycle_2', cycle: 2},
      {deduction: 'charge_same-session_cycle_3', reversal: 'reverse_charge_same-session_cycle_3', cycle: 3},
    ]);
    expect(new Set(ids.map(x => x.deduction)).size).toBe(3);
    expect(attendanceFinanceCycle({attendanceFinanceCycle: -1})).toBe(1);
  });

  it('restores the live cutover case: old automatic void with no voidReason', () => {
    expect(mayReopenAttendanceVoidedLedgers(eligible())).toBe(true);
  });

  it('supports later explicitly tagged automatic and admin-attendance corrections', () => {
    const input = eligible();
    input.charge.voidSource = 'attendance_status_correction';
    input.earning.voidSource = 'attendance_status_correction';
    expect(mayReopenAttendanceVoidedLedgers(input)).toBe(true);
    delete input.charge.voidSource;
    delete input.earning.voidSource;
    input.charge.voidReason = 'Parent had network trouble';
    input.earning.voidReason = 'Parent had network trouble';
    input.charge.reconciliationSource = 'admin-attendance-correction';
    input.earning.reconciliationSource = 'admin-attendance-correction';
    expect(mayReopenAttendanceVoidedLedgers(input)).toBe(true);
  });

  it('never automatically resurrects a manually voided charge or teacher earning', () => {
    const input = eligible();
    input.charge.voidReason = 'Admin correction: charge manually voided';
    expect(mayReopenAttendanceVoidedLedgers(input)).toBe(false);
    delete input.charge.voidReason;
    input.earning.voidReason = 'Incorrect teacher pay';
    expect(mayReopenAttendanceVoidedLedgers(input)).toBe(false);
  });

  it('protects cash settlements, payout allocations, mismatches, and partial ledgers', () => {
    const paid = eligible();
    paid.charge.paidAmount = 400;
    expect(mayReopenAttendanceVoidedLedgers(paid)).toBe(false);
    delete paid.charge.paidAmount;
    paid.earning.paidAmount = 200;
    expect(mayReopenAttendanceVoidedLedgers(paid)).toBe(false);
    delete paid.earning.paidAmount;
    paid.earning.teacherId = 'another-teacher';
    expect(mayReopenAttendanceVoidedLedgers(paid)).toBe(false);
    paid.earning.teacherId = 'teacher-a';
    paid.session.revenueAccrued = true;
    expect(mayReopenAttendanceVoidedLedgers(paid)).toBe(false);
    paid.session.revenueAccrued = false;
    expect(mayReopenAttendanceVoidedLedgers({...paid, earning: null})).toBe(false);
  });
});
