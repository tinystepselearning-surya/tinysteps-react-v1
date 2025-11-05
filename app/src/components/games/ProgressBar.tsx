/**
 * ProgressBar.tsx
 * Reusable progress bar with gradient fill and percentage display
 */

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning";
  className?: string;
}

export default function ProgressBar({ 
  progress, 
  showLabel = true,
  size = "md",
  variant = "default",
  className = ""
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3"
  };
  
  const gradients = {
    default: "from-orange-400 to-sky-400",
    success: "from-emerald-400 to-teal-500",
    warning: "from-amber-400 to-orange-500"
  };
  
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-gray-600">Progress</span>
          <span className="font-bold text-gray-900">{clampedProgress}%</span>
        </div>
      )}
      <div className={`${heights[size]} overflow-hidden rounded-full bg-gray-100`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradients[variant]} transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
