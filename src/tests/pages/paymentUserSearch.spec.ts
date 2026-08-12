import { describe, expect, it } from 'vitest';
import { rankPaymentUsers, type PaymentSearchUser } from '../../pages/admin/paymentUserSearch';

const users: PaymentSearchUser[] = [
  { id: 'p1', displayName: 'Praveen Gali', email: 'gpraveen@tinysteps.com', phoneNormalized: '919999000001' },
  { id: 'p2', displayName: 'Praveen Kumar Mohan', email: 'praveen@tinysteps.com', phoneNormalized: '919999000002' },
  { id: 'p3', displayName: 'Martin Jose Thattil', email: 'mjose@tinysteps.com', phoneNormalized: '919999000003' },
  { id: 'praveen-id', displayName: 'Another Parent', email: 'another@tinysteps.com', phoneNormalized: '919999000004' },
];

describe('rankPaymentUsers', () => {
  it('removes unrelated users from active search results', () => {
    expect(rankPaymentUsers(users, 'praveen').map((user) => user.id)).toEqual(['p1', 'p2', 'praveen-id']);
  });

  it('places exact email matches ahead of name-prefix matches', () => {
    expect(rankPaymentUsers(users, 'praveen@tinysteps.com').map((user) => user.id)).toEqual(['p2']);
  });

  it('supports normalized phone matching', () => {
    expect(rankPaymentUsers(users, '+91 99990 00001').map((user) => user.id)).toEqual(['p1']);
  });

  it('places an exact ID match first', () => {
    expect(rankPaymentUsers(users, 'praveen-id').map((user) => user.id)[0]).toBe('praveen-id');
  });
});
