import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectSoft404Prerender } from '../soft404-prerender-policy.mjs';

const substantialText = 'A helpful course page explains placement and course pathways. '.repeat(5);

test('accepts substantial public content', () => {
  assert.deepEqual(inspectSoft404Prerender({
    title: 'English Courses for Kids | Tiny Steps',
    headings: ['Find the right English course'],
    rootText: substantialText,
  }), []);
});

test('rejects missing content, including the app root', () => {
  assert.match(inspectSoft404Prerender({ title: 'Courses', headings: ['Courses'] })[0], /missing/);
  assert.match(inspectSoft404Prerender({ title: 'Courses', headings: ['Courses'], rootText: 'Loading' })[0], /too thin/);
});

test('rejects not-found/error pages even when they include substantial content', () => {
  const signals = inspectSoft404Prerender({
    title: '404 - Page Not Found | Tiny Steps',
    headings: ['Page not found'],
    rootText: substantialText,
  });
  assert.ok(signals.some((message) => message.includes('not-found/error')));
});

test('does not penalize ordinary articles mentioning a 404 later in the title', () => {
  assert.deepEqual(inspectSoft404Prerender({
    title: 'How to handle a 404 link | Tiny Steps',
    headings: ['A practical guide for parents'],
    rootText: substantialText,
  }), []);
});
