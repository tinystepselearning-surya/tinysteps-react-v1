// src/components/common/AskTinyStepsModal.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { useAskTinyStepsChat } from "../../hooks/useAskTinyStepsChat";

type AskTinyStepsModalProps = {
  open: boolean;
  onClose: () => void;
};

const QUICK_QUESTIONS = [
  "Is the demo / assessment free?",
  "What are your fees / packages?",
  "What is the class duration?",
  "What courses do you offer?",
] as const;

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
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
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
    // sendMessage supports override in the updated hook
    sendMessage(q);
  };

  const handleClear = () => {
    resetChat();
    // keep modal open, refocus input
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Ask TinySteps"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Ask TinySteps 🤝</h2>
              <p className="text-sm text-gray-600 mt-1">
                Ask about classes, timings, pricing, curriculum…
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none px-2"
              aria-label="Close"
              type="button"
            >
              ×
            </button>
          </div>

          {/* Quick questions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => handleQuickAsk(q)}
                className="text-xs px-3 py-1.5 rounded-full border bg-white hover:bg-gray-50 disabled:opacity-50"
                title={q}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm mb-4">
              Example: “What are your fees for 1:1 phonics classes?”
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-orange-100 text-orange-900"
                    : "bg-gray-100 text-gray-900 border"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-center text-gray-500 text-sm">
              Tiny Steps is typing…
            </div>
          )}
          {error && (
            <div className="text-center text-red-500 text-sm mt-2">{error}</div>
          )}

          <div ref={endRef} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex gap-2 mb-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Send
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-gray-500">
              Chats may be stored to improve responses.
            </div>

            <button
              onClick={handleClear}
              type="button"
              className="text-[11px] text-gray-500 hover:underline"
              disabled={loading && messages.length === 0}
              title="Clear chat"
            >
              Clear
            </button>
          </div>

          <div className="text-center mt-2">
            <a
              href="https://wa.me/919618398383"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Chat on WhatsApp - opens new window →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
