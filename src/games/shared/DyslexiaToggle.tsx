/**
 * Dyslexia Font Toggle
 * Accessibility widget for font preference
 */

import { useState, useEffect } from "react";
import { getDyslexiaPreference, setDyslexiaPreference, applyDyslexiaFont } from "./accessibility";

export default function DyslexiaToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const preference = getDyslexiaPreference();
    setEnabled(preference);
    applyDyslexiaFont(preference);
  }, []);

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    setDyslexiaPreference(newEnabled);
    applyDyslexiaFont(newEnabled);
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={enabled ? "Disable dyslexia-friendly font" : "Enable dyslexia-friendly font"}
      title={enabled ? "Dyslexia Font: ON" : "Dyslexia Font: OFF"}
    >
      <span className={`text-lg ${enabled ? "opacity-100" : "opacity-40"}`}>
        {enabled ? "📖✓" : "📖"}
      </span>
    </button>
  );
}
