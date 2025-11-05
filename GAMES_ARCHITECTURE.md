# Games Architecture - Implementation Guide

## 🎯 Overview

Complete game catalog system with filtering, search, sorting, and progress tracking. Built with React, TypeScript, Firestore, and Tailwind CSS.

---

## 📁 File Structure

```
app/src/
├── types/
│   └── game.ts                    # Core TypeScript types
├── contexts/
│   └── GameCatalogContext.tsx     # Global catalog state
├── components/games/
│   ├── GameCard.tsx               # Individual game card
│   ├── GameGrid.tsx               # Responsive grid + skeletons
│   ├── GameFilters.tsx            # Filter sidebar
│   ├── GalleryHeader.tsx          # Title, search, parent toggle
│   ├── ProgressBar.tsx            # Reusable progress indicator
│   ├── RatingStars.tsx            # Star rating display
│   ├── SkillTags.tsx              # Skill badge chips
│   └── index.ts                   # Barrel exports
├── data/
│   └── sampleGames.ts             # Mock game data
└── pages/kids/
    └── GamesGalleryPage.tsx       # Main catalog page
```

---

## 🗂️ TypeScript Types

### Core Models (`types/game.ts`)

```typescript
GameMeta          // Game metadata (title, thumbnail, skills, etc.)
GameProgress      // User progress (accuracy, stars, sessions)
GameFilters       // Filter state (phases, areas, difficulty, etc.)
SortOption        // "recommended" | "name" | "difficulty" | "duration"
PhonicsArea       // "letter-sounds" | "blending" | "digraphs" etc.
```

### Key Interfaces

- **GameMeta**: Complete game catalog entry with classification, media, access control
- **GameProgress**: Tracks user performance (status, attempts, accuracy, stars, badges)
- **UserProgressSummary**: Aggregate stats for parent dashboards

---

## 🔌 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/kids/games-gallery` | `GamesGalleryPage` | Main game catalog with filters |
| `/kids/game/:slug` | (TODO) | Individual game hub page |
| `/kids/quest/:phaseId` | (TODO) | Phase/world overview |

---

## 🎨 Components

### GameCard

**Props**: `game`, `progress?`, `parentView`, `onPlay?`

**Features**:
- Thumbnail with lazy loading
- Status badge (New, In Progress, Completed)
- Difficulty & duration chips
- Skill tags
- Progress bar (if started)
- Star rating (if completed)
- CTA adapts to parent view ("Play" → "View Learning Goals")
- Route prefetching on hover

**Usage**:
```tsx
<GameCard 
  game={gameMeta} 
  progress={userProgress} 
  parentView={false}
  onPlay={(id) => navigate(`/kids/game/${id}`)}
/>
```

---

### GameGrid

**Props**: `games`, `progress?`, `parentView`, `isLoading`, `onPlay?`

**Features**:
- Responsive grid: `1 → 2 → 3 → 4` columns
- Skeleton loading states
- Empty state with friendly message
- Prefetch on card hover

---

### GameFilters

**Props**: `filters`, `onChange`, `onReset`

**Features**:
- Phase filter chips (P0-P10)
- Learning area multi-select
- Difficulty levels
- Duration options
- "Only free" toggle
- "Only completed" toggle
- Clear all button

---

### GalleryHeader

**Props**: `title`, `description`, `searchQuery`, `onSearchChange`, `parentView`, `onParentViewChange`

**Features**:
- Context-aware title/description
- Search input with icon
- Parent View toggle
- Responsive layout

---

## 🧠 State Management

### GameCatalogContext

**Global state**:
- `filters`: Current filter selection
- `searchQuery`: Search string
- `sortBy`: Active sort option
- `parentView`: Parent mode toggle

**Actions**:
- `setFilters(partial)`: Update filters
- `setSearchQuery(query)`: Update search
- `setSortBy(sort)`: Change sort order
- `setParentView(enabled)`: Toggle parent mode
- `resetFilters()`: Clear all filters

**Usage**:
```tsx
function MyComponent() {
  const { filters, setFilters, parentView } = useGameCatalog();
  // ...
}
```

---

## 🎛️ Filtering & Sorting

### Filter Logic

Filters are applied in sequence:
1. Hide WIP games (if `hideWIP: true`)
2. Phase filter (if any phases selected)
3. Learning area filter
4. Difficulty filter
5. Duration filter
6. Free games only
7. Search query (title, description, tagline, skills)

### Sort Options

- **Recommended** (default): Featured first, then by phase order
- **Name**: Alphabetical A-Z
- **Difficulty**: Easy → Medium → Hard
- **Duration**: Quick → Normal → Extended

---

## 🎮 UX Features

### Parent View Mode

