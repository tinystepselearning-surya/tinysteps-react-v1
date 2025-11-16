import React, { useEffect, useRef } from 'react';

export default function SpellingInput({ value, onChange, onSubmit, disabled }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
        placeholder="Type the spelling"
        disabled={disabled}
      />
      <div className="flex justify-between items-center">
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-4 py-2 rounded-xl bg-yellow-500 text-white font-semibold shadow hover:bg-yellow-600 transition disabled:opacity-60"
        >
          Submit
        </button>
        <p className="text-xs text-gray-500">Press Enter to submit</p>
      </div>
    </form>
  );
}
