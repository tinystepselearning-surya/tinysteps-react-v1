// @ts-nocheck
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const testimonials = [
  // PHONICS
  {
    name: "Asha R. (Parent of a 5-year-old)",
    city: "Hyderabad",
    age: "5 years",
    focusArea: "Phonics • Blending",
    quote:
      "My son used to guess words. After a few weeks, he started sounding out and blending on his own. The games and small daily practice really helped.",
    video: "/images/hero/parent-video-1.jpg",
  },
  {
    name: "Meera J. (Moved from India)",
    city: "Toronto, Canada",
    age: "6 years",
    focusArea: "Phonics • CVC Words",
    quote:
      "We recently moved, and I wanted consistent learning. The teacher is patient and structured. Now my child can read simple CVC words and is improving every week.",
    video: "/images/hero/parent-video-2.jpg",
  },

  // GRAMMAR
  {
    name: "Priyanka M. (Parent of an 8-year-old)",
    city: "Pune",
    age: "8 years",
    focusArea: "Grammar • Tenses",
    quote:
      "My daughter was making basic tense mistakes. Now she understands when to use is/are/was/were and writes cleaner sentences.",
    video: "/images/hero/parent-video-3.jpg",
  },
  {
    name: "Farah L. (Parent of a 9-year-old)",
    city: "Singapore",
    age: "9 years",
    focusArea: "Grammar • Writing",
    quote:
      "The lessons are clear and not overwhelming. My son’s punctuation and sentence structure improved, and he’s more confident in school writing.",
    video: "/images/hero/parent-video-4.jpg",
  },

  // PUBLIC SPEAKING
  {
    name: "Divya N. (Parent of a 7-year-old)",
    city: "Mumbai",
    age: "7 years",
    focusArea: "Speaking • Confidence",
    quote:
      "My child was shy on camera. Now he introduces himself clearly and speaks in full sentences. The roleplays are simple and effective.",
    video: "/images/hero/parent-video-5.jpg",
  },
  {
    name: "Sanjay P. (Parent of a 10-year-old)",
    city: "Delhi",
    age: "10 years",
    focusArea: "Speaking • Presentations",
    quote:
      "We saw a big change in expression and fluency. She learned how to start, continue, and end a topic without getting stuck. Very helpful for school presentations.",
    video: "/images/hero/parent-video-6.jpg",
  },
];

const Badge = ({ label }: { label: string }) => (
  <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 bg-white/70">
    {label}
  </span>
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
              key={`${testimonial.name}-${active}`}
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

              <div className="mt-4 text-gray-700 leading-relaxed">{testimonial.quote}</div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge label={testimonial.focusArea} />
                <Badge label="Live Coaching" />
                <Badge label="Parent-recommended" />
                <Badge label="★★★★★" />
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-tiny-purple-500 to-tiny-blue-500 p-1 shadow-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 260 }}
          >
            <img
              src={testimonial.video}
              alt="Video testimonial"
              className="h-64 w-full object-cover brightness-90"
            />
            <motion.button
              className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg"
              whileHover={{ scale: 1.1 }}
              type="button"
            >
              <span className="text-2xl">▶</span>
            </motion.button>
          </motion.div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            onClick={() => setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            type="button"
          >
            Previous
          </button>
          <button
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            onClick={() => setActive((prev) => (prev + 1) % testimonials.length)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
