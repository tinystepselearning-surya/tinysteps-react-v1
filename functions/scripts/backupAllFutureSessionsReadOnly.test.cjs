'use strict';
// Offline, read-only tests. No credentials / Firestore connection.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {typedValue, typedFields, typedTimestamp, FORMAT, PROJECT} =
  require('./backupAllFutureSessionsReadOnly.cjs');

test('backup retains canonical project and typed archive format', () => {
  assert.equal(PROJECT, 'tinysteps-react-v1');
  assert.equal(FORMAT, 'TinySteps-Firestore-REST-Typed-FutureSessions-v2');
});

test('Firestore integers, doubles, NaN, infinity, boolean, null and string remain distinct', () => {
  const result = typedFields({
    i: {integerValue: '9007199254740993'},
    d: {doubleValue: 400.125},
    nan: {doubleValue: NaN},
    inf: {doubleValue: Infinity},
    negInf: {doubleValue: -Infinity},
    b: {booleanValue: false},
    z: {nullValue: 0},
    s: {stringValue: 'scheduled'},
  });
  assert.deepEqual(result.i, {integerValue: '9007199254740993'});
  assert.deepEqual(result.d, {doubleValue: 400.125});
  assert.deepEqual(result.nan, {doubleValue: 'NaN'});
  assert.deepEqual(result.inf, {doubleValue: 'Infinity'});
  assert.deepEqual(result.negInf, {doubleValue: '-Infinity'});
  assert.deepEqual(result.b, {booleanValue: false});
  assert.deepEqual(result.z, {nullValue: null});
  assert.deepEqual(result.s, {stringValue: 'scheduled'});
});

test('Firestore timestamps retain nanosecond precision and ISO UTC format', () => {
  assert.equal(typedTimestamp({seconds: '1791693000', nanos: 123456789}),
    '2026-10-11T03:10:00.123456789Z');
  assert.deepEqual(typedValue({timestampValue: {seconds: 0, nanos: 900}}),
    {timestampValue: '1970-01-01T00:00:00.000000900Z'});
});

test('Map, array, document references, blobs and geo values encode without loss', () => {
  const bytes = Buffer.from([0, 127, 255]);
  const typed = typedFields({
    reference: {referenceValue: 'projects/tinysteps-react-v1/databases/(default)/documents/kids/a'},
    blob: {bytesValue: bytes},
    point: {geoPointValue: {latitude: 0, longitude: 0}},
    nested: {mapValue: {fields: {
      attendance: {arrayValue: {values: [
        {booleanValue: true},
        {mapValue: {fields: {childId: {stringValue: 'abc'}}}},
      ]}},
    }}},
  });
  assert.deepEqual(typed.blob, {bytesValue: 'AH//' });
  assert.deepEqual(typed.point, {geoPointValue: {latitude: 0, longitude: 0}});
  assert.equal(typed.reference.referenceValue.endsWith('/kids/a'), true);
  assert.deepEqual(typed.nested.mapValue.fields.attendance.arrayValue.values[0],
    {booleanValue: true});
  assert.deepEqual(typed.nested.mapValue.fields.attendance.arrayValue.values[1],
    {mapValue: {fields: {childId: {stringValue: 'abc'}}}});
});

test('Unknown wire types and incomplete values fail closed rather than silently omitting data', () => {
  assert.throws(() => typedValue({vectorValue: [1,2,3]}), /Unknown or ambiguous/);
  assert.throws(() => typedValue({integerValue: 1, stringValue: '1'}), /Unknown or ambiguous/);
  assert.throws(() => typedFields(null), /Invalid Firestore map fields/);
  assert.throws(() => typedTimestamp({seconds: 'bad', nanos: 0}), /Invalid Firestore timestamp/);
});
