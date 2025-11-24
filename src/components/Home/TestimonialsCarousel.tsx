// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Parent of a Grade 2 child',
    city: 'Hyderabad',
    age: 'Grade 2',
    quote:
      '“My daughter now reads boards, packets and storybooks aloud on her own. Her shyness has reduced so much that she even volunteers to answer in school.”',
    video: '/images/hero/parent-video-1.jpg'
  },
  {
    name: 'Parent of a 7-year-old',
    city: 'US time zone',
    age: '7 years',
    quote:
      '“The 1:1 format is a blessing. The teacher knows exactly where my son gets stuck and patiently corrects him without making him feel wrong or slow.”',
    video: '/images/hero/parent-video-2.jpg'
  },
  {
    name: 'Parent of siblings',
    city: 'Singapore',
    age: 'Siblings',
    quote:
      '“Both my kids attend Tiny Steps and I can clearly see the difference—better sentence formation, clearer pronunciation and much more confidence in daily conversations.”',
    video: '/images/hero/parent-video-3.jpg'
  }
];

const Badge = ({ label }: { label: string }) => (
  <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 bg-white/70">{label}</span>
);

export default function TestimonialsCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((prev) => (prev + 1) % testimonials.length), 6000);
    return () => clearInterval(id);
  }, []);

  const testimonial = testimonials[active];

  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="gradient-chip mx-auto w-max">Real Families, Real Results</div>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900">Parent Testimonials</h2>
          <p className="mt-2 text-gray-600">Five-star stories from across the world.</p>
        </div>
        <div className="mt-10 grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl bg-white/90 p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-tiny-blue-500 to-tiny-purple-500" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.city}</div>
                </div>
                <div className="ml-auto text-xs text-gray-600">{testimonial.age}</div>
              </div>
              <div className="mt-4 text-gray-700 leading-relaxed">“{testimonial.quote}”</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge label="Live Coaching" />
                <Badge label="Parent-recommended" />
                <Badge label="★★★★★" />
              </div>
            </motion.div>
          </AnimatePresence>
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-tiny-purple-500 to-tiny-blue-500 p-1 shadow-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 260 }}
          >
            <img src={testimonial.video} alt="Video testimonial" className="h-64 w-full object-cover brightness-90" />
            <motion.button
              className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg"
              whileHover={{ scale: 1.1 }}
            >
              <span className="text-2xl">▶</span>
            </motion.button>
          </motion.div>
        </div>
        <div className="mt-6 flex justify-between">
          <button
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            onClick={() => setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
          >
            Previous
          </button>
          <button
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            onClick={() => setActive((prev) => (prev + 1) % testimonials.length)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

