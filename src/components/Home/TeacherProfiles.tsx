// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

const teachers = [
  {
    name: 'Priya Rangan',
    role: 'Lead Phonics Coach',
    experience: '7+ years',
    quals: 'Cambridge Phonics Certification, B.Ed.',
    focus: 'SATPIN, blending, tricky words'
  },
  {
    name: 'Aaditya Shah',
    role: 'Grammar Expert',
    experience: '6 years',
    quals: 'MA English, CELTA',
    focus: 'Tenses, punctuation, paragraphs'
  },
  {
    name: 'Neha Kapoor',
    role: 'Public Speaking Mentor',
    experience: '8 years',
    quals: 'Speech-Language Pathology, Toastmasters',
    focus: 'Confidence, speech delivery, S.P.E.A.K.'
  }
];

export default function TeacherProfiles() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="gradient-chip mx-auto w-max">Meet our teachers</div>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900">Certified mentors guiding every Tiny Step</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {teachers.map((teacher) => (
            <motion.div
              key={teacher.name}
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tiny-blue-50 to-white p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)] border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-tiny-blue-500 to-tiny-purple-500" />
                <div>
                  <div className="text-xl font-semibold text-gray-900">{teacher.name}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">{teacher.role}</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-700">{teacher.qualifications || teacher.focus}</div>
              <div className="mt-6 grid gap-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Experience</span>
                  <span>{teacher.experience}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Special focus</span>
                  <span className="text-right text-gray-500">{teacher.focus}</span>
                </div>
              </div>
              <motion.div
                className="mt-6 flex items-center justify-between text-xs font-semibold text-tiny-blue-600"
                whileHover={{ x: 4 }}
              >
                View profile <span aria-hidden>→</span>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

