/**
 * PhaseGridSkeleton.tsx
 * Shimmering skeleton cards for loading state
 */

export default function PhaseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 animate-pulse"
        >
          {/* Header skeleton */}
          <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200" />
          
          {/* Body skeleton */}
          <div className="p-4 space-y-4">
            {/* Badges */}
            <div className="flex gap-2">
              <div className="h-5 w-12 bg-gray-200 rounded-md" />
              <div className="h-5 w-12 bg-gray-200 rounded-md" />
              <div className="h-5 w-12 bg-gray-200 rounded-md" />
            </div>
            
            {/* Buttons */}
            <div className="space-y-2">
              <div className="h-14 bg-gray-200 rounded-xl" />
              <div className="h-14 bg-gray-100 rounded-xl" />
            </div>
          </div>
          
          {/* Progress bar skeleton */}
          <div className="px-4 pb-4">
            <div className="h-2 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
