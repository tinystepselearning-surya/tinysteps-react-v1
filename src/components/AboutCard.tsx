import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

/**
 * About / Founder Note card
 * - Tailwind v4 classes
 * - Accessible toggle (aria-expanded + focus management)
 * - Soft glow + pastel deco
 * - Bottom fade when collapsed
 */
export default function AboutCard() {
  const [open, setOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const sectionRef = useScrollReveal<HTMLElement>({ variant: "up" });
  const cardDelay: CSSProperties = { "--reveal-child-delay": "140ms" } as CSSProperties;

  function onToggle() {
    const next = !open;
    setOpen(next);
    // Scroll the newly revealed content smoothly into view
    setTimeout(() => {
      if (next) moreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  }

  return (
    <section ref={sectionRef} className="mx-auto max-w-5xl px-4 my-16" aria-labelledby="about-title">
      <div data-reveal-child style={cardDelay} className="relative overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100">
        {/* soft glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-[100%] blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 40%, rgba(255,169,77,.28), rgba(110,193,228,.18) 55%, transparent 70%)",
          }}
        />
        {/* tiny pastel dots */}
        <div aria-hidden className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-[#fff3ec]" />
        <div aria-hidden className="absolute -right-6 -bottom-8 h-28 w-28 rounded-full bg-[#e8f9f0]" />

        <div className="relative grid gap-6 p-6 sm:p-8">
          <header className="text-center">
            <h2 id="about-title" className="text-2xl md:text-3xl font-extrabold text-[#e05c0a]">
              Foundations Forever: Why Phonics Matters for Every Child
            </h2>
            <p className="mt-1 text-gray-600">
              By <strong>Priya</strong>, Founder of Tiny Steps Learning
            </p>
          </header>

          {/* lead / always-visible part */}
          <div className="relative">
            <p className="text-gray-800 leading-relaxed">
              At Tiny Steps, my mission has always been simple yet profound: to give every child a strong beginning—one
              that lasts a lifetime. When I launched Tiny Steps, I envisioned a place where learning to read wasn’t a
              chore but a joy; where children would experience the magic of words and stories through play, curiosity and
              connection. Our tagline, <em>Foundations Forever</em>, reflects that promise. In this article, I want to
              share why phonics sits at the heart of our program and how it can empower your child to become a joyful
              reader and confident learner.
            </p>

            {/* bottom fade while collapsed */}
            {!open && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -bottom-2 h-24"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1) 65%)",
                }}
              />
            )}
          </div>

          {/* expanded content */}
          <div
            ref={moreRef}
            id="about-more"
            className={`grid gap-4 text-gray-800 leading-relaxed transition-all duration-300 ${
              open ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <h3 className="text-xl font-extrabold text-[#e05c0a]">Phonics: Unlocking the Code of Reading</h3>
            <p>
              Phonics is the bridge between the sounds we hear (phonemes) and the letters and letter-groups that
              represent those sounds on a page (graphemes). When a child realises that the sound /s/ is written as{" "}
              <strong>s</strong>, and that combining /a/ and /t/ forms the word <strong>sat</strong>, reading becomes a
              solvable, joyful puzzle. Systematic phonics gives children the tools to decode unfamiliar words, build
              fluency, and love what they read.
            </p>
            <p>
              This ability to “sound out” words builds independence and confidence. Instead of guessing at words,
              children learn to construct them—piece by piece. Research from Cambridge University emphasises that
              effective phonics instruction should be:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Systematic:</strong> taught in a planned, sequential order. I introduce letters in clusters that
                form real words (for example, s-a-t-p-i-n) rather than simply marching from A to Z.
              </li>
              <li>
                <strong>Multi-sensory:</strong> engaging sight, sound, movement and touch. Children should see letters,
                hear their sounds, say them aloud, trace their shapes, and even act them out.
              </li>
              <li>
                <strong>Meaningful:</strong> always linked to real stories, songs and experiences. Learning sticks when
                children can connect sounds to the world around them.
              </li>
            </ul>

            <h3 className="text-xl font-extrabold text-[#e05c0a]">How Young Minds Learn Best</h3>
            <p>
              The early years—roughly ages three to seven—are a period of explosive language growth. During this emergent
              literacy stage, children blend two kinds of skills:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Code-related skills (decoding):</strong> recognising letters and their shapes; understanding that
                print carries meaning; hearing and playing with sounds (rhyming, blending, segmenting); and matching
                sounds to spellings.
              </li>
              <li>
                <strong>Oral-language skills (comprehension):</strong> listening, speaking and vocabulary; understanding
                sentence patterns; and developing storytelling and imagination.
              </li>
            </ul>
            <p>
              At Tiny Steps, I nurture both paths together because reading is more than decoding; it’s also about
              comprehension. My students learn to see a word, say it, act it and feel it—turning learning into memory.
            </p>

            <h3 className="text-xl font-extrabold text-[#e05c0a]">Why I Start With SATPIN—Not A–Z</h3>
            <p>
              Many schools still teach the alphabet from A to Z. While that might feel intuitive, research suggests it
              may delay true reading. Cambridge experts recommend starting with six letters—<strong>s, a, t, p, i, n</strong>—because these building
              blocks let children form dozens of simple, meaningful words right away (<em>sat, pin, tap, nap, sit, pat, pan</em>, and many more). When
              children can read their first real word in Week 1, their eyes light up. That moment of success fuels curiosity and resilience.
            </p>

            <h3 className="text-xl font-extrabold text-[#e05c0a]">My Classroom in Action</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Active learning:</strong> children sing, clap, trace and act out sounds. They explore the shape of
                each letter with their bodies as well as their minds.
              </li>
              <li>
                <strong>Story-based connections:</strong> instead of drilling letter names, I weave sounds into stories. “S”
                might be the shining sun in a tale about morning adventures or the hissing snake sliding through the grass.
              </li>
              <li>
                <strong>Layered reading:</strong> we begin with picture-rich pages that anchor meaning and gradually progress
                to short sentences and stories children can read aloud with pride.
              </li>
              <li>
                <strong>Family support:</strong> parents receive guidance to make reading at home feel like a celebration rather
                than homework. Story-time becomes a chance to bond, laugh and explore new words together.
              </li>
            </ul>
            <p>
              Every activity is grounded in research showing that routine, repetition and rhythm make learning stick—and guided
              by my belief that children learn best when they’re happy.
            </p>

            <h3 className="text-xl font-extrabold text-[#e05c0a]">From Sounds to Sentences</h3>
            <p>
              Once children feel comfortable with phonics, I expand their skills into fluent reading and expressive writing.
              I introduce sight words (like <em>the, have, said</em>) in context instead of isolated lists, and we practise
              blending and segmenting so children can read and spell independently. Writing emerges naturally from tracing
              shapes to crafting simple sentences and creative stories.
            </p>

            <h3 className="text-xl font-extrabold text-[#e05c0a]">Assessment the Tiny Steps Way</h3>
            <p>
              You won’t find pressure tests or rote memorisation drills in my classroom. Instead, I observe children as they
              read, speak, listen and think. I use running records, story-retelling and drawing portfolios to understand each
              learner’s progress—methods aligned with Cambridge’s holistic assessment recommendations. I track accuracy, of
              course, but also expression, confidence and comprehension, because fluent reading should be joyful reading.
            </p>

            <blockquote className="border-l-4 border-[#ff751f] bg-[#fff7f1] p-4 rounded-md">
              “Phonics is not a subject—it’s a superpower. It helps children connect sounds to symbols, reading to meaning, and
              learning to joy.”
            </blockquote>

            <p>
              At Tiny Steps, I turn those insights into everyday classroom magic—through stories, songs, smiles and tiny steps
              that lead to lifelong literacy.
            </p>

            <h3 className="text-xl font-extrabold text-[#e05c0a]">Parents as Partners</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Weekly learning notes:</strong> brief updates on what your child has been exploring and suggestions for
                playful follow-ups at home.
              </li>
              <li>
                <strong>Read &amp; Reflect moments:</strong> prompts and questions that help children connect stories to their
                feelings and imagination.
              </li>
              <li>
                <strong>Sound library access:</strong> audio clips so you can model each phonics sound with confidence.
              </li>
              <li>
                <strong>Progress snapshots:</strong> dashboards that celebrate milestones and show what’s next on your child’s
                reading journey.
              </li>
              <li>
                <strong>Family connection days:</strong> chances to share photos, videos or reflections of learning at home—
                because every tiny step is worth celebrating.
              </li>
            </ul>

            <p>
              I started Tiny Steps with one dream: to make learning a shared joy between parents, teachers and children. When
              school and home walk hand in hand, every child takes confident, happy steps toward lifelong success.
            </p>

            <h3 className="text-xl font-extrabold text-[#e05c0a]">My Promise</h3>
            <p>
              As you explore phonics with your child, remember that it’s not just a subject—it’s a superpower. Phonics helps
              children connect sounds to symbols, reading to meaning and learning to joy. I promise to make you feel informed,
              connected and proud of your child’s progress—without stress or complexity. Together, we can give every child a
              foundation that truly lasts forever.
            </p>
            <p className="font-semibold text-gray-900">
              — Priya
              <br />
              Founder, Tiny Steps Learning
            </p>
          </div>

          {/* action */}
          <div className="pt-2 text-center">
            <button
              onClick={onToggle}
              aria-controls="about-more"
              aria-expanded={open}
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-extrabold text-white shadow"
              style={{ backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }}
            >
              {open ? "Read less" : "Read more"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
