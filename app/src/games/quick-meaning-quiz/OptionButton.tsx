/**
 * OptionButton - Accessible meaning option component
 */

interface OptionButtonProps {
  meaning: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean | null; // null = not answered yet
  isDisabled: boolean;
  onClick: () => void;
}

const ICONS = ["🅰️", "🅱️", "🅲", "🅳"];

export function OptionButton({
  meaning,
  index,
  isSelected,
  isCorrect,
  isDisabled,
  onClick,
}: OptionButtonProps) {
  const icon = ICONS[index % ICONS.length];

  let bgColor = "bg-white hover:bg-blue-50";
  let borderColor = "border-gray-300";
  let animation = "";

  if (isCorrect === true) {
    bgColor = "bg-green-100";
    borderColor = "border-green-500";
    animation = "animate-pulse";
  } else if (isCorrect === false && isSelected) {
    bgColor = "bg-red-100";
    borderColor = "border-red-500";
    animation = "animate-shake";
  } else if (isSelected) {
    borderColor = "border-blue-500";
    bgColor = "bg-blue-50";
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`Option ${index + 1}: ${meaning}`}
      className={`
        w-full min-h-[64px] px-6 py-4 rounded-2xl border-4 
        ${bgColor} ${borderColor} ${animation}
        text-left transition-all duration-300
        hover:scale-102 active:scale-98
        focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${!isDisabled && "cursor-pointer"}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">{icon}</span>
        <p className="text-lg font-medium text-gray-800 leading-snug">
          {meaning}
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </button>
  );
}
