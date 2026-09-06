import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const contact = read('src/pages/ContactPage.tsx');
const bookDemo = read('src/pages/public/BookDemoPage.tsx');
const header = read('src/components/common/Header.tsx');
const registry = read('src/lib/routeSeoRegistry.js');

describe('Contact and book-demo intent separation', () => {
  it('keeps /contact focused on support rather than duplicating the assessment form', () => {
    expect(contact).toContain("getRouteConfig('/contact')");
    expect(contact).toContain('How Can We Help?');
    expect(contact).toContain('Admissions & New Enrolments');
    expect(contact).toContain('Existing Parent Support');
    expect(contact).toContain('School Partnerships');
    expect(contact).toContain('Contact & Support FAQs');
    expect(contact).toContain('to="/book-demo"');
    expect(contact).toContain('data-no-booking-intercept="1"');

    expect(contact).not.toContain('PublicAssessmentForm');
    expect(contact).not.toContain('BookAssessmentForm');
    expect(contact).not.toContain('TestimonialSnippets');
  });

  it('keeps /book-demo focused on assessment conversion and parent decision support', () => {
    expect(bookDemo).toContain('PublicAssessmentForm');
    expect(bookDemo).toContain('Book One Free 35-Minute Demo Assessment Class');
    expect(bookDemo).toContain('What Happens in the Demo Assessment?');
    expect(bookDemo).toContain('What Will You Understand After the Assessment?');
    expect(bookDemo).toContain('Before You Enrol');
    expect(bookDemo).toContain('Watch Class Samples');
    expect(bookDemo).toContain('to="/class-samples"');
  });

  it('makes the global book-demo CTA scroll to the form instead of opening a suppressed modal', () => {
    expect(header).toContain("if (location.pathname === '/book-demo')");
    expect(header).toContain("document.getElementById('assessment-form')");
    expect(header).toContain('window.scrollTo({');
  });

  it('gives the two indexable routes distinct build-time metadata', () => {
    expect(registry).toContain("title: 'Contact Tiny Steps Learning | Admissions & Parent Support'");
    expect(registry).toContain(
      "title: 'Book a Free 35-Minute Demo Assessment Class | Tiny Steps Learning'",
    );
    expect(registry).toContain("canonicalPath: '/contact'");
    expect(registry).toContain("canonicalPath: '/book-demo'");
  });
});
