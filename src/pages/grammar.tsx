import React from 'react';
import Layout from '@components/Layout';
import CourseTopbar from '@components/CourseTopbar';

export default function GrammarPage() {
  return (
    <Layout>
      <CourseTopbar title="Grammar & Writing Lab" subtitle="Practical grammar lessons and writing practice that grow strong writers." />
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-2xl font-semibold mb-2">Grammar Level 1</h3>
              <p className="text-sm text-gray-600 mb-3">Nouns, verbs, simple sentence building and punctuation.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-2xl font-semibold mb-2">Grammar Level 2</h3>
              <p className="text-sm text-gray-600 mb-3">Tenses, agreement, and paragraph structure with editing drills.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-2xl font-semibold mb-2">Creative Writing</h3>
              <p className="text-sm text-gray-600 mb-3">Story mapping, hooks, and writing with voice—peer-reviewed in class.</p>
            </div>
          </div>

          <div className="mt-8">
            <a href="#book-trial" className="inline-block rounded-xl bg-blue-600 text-white px-6 py-3">Book a Free Trial</a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
