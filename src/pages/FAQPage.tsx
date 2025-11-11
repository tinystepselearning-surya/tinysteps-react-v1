// @ts-nocheck
import React, { useEffect } from 'react';
import FAQAccordion, { FAQItem } from '../components/FAQ/FAQAccordion';
import Meta from '../components/common/Meta';

const items: FAQItem[] = [
  { id: 'q1', category: 'phonics', question: 'How to teach phonics to my child at home?', answer: 'Start with sound recognition (not letter names). Use SATPIN sequence first, then blend into words like sat/pin/tap. Keep sessions short (10–15 minutes) and playful with games rather than worksheets. Best age: 3–4. Common mistake: teaching letter names first.' , relatedBlog: '/blog/parents-guide-phonics', relatedCourse: '/courses' },
  { id: 'q2', category: 'phonics', question: "Why can't my child blend sounds even though he knows phonics?", answer: 'Blending is a separate skill from recognizing sounds. Teach slow blending (c—a—t) then fast blending (cat). Expect 4–6 weeks to master. Practice with CVC Builder and minimal pairs. We target this in Week 4 explicitly.', relatedBlog: '/blog/why-blending-is-hard', relatedCourse: '/courses' },
  { id: 'q3', category: 'phonics', question: 'What is the difference between phonics and sight words?', answer: 'Phonics decodes using rules (c‑a‑t); sight words are memorized exceptions (the, was). Start with phonics since ~70% of words are decodable, then add sight words. Our curriculum teaches tricky words in Week 12.', relatedBlog: '/blog/phonics-vs-sight-words', relatedCourse: '/courses' },
  { id: 'q4', category: 'phonics', question: 'My 7-year-old struggles with reading. Is it too late for phonics?', answer: 'Not too late. With intensive phonics and gap analysis, 8–12 weeks usually closes core gaps. We identify specific needs (sounds, blending, long vowels) and focus there. Consistency drives a 95%+ success rate.' },
  { id: 'q5', category: 'phonics', question: "How do I teach tricky words like 'said', 'come', 'there'?", answer: 'Use spaced repetition and context. Pair with rhyming (said/paid), use in sentences, daily for 2 weeks then weekly refresh. We teach 40+ tricky words across levels with games and applied reading.' },
  { id: 'q6', category: 'phonics', question: 'Should my child learn phonics before starting school?', answer: 'Optional but helpful. A 12‑week foundation course 6 months prior to school builds confidence. Start with SATPIN sounds and 10‑minute daily practice.' },
  { id: 'q7', category: 'phonics', question: 'My child can read but has no comprehension. Why?', answer: 'Decoding ≠ comprehension. If most effort goes into sounding out, little is left for understanding. Build fluency and add comprehension questions. Our Advanced Phonics ends with 150–300‑word passages + Q&A.' },
  { id: 'q8', category: 'grammar', question: 'How to teach grammar to kids without boring them?', answer: 'Use games (Sentence Dice, Grammar Bingo, Picture prompts) and “mistakes games” instead of lectures. We keep sessions ~70% active practice, 30% instruction.' },
  { id: 'q9', category: 'grammar', question: "My child mixes up 'is' and 'are'. How do I explain?", answer: 'One person = is; multiple = are. Use visuals: 1 stick figure → is; 3 figures → are. We target this in Basic Grammar Week 10 with concrete‑to‑abstract scaffolding.' },
  { id: 'q10', category: 'grammar', question: 'When should children learn tenses? Is my 5-year-old too young?', answer: 'Ages 5–6: simple tenses (played/plays/will play). Ages 8+: complex tenses. We cover simple in Basic Weeks 3–4 and all 12 tenses in Advanced Weeks 1–4.' },
  { id: 'q11', category: 'grammar', question: 'How to stop grammar mistakes in writing?', answer: 'Internalize via output. Have child rewrite own sentences correctly, do peer editing games, and daily short writing. Our levels progress from sentences → paragraphs → stories with mastery checks.' },
  { id: 'q12', category: 'grammar', question: "My 8-year-old speaks well but can't write sentences. Why?", answer: 'Speaking and writing are different skills. Bridge with “speak first, write second”: record, then transcribe. Our Grammar path uses Speak → Write progression to reduce friction.' },
  { id: 'q13', category: 'speaking', question: 'My child is too shy to speak in public. How can I help?', answer: 'Start small with 15‑second safe talks at home, then expand. Celebrate effort, not perfection. Our first 2–3 weeks focus on confidence only. 90% of shy kids become confident in 8 weeks.' },
  { id: 'q14', category: 'speaking', question: 'How do I encourage class participation?', answer: 'At home, ask open‑ended questions and let them ramble. Praise participation over correctness. We teach S.P.E.A.K. habits that generalize to classrooms within 4–6 weeks.' },
  { id: 'q15', category: 'speaking', question: "How long should a child's speech be?", answer: 'Ages 4–7: 15–45s. Ages 7–10: 60–120s. Ages 10+: 3–5 minutes. We never force length; we scaffold duration across levels.' },
  { id: 'q16', category: 'speaking', question: 'My child mumbles and speaks too fast. How to slow down?', answer: 'Treat clarity and pace separately. Mirror pronunciation for mumbling; teach pause gestures to slow pace. Our Advanced Week 10 focuses on vocal variety + pacing.' },
  { id: 'q17', category: 'speaking', question: 'How to lose the Indian accent?', answer: 'Accent isn’t a problem—clarity is. Target unclear sounds (R/L/TH/W‑V). We train clarity + rhythm; accent shifts naturally with exposure.' },
  { id: 'q18', category: 'speaking', question: 'Nervous during presentations—any tips?', answer: 'Practice 5+ times, know content, breathe (3 deep breaths), focus on 1 friendly face. Our capstones start low‑pressure with teacher + parent before larger settings.' },
  { id: 'q19', category: 'online', question: 'Is online learning as good as offline?', answer: 'For English, 1:1 online often outperforms batch offline: personalization, recordings, flexibility, global teachers. Offline offers socialization. For serious skill gains, 1:1 online wins.' },
  { id: 'q20', category: 'online', question: 'How do I ensure my child is actually learning online?', answer: 'Demand transparency: weekly reports, recordings, home tasks, monthly calls, mastery bands. Tiny Steps provides all five so you can verify learning.' },
];

const FAQPage: React.FC = () => {
  useEffect(() => { document.title = 'Frequently Asked Questions | Tiny Steps'; }, []);
  return (
    <div className="bg-white">
      <Meta title="FAQ | Tiny Steps Online School" description="Answers to your questions about phonics, grammar & public speaking. Parents’ top queries covered in one place." canonical="https://tinystepslearning.com/faq" />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-heading text-3xl font-bold md:text-4xl">Frequently Asked Questions</h1>
        <p className="mt-2 text-base text-gray-700">Answers to your questions about phonics, grammar & public speaking</p>
        <div className="mt-8">
          <FAQAccordion items={items} />
        </div>
      </div>
    </div>
  );
};

export default FAQPage;

