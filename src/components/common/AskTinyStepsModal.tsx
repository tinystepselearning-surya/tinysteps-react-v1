// src/components/common/AskTinyStepsModal.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAskTinyStepsChat } from "../../hooks/useAskTinyStepsChat";

type AskTinyStepsModalProps = {
  open: boolean;
  onClose: () => void;
};

const QUICK_QUESTIONS = [
  "Is the demo / assessment free?",
  "What are your fees / packages?",
  "Tell me about Summer Camp",
  "What is the class duration?",
  "What courses do you offer?",
] as const;

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function splitUrlAndTrailingPunctuation(raw: string): { url: string; trailing: string } {
  let url = raw;
  let trailing = "";
  while (/[),.!?]$/.test(url)) {
    trailing = `${url.slice(-1)}${trailing}`;
    url = url.slice(0, -1);
  }
  return { url, trailing };
}

function renderTextWithLinks(text: string) {
  const lines = String(text || "").split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(URL_REGEX);
    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {parts.map((part, partIdx) => {
          if (!part) return null;
          if (part.startsWith("http://") || part.startsWith("https://")) {
            const { url, trailing } = splitUrlAndTrailingPunctuation(part);
            return (
              <React.Fragment key={`part-${lineIdx}-${partIdx}`}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cyan-700 underline decoration-cyan-400/80 underline-offset-2 hover:text-cyan-800"
                >
                  {url}
                </a>
                {trailing}
              </React.Fragment>
            );
          }
          return <React.Fragment key={`part-${lineIdx}-${partIdx}`}>{part}</React.Fragment>;
        })}
        {lineIdx < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    );
  });
}

export const AskTinyStepsModal: React.FC<AskTinyStepsModalProps> = ({
  open,
  onClose,
}) => {
  const { messages, input, setInput, loading, error, sendMessage, resetChat } =
    useAskTinyStepsChat();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Lock background scroll while modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  // Auto-scroll to bottom on new messages/loading
  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages.length, loading]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const canSend = useMemo(() => !!input.trim() && !loading, [input, loading]);

  const handleSend = () => {
    if (!canSend) return;
    sendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAsk = (q: string) => {
    sendMessage(q);
  };

  const handleClear = () => {
    resetChat();
    window.setTimeout(() => inputRef.current?.focus(), 60);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100000] flex items-end justify-end bg-slate-900/45 p-3 backdrop-blur-[3px] sm:p-4"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Ask TinySteps"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            className="relative flex w-full max-w-[min(96vw,490px)] max-h-[86vh] flex-col overflow-hidden rounded-3xl border border-cyan-100/60 bg-white/92 shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur"
          >
            <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-orange-200/45 blur-3xl" />

            {/* Header */}
            <div className="relative border-b border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.22)]" />
                    TinySteps AI
                  </div>
                  <h2 className="text-xl font-semibold leading-tight">Ask TinySteps</h2>
                  <p className="mt-1 text-xs text-slate-200">
                    Premium AI support for classes, pricing, curriculum and summer camp.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg leading-none text-slate-200 transition hover:bg-white/20 hover:text-white"
                  aria-label="Close"
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="relative flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/80 via-white to-cyan-50/40 px-4 py-4">
              <div className="mb-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Quick ask
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <motion.button
                      key={q}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickAsk(q)}
                      whileHover={{ y: -1 }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-50"
                      title={q}
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>

              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-center text-sm text-slate-500"
                >
                  Example: "What are your fees for 1:1 phonics classes?"
                </motion.div>
              )}

              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <motion.div
                    key={`${msg.role}-${index}`}
                    initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="flex max-w-[88%] items-start gap-2">
                        <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#59c3ff] via-[#84d8ff] to-[#ffbe7d] text-[11px] font-semibold text-slate-900 shadow-sm">
                          AI
                        </span>
                        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-cyan-50/70 to-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm">
                          {renderTextWithLinks(msg.content)}
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[85%] rounded-2xl border border-orange-200 bg-gradient-to-r from-[#fff2e8] to-[#ffe5d2] px-3.5 py-2.5 text-sm text-slate-900 shadow-sm">
                        {renderTextWithLinks(msg.content)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex justify-start"
                >
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#59c3ff] to-[#ffbe7d] text-[10px] font-semibold text-slate-900">
                      AI
                    </span>
                    <span>TinySteps AI is thinking</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                    </span>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                  {error}
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200/80 bg-white/90 px-4 py-3">
              <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-900">
                AI-generated responses are for informational purposes and may contain errors.
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-cyan-200 via-orange-200 to-cyan-200 p-[1px]">
                <div className="flex items-center gap-2 rounded-2xl bg-white p-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your question..."
                    className="h-11 flex-1 rounded-xl border-0 px-3 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-400"
                    disabled={loading}
                  />
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSend}
                    disabled={!canSend}
                    className="h-10 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
                    type="button"
                  >
                    Send
                  </motion.button>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  Chats may be stored to improve responses.
                </div>

                <button
                  onClick={handleClear}
                  type="button"
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:underline"
                  disabled={loading && messages.length === 0}
                  title="Clear chat"
                >
                  Clear
                </button>
              </div>

              <div className="mt-2 text-center">
                <a
                  href="https://wa.me/919618398383"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
                >
                  Chat on WhatsApp - opens new window {">"}
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
