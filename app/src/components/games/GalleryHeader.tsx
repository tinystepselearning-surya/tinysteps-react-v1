/**
 * GalleryHeader.tsx
 * Title, description, search bar, and parent toggle
 */

import ParentViewToggle from "../phases/ParentViewToggle";

interface GalleryHeaderProps {
  title: string;
  description: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  parentView: boolean;
  onParentViewChange: (enabled: boolean) => void;
}

export default function GalleryHeader({
  title,
  description,
  searchQuery,
  onSearchChange,
  parentView,
  onParentViewChange
}: GalleryHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Title + Parent toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-orange-100/50 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            {description}
          </p>
        </div>
        <ParentViewToggle value={parentView} onChange={onParentViewChange} />
      </div>
      
      {/* Search bar */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg className="size-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search games by name, skill, or topic..."
          className="w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/20 transition-all"
        />
      </div>
    </div>
  );
}