When `parentView = true`:
- Card CTA: "🎮 Start Game" → "📊 View Learning Goals"
- Tagline replaced with first learning goal
- Gallery title changes to "Learning Games Library"
- Description emphasizes tracking and reports

### Accessibility

- ✅ All tap targets ≥56px (mobile-friendly)
- ✅ 3px focus rings on interactive elements
- ✅ ARIA labels on buttons and progress bars
- ✅ 4.5:1 color contrast ratios
- ✅ Keyboard navigation support

### Performance

- ✅ Route prefetching on hover
- ✅ Image lazy loading (`loading="lazy"`)
- ✅ Skeleton loading states
- ✅ Memoized filtering/sorting
- ✅ Optimized re-renders

---

## 🔥 Firestore Integration (Next Steps)

### Schema

```
/games/{gameId}
  - GameMeta fields
  
/users/{uid}/progress/{gameId}
  - GameProgress fields
  
/users/{uid}/summary
  - UserProgressSummary (updated by Cloud Function)
```

### useProgress Hook (TODO)

```typescript
function useProgress(uid: string) {
  const [progress, setProgress] = useState<Record<string, GameProgress>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Subscribe to /users/{uid}/progress collection
    // Merge with local cache
    // Return unsubscribe
  }, [uid]);
  
  return { progress, loading };
}
```

### Cloud Function (TODO)

```typescript
// Trigger: onWrite /users/{uid}/progress/{gameId}
// Action: Aggregate stats to /users/{uid}/summary
export const updateProgressSummary = functions.firestore
  .document('users/{uid}/progress/{gameId}')
  .onWrite(async (change, context) => {
    // Calculate totals, skill levels, recommendations
    // Write to summary doc
  });
```

---

## 🚀 Quick Start

### 1. Navigate to Games Gallery

```
http://localhost:5174/kids/games-gallery
```

### 2. Sample Games

8 games pre-loaded across phases P0-P8:
- Balloon Pop (P1, free)
- Rhyme Time (P0, free)
- Blend Master (P2, premium)
- Digraph Detective (P3, premium)
- Syllable Split (P6, free)
- Vowel Team Race (P4, premium)
- Fluency Sprint (P8, free)
- Comprehension Quest (P8, premium)

### 3. Test Filters

- Select Phase P1 → see "Balloon Pop"
- Filter by "Easy" difficulty
- Search "rhyme"
- Toggle "Only free games"
- Change sort to "Name (A-Z)"

---

## 📝 Next Steps

### Immediate TODOs

1. **Game Hub Page** (`/kids/game/:slug`)
   - Game description
   - Learning goals list
   - Start/Resume button
   - Progress stats
   - Achievements/badges

2. **Phase Quest Page** (`/kids/quest/:phaseId`)
   - Phase overview
   - All games in phase
   - Completion percentage
   - Unlock next phase logic

3. **useProgress Hook**
   - Firestore subscription
   - Local cache layer
   - Optimistic updates

4. **Progress Sync**
   - Write progress on game completion
   - Trigger Cloud Function
   - Update summary doc

5. **Feature Flags**
   - `useFeatureFlags()` hook
   - Show/hide WIP games
   - Beta tester access

---

## 🎯 Design Decisions

### Why Context over Redux?

- **Simplicity**: Small state surface (filters, search, sort)
- **Performance**: Memoized selectors prevent re-renders
- **Locality**: Catalog state only used in game pages

### Why Sample Data?

- **Development speed**: Test UI without Firestore setup
- **Type safety**: Validate GameMeta structure
- **Demo ready**: Show features to stakeholders

### Why Prefetch on Hover?

- **UX**: Instant navigation feels snappy
- **Low cost**: Only prefetches on user intent
- **Progressive**: Works without, better with

---

## 📊 Component Checklist

✅ GameCard - Badge, thumb, progress, CTA  
✅ GameGrid - Responsive, skeletons, empty state  
✅ GameFilters - Phase, area, difficulty, duration  
✅ GalleryHeader - Search, parent toggle  
✅ ProgressBar - Gradient fill, percentage  
✅ RatingStars - Read-only/interactive modes  
✅ SkillTags - Compact chips with overflow  
✅ GameCatalogContext - Global filter state  
✅ Routes - `/kids/games-gallery` wired up  
⬜ useProgress - Firestore integration  
⬜ Game Hub - Individual game pages  
⬜ Phase Quest - Phase overview pages  

---

## 🏁 Summary

**What's built**:
- Complete game catalog UI
- Smart filtering & sorting
- Parent/kid mode toggle
- Responsive, accessible, performant

**What's next**:
- Firestore integration
- Progress tracking
- Game hub pages
- Phase quest pages

**Ready to ship**: The UI foundation is production-ready and can be filled with real game data whenever Firestore is configured!
