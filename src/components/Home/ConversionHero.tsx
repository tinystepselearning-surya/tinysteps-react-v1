import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import Button from "../Button/Button";

// Constants
const WHATSAPP_NUMBER = "919618398383";
const CALL_DISPLAY = "+91 96183 98383";
const CALL_HREF = `tel:+${WHATSAPP_NUMBER}`;
const SUN_ORANGE = "#ff6a00";

type FormState = {
  parentName: string;
  whatsapp: string;
  childAgeGrade: string;
  interest: "Phonics" | "Grammar" | "Public Speaking" | "Not sure yet";
  preferredTime: string;
  note: string;
};

const initialState: FormState = {
  parentName: "",
  whatsapp: "",
  childAgeGrade: "3-5 Years",
  interest: "Phonics",
  preferredTime: "",
  note: "",
};

// --- Components ---

const GlassCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`relative overflow-hidden rounded-[24px] border border-white/55 bg-white/45 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] ${className}`}
  >
    {children}
  </div>
);

const SunTile = ({ eyebrow, title, desc, icon, size = "small" }: any) => (
  <motion.div
    whileHover={{ y: -6, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 260, damping: 22 }}
    className={`group relative flex flex-col justify-between p-5 transition-all ${
      size === "large" ? "md:col-span-2" : "col-span-1"
    }`}
  >
    <GlassCard className="h-full border-white/70 transition-all duration-500 group-hover:border-orange-200/70 group-hover:shadow-[0_18px_50px_rgba(255,106,0,0.12)]">
      {/* premium hover glow (subtle) */}
      <div className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,106,0,0.20),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(255,200,150,0.18),transparent_55%)]" />
      </div>

      {/* top highlight hairline */}
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-r from-transparent via-orange-300/70 to-transparent" />

      <div className="relative p-5">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform duration-300 group-hover:rotate-6">
          {icon}
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-700/80">
            {eyebrow}
          </span>
          <h3 className="mt-1 text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">{desc}</p>
        </div>
      </div>

      {/* Subtle accent line */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-orange-500/70 to-transparent transition-all duration-500 group-hover:w-full" />
    </GlassCard>
  </motion.div>
);

