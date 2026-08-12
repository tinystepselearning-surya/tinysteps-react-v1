import { describe, expect, it } from 'vitest';
import { rankPaymentUsers, type PaymentSearchUser } from '../../pages/admin/paymentUserSearch';

const users: PaymentSearchUser[] = [
  { id: 'p1', displayName: 'Praveen Gali', email: 'gpraveen@tinysteps.com', phoneNormalized: '919999000001' },
  { id: 'p2', displayName: 'Praveen Kumar Mohan', email: 'praveen@tinysteps.com', phoneNormalized: '919999000002' },
  { id: 'p3', displayName: 'Martin Jose Thattil', email: 'mjose@tinysteps.com', phoneNormalized: '919999000003' },
  { id: 'praveen-id', displayName: 'Another Parent', email: 'another@tinysteps.com', phoneNormalized: '919999000004' },
];

describe('rankPaymentUsers', () => {
  it('removes unrelated users and ranks name matches before identifier partials', () => {
    expect(rankPaymentUsers(users, 'praveen').map((user) => user.id)).toEqual(['p1', 'p2', 'praveen-id']);
  });

  it('returns only the exact email tier when an exact email exists', () => {
    expect(rankPaymentUsers(users, 'praveen@tinysteps.com').map((user) => user.id)).toEqual(['p2']);
  });

  it('returns only an exact normalized phone match', () => {
    expect(rankPaymentUsers(users, '+91 99990 00001').map((user) => user.id)).toEqual(['p1']);
  });

  it('returns only an exact ID match when present', () => {
    expect(rankPaymentUsers(users, 'praveen-id').map((user) => user.id)).toEqual(['praveen-id']);
  });

  it('suppresses weaker partials after an exact parent-name match', () => {
    expect(rankPaymentUsers(users, 'Praveen Gali').map((user) => user.id)).toEqual(['p1']);
  });

  it('is case-insensitive and caps broad prefix results', () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      id: `many-${index}`,
      displayName: `Praveen ${String(index).padStart(2, '0')}`,
      email: `parent${index}@example.com`,
    }));
    expect(rankPaymentUsers(many, 'PRAVEEN')).toHaveLength(8);
  });
});
