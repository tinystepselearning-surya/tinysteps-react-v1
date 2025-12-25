// @ts-nocheck
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { trackEvent } from "../../lib/analytics";
import { AskTinyStepsModal } from "./AskTinyStepsModal";
import { useLocation } from 'react-router-dom';

const FloatingAssistant = () => {
  const { user } = useAuthStore();
  const [promptVisible, setPromptVisible] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPromptVisible(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const openWhatsApp = (message = "Hi Tiny Steps! I have a quick question.") => {
    trackEvent("floating_whatsapp_click", { source: "floating_assistant" });
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919618398383?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  // ✅ If logged in, hide floating assistant only on app dashboard routes
  const location = useLocation();
  const pathname = location?.pathname || '';

  // Routes where we should hide the public floating assistant (app dashboards)
  const DASHBOARD_PREFIXES = [
    '/surya',
    '/teacher',
    '/parent',
    '/kids',
    '/learning-partner',
    '/learningpartner',
    '/admin',
  ];

  const isDashboardRoute = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));

  if (user && isDashboardRoute) return null;

  const content = (
    <div className="fixed bottom-5 right-5 z-[99999] flex flex-col items-end gap-3 pointer-events-auto">
      {/* Prompt bubble */}
      {promptVisible && (
        <motion.div
          className="max-w-xs rounded-2xl border border-gray-100 bg-white/95 p-4 text-sm text-gray-800 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">💬</span>
            <div>
              <p className="font-semibold text-gray-900">Need help with admissions?</p>
              <p className="text-xs text-gray-600">
                Ask about schedules, pricing, curriculum — I can help.
              </p>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-gradient-to-r from-[#59c3ff] to-[#ff8f5c] px-3 py-1 text-xs font-semibold text-white"
                  onClick={() => {
                    trackEvent("floating_ask_tinysteps_click", {
                      source: "floating_assistant_prompt",
                    });
                    setAskOpen(true); // ✅ open modal directly
                    setPromptVisible(false);
                  }}
                >
                  Chat now
                </button>

                <button
                  type="button"
                  className="text-xs text-gray-500 hover:underline"
                  onClick={() => setPromptVisible(false)}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ask TinySteps Button */}
      <motion.button
        type="button"
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xl ring-1 ring-gray-100"
        whileHover={{ y: -2 }}
        onClick={() => {
          // ✅ NO alert, NO console spam — open modal directly
          trackEvent("floating_ask_tinysteps_click", { source: "floating_assistant" });
          setAskOpen(true);
          setPromptVisible(false);
        }}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8f5c] to-[#59c3ff] text-white">
          🤖
        </span>
        Ask TinySteps
      </motion.button>

      {/* WhatsApp Button */}
      <motion.button
        type="button"
        className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-2xl"
        whileHover={{ scale: 1.05 }}
        onClick={() => openWhatsApp("Hi! I want to chat about Tiny Steps programs.")}
      >
        WhatsApp Advisor
      </motion.button>

      {/* Modal */}
      <AskTinyStepsModal open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );

  // Render via portal to avoid parent stacking/overflow issues
  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};

export default FloatingAssistant;
