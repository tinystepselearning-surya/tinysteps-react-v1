import { useEffect } from "react";
import { Link } from "react-router-dom";
import { trackFreeResourceToTrialClick } from "../../lib/conversionTracking";

const CLASSIC_PATH = "/free-spelling-game-for-kids?play=1";
const PUZZLE_PATH = "/free-spelling-game-for-kids?play=1&mode=puzzles";

const games = [
  {
    key: "foundation",
    number: "01",
    name: "Spelling Adventure",
    age: "Approx. ages 5–8",
    label: "Start with shorter words",
    description: "Begin with an optional two-letter warm-up, then build familiar words, complete missing letters and correct mistakes.",
    features: ["6 spelling activities + warm-up", "126 practice challenges", "6 per step · more on replay"],
    href: CLASSIC_PATH,
    button: "Play Spelling Adventure",
    visual: "🔤",
    tone: "from-[#fff0d4] to-[#ffe0cf]",
    ink: "text-[#613b4c]",
  },
  {
    key: "visual",
    number: "02",
    name: "Spelling Puzzle Lab",
    age: "Approx. ages 8–10+",
    label: "Try more challenging patterns",
    description: "Rearrange letters and word parts, sort spelling patterns, spot errors and spell words from memory. No sound-based tasks.",
    features: ["6 progressive levels", "144 reviewed puzzles", "8 per round · more on replay"],
    href: PUZZLE_PATH,
    button: "Play Spelling Puzzle Lab",
    visual: "🧩",
    tone: "from-[#daf6f3] to-[#d8dcff]",
    ink: "text-[#2a4863]",
  },
] as const;

type SpellingGamesLandingProps = {
  faqs: ReadonlyArray<{ question: string; answer: string }>;
};

// The public page and FAQ JSON-LD share the same content in the route registry.
export default function SpellingGamesLanding({ faqs }: SpellingGamesLandingProps) {
  // Returning from either full-screen game must show the spelling page's
  // heading, not the scroll position inherited from the previous route.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f8ff] text-[#232449]">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-9">
        <nav className="mb-5 text-sm font-semibold text-[#5c5f88]" aria-label="Breadcrumb">
          <Link to="/free-english-games-for-kids" className="underline decoration-dotted underline-offset-4 hover:text-indigo-700">
            Free English Games
          </Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span>Spelling</span>
        </nav>

        <header className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(115deg,#29235c,#374e83)] px-5 py-7 text-white shadow-[0_14px_35px_rgba(36,34,95,.17)] sm:px-9 sm:py-9">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-2 text-xs font-black uppercase tracking-[.19em] text-[#c3fff0]">Tiny Steps · Free learning games</p>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">Free Spelling Game for Kids</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#edf2ff]">
              Two ways to practise spelling: start with familiar words or explore trickier spellings and word patterns.
              Choose a game below and play right away.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-white/15 px-3 py-2">Free for everyone</span>
              <span className="rounded-full bg-white/15 px-3 py-2">No login</span>
              <span className="rounded-full bg-white/15 px-3 py-2">Sound-free</span>
              <span className="rounded-full bg-white/15 px-3 py-2">No saved game progress</span>
            </div>
          </div>
          <span aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full bg-[#53dbdf]/20" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full bg-[#ffcb7d]/20" />
        </header>

        <section aria-labelledby="choose-spelling-game" className="mt-7">
          <div className="mb-4">
            <h2 id="choose-spelling-game" className="text-2xl font-black tracking-tight sm:text-3xl">Choose your spelling game</h2>
            <p className="mt-1 text-sm leading-6 text-[#5c6183]">They practise different skills. Children can start wherever they feel comfortable.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {games.map(game => (
              <article key={game.key} className={`flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-[#e0e3f3] bg-white shadow-[0_9px_24px_rgba(44,48,100,.07)]`}>
                <div className={`relative bg-gradient-to-br ${game.tone} px-6 py-6 ${game.ink} sm:px-7`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-black uppercase tracking-wider">
                      Game {game.number}
                    </span>
                    <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 text-3xl">
                      {game.visual}
                    </span>
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider">{game.age}</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{game.name}</h3>
                  <p className="mt-1 text-sm font-bold">{game.label}</p>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <p className="text-sm leading-7 text-[#494e6e]">{game.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {game.features.map(feature => (
                      <li key={feature} className="rounded-full border border-[#e3e5f4] bg-[#f8f8ff] px-3 py-1.5 text-xs font-bold text-[#4d5073]">{feature}</li>
                    ))}
                  </ul>
                  <Link to={game.href}
                    className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#4e43c1] px-5 py-3 text-center text-sm font-black text-white shadow-[0_4px_0_#34298f] transition hover:bg-[#392fa8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400">
                    {game.button} <span aria-hidden="true" className="ml-2">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="spelling-quick-guide" className="mt-7 rounded-[24px] border border-[#e3e4f2] bg-white px-5 py-5 sm:px-7">
          <h2 id="spelling-quick-guide" className="text-xl font-black">How it works</h2>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-[#4b506c] sm:grid-cols-3">
            <p><strong className="mr-2 text-indigo-700">1.</strong>Choose a game and level that feels right.</p>
            <p><strong className="mr-2 text-indigo-700">2.</strong>Tap, arrange, sort or type the word.</p>
            <p><strong className="mr-2 text-indigo-700">3.</strong>Read the feedback, try again and learn the pattern.</p>
          </div>
        </section>

        <section aria-labelledby="spelling-parent-faq" className="mt-7">
          <h2 id="spelling-parent-faq" className="text-xl font-black">Questions parents often ask</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {faqs.map(item => (
              <details key={item.question} className="group rounded-xl border border-[#e1e4f0] bg-white p-4 open:border-indigo-300">
                <summary className="cursor-pointer pr-3 text-sm font-extrabold text-[#292952] marker:text-indigo-600">{item.question}</summary>
                <p className="mt-3 text-sm leading-6 text-[#515773]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-5 text-sm text-[#606581]">
          Looking for easier letter and word-building activities?{" "}
          <Link to="/free-word-building-games-for-kids" className="font-extrabold text-[#3f38a0] underline underline-offset-4">
            Browse word-building games
          </Link>
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#dfe2ef] pt-6">
          <div className="max-w-xl">
            <p className="text-sm font-bold text-[#292952]">Looking for teacher-led spelling and English support?</p>
            <p className="mt-1 text-sm text-[#585d7b]">These games are independent practice. Tiny Steps also offers live English classes with teacher guidance.</p>
          </div>
          <Link to="/book-demo" onClick={() => trackFreeResourceToTrialClick({
            page_path: "/free-spelling-game-for-kids",
            cta_label: "Book Free 35-Minute Demo",
            cta_location: "assessment_bridge",
            destination_path: "/book-demo",
            program: "phonics",
          })} className="rounded-xl border border-indigo-200 bg-white px-5 py-3 text-sm font-extrabold text-[#38348b] hover:border-indigo-400">
            Book Free 35-Minute Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
