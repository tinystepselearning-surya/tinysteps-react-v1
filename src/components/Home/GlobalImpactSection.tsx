import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CountUp from "@components/CountUp";

/**
 * Safe analytics helper (won't break build if analytics isn't set up).
 * If you later add GA/Meta/etc, you can replace this with your real implementation.
 */
function trackEvent(_name: string, _params?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    const w = window as any;
    if (typeof w.gtag === "function") w.gtag("event", _name, _params);
    // else no-op
  } catch {
    // no-op
  }
}

const WHATSAPP_NUMBER = "919618398383"; // no +

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
  childAgeGrade: "",
  interest: "Not sure yet",
  preferredTime: "",
  note: "",
};

const InputBase =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition " +
  "placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-200/40";

const Label: React.FC<{ children: React.ReactNode; htmlFor: string }> = ({
  children,
  htmlFor,
}) => (
  <label htmlFor={htmlFor} className="text-[11px] font-semibold text-slate-700">
    {children}
  </label>
);

const GradientButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { full?: boolean }
> = ({ className = "", full, ...props }) => (
  <button
    {...props}
    className={[
      full ? "w-full" : "",
      "rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg",
      "bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff]",
      "hover:opacity-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
      className,
    ].join(" ")}
  />
);





const HomePage: React.FC = () => {
  return (
    <>
      {/* Founder card */}
      <div className="px-4">
      </div>

    </>
  );
};

export default HomePage;
