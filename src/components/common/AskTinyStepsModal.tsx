// src/components/common/AskTinyStepsModal.tsx
import React, { useEffect } from "react";
import { useAskTinyStepsChat } from "../../hooks/useAskTinyStepsChat";

type AskTinyStepsModalProps = {
  open: boolean;
  onClose: () => void;
};

export const AskTinyStepsModal: React.FC<AskTinyStepsModalProps> = ({
  open,
  onClose,
}) => {
  const { messages, input, setInput, loading, error, sendMessage, resetChat } =
    useAskTinyStepsChat();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSend = () => {
    sendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ask TinySteps 🤝</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Ask about classes, timings, pricing, curriculum…
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm mb-4">
              Example: "What are your fees for 1:1 phonics classes?"
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
                className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex gap-2 mb-2">
            <input
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
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          {/* Small disclosure */}
          <div className="text-[11px] text-gray-500 text-center mb-2">
            Chats may be stored to improve responses.
          </div>

          <div className="text-center">
            <a
              href="https://wa.me/919618398383"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Talk to a human advisor on WhatsApp →
            </a>

            {/* Optional: Clear chat (uncomment if you want) */}
            {/*
            <button
              onClick={resetChat}
              className="ml-3 text-sm text-gray-500 hover:underline"
              type="button"
            >
              Clear chat
            </button>
            */}
          </div>
        </div>
      </div>
    </div>
  );
};