const ConversionHero: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [showOptional, setShowOptional] = useState(false);

  // Parallax background effect
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -90]);
  const y2 = useTransform(scrollY, [0, 500], [0, 40]);

  const waLink = useMemo(() => {
    const msg = [
      "Hi Tiny Steps 👋",
      "I’d like to book a FREE assessment class.",
      "",
      `Parent name: ${form.parentName || "-"}`,
      `WhatsApp: ${form.whatsapp || "-"}`,
      `Child age: ${form.childAgeGrade || "-"}`,
      `Interest: ${form.interest || "-"}`,
      form.preferredTime?.trim() ? `Preferred time: ${form.preferredTime.trim()}` : "",
      form.note?.trim() ? `Note: ${form.note.trim()}` : "",
      "",
      "Please share available slots. Thank you!",
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [form]);

  // ✅ Submit via WhatsApp ONLY (no form posting)
  const handleSubmitWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();

    // Minimal guardrails (prevents empty submissions)
    if (!form.parentName.trim() || !form.whatsapp.trim()) {
      // Simple UX: you can replace with toast if you have one
      alert("Please enter Parent Name and WhatsApp Number.");
      return;
    }

    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="relative min-h-screen overflow-hidden px-4 py-12 md:px-8">
      {/* ✅ Classy Sunrise Background (more depth, less wash) */}
      <div className="pointer-events-none absolute inset-0">
        {/* base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #FFF5EC 0%, #FFF9F4 32%, #FFFFFF 100%)",
          }}
        />

        {/* strong sun glow top-left (focused) */}
        <motion.div
          style={{
            y: y1,
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,106,0,0.36) 0%, rgba(255,150,90,0.14) 38%, rgba(255,255,255,0) 72%)",
          }}
          className="absolute left-[-6%] top-[-18%] h-[720px] w-[720px] rounded-full blur-[140px]"
          aria-hidden
        />

        {/* gentle warm veil (kept light so it doesn't look orange everywhere) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,170,120,0.10),transparent_62%)]" />

        {/* ✅ white spotlight behind the form (right side pop) */}
        <motion.div
          style={{
            y: y2,
            background:
              "radial-gradient(circle at 60% 38%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 26%, rgba(255,255,255,0) 62%)",
          }}
          className="absolute right-[-12%] top-[6%] h-[760px] w-[760px] rounded-full blur-[70px]"
          aria-hidden
        />

        {/* horizon haze for depth */}
        <div
          className="absolute inset-x-0 top-[62%] h-48"
          style={{
            background:
              "linear-gradient(180deg, rgba(148,163,184,0.10) 0%, rgba(255,255,255,0.0) 100%)",
          }}
        />

        {/* subtle paper-like texture (no dots) */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(15,23,42,0.020) 0, rgba(15,23,42,0.020) 1px, transparent 1px, transparent 14px), repeating-linear-gradient(-45deg, rgba(15,23,42,0.016) 0, rgba(15,23,42,0.016) 1px, transparent 1px, transparent 18px)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          {/* LEFT CONTENT */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex w-fit items-center gap-3 rounded-full border border-orange-200/60 bg-white/80 px-4 py-2 text-[12px] font-bold text-orange-800 shadow-sm backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
              </span>
              TINY STEPS LEARNING • PREMIUM 1:1 FOUNDATIONS
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-5xl font-black tracking-tight text-slate-900 md:text-7xl leading-[0.95]"
            >
              IB-aligned <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-500">
                Phonics & Grammar
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 max-w-lg text-lg text-slate-600 leading-relaxed"
            >
              A structured, stress-free journey for ages 3–12. We build the bridge
              between "learning to read" and "loving to speak."
            </motion.p>

            {/* BENTO GRID VALUE PROPS */}
            <div className="mt-10 grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
              <SunTile
                eyebrow="The Format"
                title="1:1 Live Online"
                desc="Personalized pace for every child."
                icon={<span className="text-2xl">🎯</span>}
              />
              <SunTile
                eyebrow="The Reach"
                title="Global Families"
                desc="India, US, and Singapore."
                icon={<span className="text-2xl">🌍</span>}
              />
              <SunTile
                eyebrow="Confidence"
                title="Public Speaking"
                desc="Weekly confidence building drills."
                icon={<span className="text-2xl">✨</span>}
              />
            </div>
          </div>

          {/* RIGHT FORM CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="relative"
          >
            <GlassCard className="border-white/80 p-8 shadow-[0_26px_70px_rgba(15,23,42,0.10)]">
              {/* subtle inner ring for premium feel */}
              <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-orange-200/30" />

              <div className="relative mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Book Assessment</h2>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Takes ~20s • Reply via WhatsApp</span>
                  <span className="text-slate-300">•</span>
                  <a
                    href={CALL_HREF}
                    className="font-semibold text-slate-700 hover:text-slate-900 underline decoration-slate-300/70 underline-offset-4"
                  >
                    Call {CALL_DISPLAY}
                  </a>
                </div>
              </div>

              {/* ✅ IMPORTANT: onSubmit uses WhatsApp-only handler */}
              <form onSubmit={handleSubmitWhatsApp} className="relative space-y-4">
                <div className="group space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 transition-colors group-focus-within:text-orange-600">
                    Parent Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={form.parentName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, parentName: e.target.value }))
                    }
                    className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none transition-all focus:border-orange-500"
                    required
                  />
                </div>

                <div className="group space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 transition-colors group-focus-within:text-orange-600">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, whatsapp: e.target.value }))
                    }
                    className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none transition-all focus:border-orange-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Child's Age
                    </label>
                    <select
                      value={form.childAgeGrade}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, childAgeGrade: e.target.value }))
                      }
                      className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none"
                    >
                      <option>3-5 Years</option>
                      <option>6-8 Years</option>
                      <option>9-12 Years</option>
                    </select>
                  </div>

                  <div className="group space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Interest
                    </label>
                    <select
                      value={form.interest}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          interest: e.target.value as FormState["interest"],
                        }))
                      }
                      className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none"
                    >
                      <option>Phonics</option>
                      <option>Grammar</option>
                      <option>Public Speaking</option>
                      <option>Not sure yet</option>
                    </select>
                  </div>
                </div>

                {/* ✅ optional details as a small link (not a big field) */}
                <button
                  type="button"
                  onClick={() => setShowOptional((v) => !v)}
                  className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-orange-700 underline decoration-orange-300/70 underline-offset-4 hover:text-orange-800"
                >
                  <span className="text-orange-600">{showOptional ? "−" : "+"}</span>
                  {showOptional ? "Hide optional details" : "Add optional details"}
                </button>

                <AnimatePresence initial={false}>
                  {showOptional && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-4">
                        <div className="group space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 transition-colors group-focus-within:text-orange-600">
                            Preferred Time (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Weekdays 6–8 PM"
                            value={form.preferredTime}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                preferredTime: e.target.value,
                              }))
                            }
                            className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none transition-all focus:border-orange-500"
                          />
                        </div>

                        <div className="group space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 transition-colors group-focus-within:text-orange-600">
                            Note (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. shy speaker / reading help"
                            value={form.note}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, note: e.target.value }))
                            }
                            className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none transition-all focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ✅ Primary CTA: WhatsApp submit */}
                <Button
                  type="submit"
                  className="mt-6 w-full rounded-2xl py-6 text-base font-bold shadow-lg shadow-orange-200/70 transition-all hover:shadow-orange-300/80"
                  style={{
                    background: `linear-gradient(90deg, ${SUN_ORANGE} 0%, #ff7a1a 55%, #ff6a00 100%)`,
                  }}
                >
                  Submit via WhatsApp
                </Button>

                {/* ✅ Small fallback link (same action) */}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Having trouble? Open WhatsApp in a new tab →
                </a>

                <p className="text-center text-[10px] text-slate-400">
                  🔒 We value your privacy. No spam, ever.
                </p>
              </form>
            </GlassCard>

            {/* Floating Decorative Element */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -bottom-6 -left-6 h-20 w-20 rounded-3xl bg-white p-4 shadow-xl"
            >
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-orange-50 text-2xl">
                🎓
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ConversionHero;
