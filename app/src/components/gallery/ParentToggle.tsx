export function ParentToggle({ 
  checked, 
  onChange 
}: { 
  checked: boolean; 
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          ${checked ? 'bg-blue-600' : 'bg-gray-300'}
        `}
      >
        <span className="sr-only">Toggle Parent View</span>
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <label className="text-sm text-gray-600 cursor-pointer" onClick={() => onChange(!checked)}>
        Parent View
      </label>
    </div>
  );
}
