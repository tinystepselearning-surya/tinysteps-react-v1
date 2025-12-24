// src/pages/KidsPhonicsLibrary.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

// Stage configuration (matches Parent journey UI)
const STAGES = [
  { id: 'sound_foundations', title: 'Sound Foundations', stageNumber: 1 },
  { id: 'blend_builder', title: 'Blend Builder', stageNumber: 2 },
  { id: 'cvc_word_reader', title: 'CVC Word Reader', stageNumber: 3 },
  { id: 'early_reader_fluency', title: 'Early Reader Fluency', stageNumber: 4 },
  { id: 'rules_track', title: 'Rules Track', stageNumber: 5 },
  { id: 'confident_reader', title: 'Confident Reader', stageNumber: 6 },
];

// Game catalog
const PHONICS_GAMES = [
  {
    id: 'phonics_letter_sound',
    title: 'Letter → Sound Match',
    description: 'Age 3–5 — Match letter to its sound',
    route: '/kids/games/phonics/letter-sound',
    color: 'text-pink-300',
    stageId: 'sound_foundations',
  },
  {
    id: 'phonics_balloon_pop',
    title: 'Balloon Pop (Jolly Levels)',
    description: 'Age 3–8 — Pop the correct letter sound',
    route: '/kids/games/phonics/balloon-pop',
    color: 'text-yellow-300',
    stageId: 'sound_foundations',
  },
  {
    id: 'sound_detective',
    title: 'Sound Detective',
    description: 'Age 3–6 — Hear the sound and tap the picture',
    route: '/kids/games/phonics/sound-detective',
    color: 'text-blue-300',
    stageId: 'sound_foundations',
  },
  {
    id: 'phonics_letter_tracing',
    title: 'Letter Tracing',
    description: 'Age 3–6 — Trace letters from dot to star',
    route: '/kids/games/phonics/letter-tracing',
    color: 'text-green-300',
    stageId: 'sound_foundations',
  },
  // More games will be added here later
];

const KidsPhonicsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';

  const location = useLocation();
  const [recovering, setRecovering] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('sound_foundations');

  // Auto-recover kidId from localStorage if missing in URL
  useEffect(() => {
    if (!kidId) {
      try {
        const stored = localStorage.getItem('ts_active_kid_v1') || null;
        if (stored) {
          setRecovering(true);
          const newParams = new URLSearchParams(searchParams);
          newParams.set('kidId', stored);
          // Redirect to same path with kidId appended, replace history to avoid clutter
          navigate({ pathname: location.pathname, search: newParams.toString() }, { replace: true });
        }
      } catch (e) {
        // ignore storage errors
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist kidId when present so direct opens can recover
  useEffect(() => {
    if (kidId) {
      try {
        localStorage.setItem('ts_active_kid_v1', kidId);
      } catch (e) {
        // ignore storage errors
      } finally {
        // if we were recovering, clear the flag
        if (recovering) setRecovering(false);
      }
    }
  }, [kidId, recovering]);

  // Helper to preserve kidId in all navigation
  const withKid = (path: string) => {
    if (!kidId) return path;
    const sep = path.includes('?') ? '&' : '?';
    return path.includes('kidId=') ? path : `${path}${sep}kidId=${encodeURIComponent(kidId)}`;
  };

  // Fetch game summaries for the selected kid
  const gameSummariesQuery = useQuery({
    queryKey: ['kid-game-summaries', kidId],
    queryFn: async () => {
      if (!kidId) return [];
      
      const q = query(
        collection(db, 'kids', kidId, 'gameSummaries'),
        orderBy('lastPlayedAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
    },
    enabled: !!kidId,
  });

  // Create lookup map by gameId
  const summariesByGameId = useMemo(() => {
    const map: Record<string, any> = {};
    if (gameSummariesQuery.data) {
      gameSummariesQuery.data.forEach((summary: any) => {
        map[summary.gameId || summary.id] = summary;
      });
    }
    return map;
  }, [gameSummariesQuery.data]);

  // Filter games by selected stage
  const filteredGames = useMemo(() => {
    return PHONICS_GAMES.filter(game => game.stageId === selectedStageId);
  }, [selectedStageId]);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-start py-12 px-4 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #050510 0%, #150a2b 35%, #0b2a5e 100%)',
        boxShadow: 'inset 0 0 160px rgba(0,0,0,0.75)',
      }}
    >
      <style>{`
        /* lightweight starfield via pseudo-elements */
        .library-stars::before, .library-stars::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(circle at 10% 15%, white 1px, transparent 1.1px),
            radial-gradient(circle at 80% 20%, white 0.8px, transparent 0.9px),
            radial-gradient(circle at 30% 70%, white 1px, transparent 1.1px),
            radial-gradient(circle at 65% 60%, white 0.9px, transparent 1px);
          background-size: 110px 110px;
        }
        .library-stars::before { animation: slowDrift 120s linear infinite, twinkle 6s ease-in-out infinite; }
        .library-stars::after { background-size: 160px 160px; animation: slowDrift 160s linear infinite, twinkle 8s ease-in-out infinite 2s; }

        @keyframes twinkle { 0%,100%{opacity:0.35}50%{opacity:1} }
        @keyframes slowDrift { 0%{transform:translate(0,0)}100%{transform:translate(20px,-20px)} }

        /* comet */
        .comet { position:absolute; top:10%; left:-10%; width:40vw; height:2px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); opacity:0.5; transform:rotate(-20deg); animation: comet 20s linear infinite 3s; pointer-events:none; }
        @keyframes comet { 0%{transform:translateX(-120vw) rotate(-20deg); opacity:0}10%{opacity:0.6}90%{opacity:0.6}100%{transform:translateX(160vw) rotate(-20deg); opacity:0} }

        /* Cards */
        .library-card { padding:20px 22px; border-radius:18px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); backdrop-filter:blur(8px); min-height:180px; display:flex; flex-direction:column; justify-content:space-between; cursor:pointer; transition:transform .18s ease, box-shadow .18s ease; }
        .library-card:hover { transform:translateY(-6px) scale(1.02); box-shadow:0 12px 40px rgba(0,0,0,0.5); }
        .library-card:active { transform:scale(0.99); }
        .library-card.disabled { opacity:0.5; cursor:not-allowed; transform:none; box-shadow:none; }

        @media (prefers-reduced-motion: reduce) { .library-stars, .comet, .library-card { animation:none !important; transition:none !important; } }
      `}</style>

      <div className="absolute inset-0 library-stars" aria-hidden />
      <div className="comet" aria-hidden />

      <Link
        to={withKid('/kids/games')}
        className="absolute top-6 right-6 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-200"
        style={{ zIndex: 40 }}
      >
        ← Back to Games Hub
      </Link>

      <div className="w-full max-w-6xl mx-auto text-center mb-6" style={{ zIndex: 10 }}>
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl">Phonics Library</h1>
        <p className="text-lg text-purple-300 mt-2">Choose a game</p>
        
        {/* Stage selector tabs */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setSelectedStageId(stage.id)}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedStageId === stage.id
                  ? 'bg-white/20 text-white border-2 border-white/40'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              {stage.stageNumber}. {stage.title}
            </button>
          ))}
        </div>
      </div>

      {/* No kid selected warning (with recovering state to avoid flash) */}
      {!kidId ? (
        recovering ? (
          <div className="w-full max-w-3xl mx-auto mb-6 p-4 text-center" style={{ zIndex: 10 }}>
            Loading…
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto mb-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg" style={{ zIndex: 10 }}>
            <p className="text-yellow-200 font-semibold mb-2">⚠️ No child selected</p>
            <p className="text-yellow-100/80 text-sm mb-3">Please go back and choose a child to track progress.</p>
            <Link
              to={withKid('/parent')}
              className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
            >
              ← Back to Parent Dashboard
            </Link>
          </div>
        )
      ) : null}

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8" style={{ zIndex: 10 }}>
        {filteredGames.map((game) => {
          const summary = summariesByGameId[game.id];
          
          // Determine status badge
          let badge = 'Not started';
          let badgeColor = 'bg-gray-100/20 text-gray-300';
          
          if (summary) {
            if (summary.completionPercent >= 100 || summary.completedLevelCount === 7) {
              badge = 'Completed';
              badgeColor = 'bg-green-500/30 text-green-200';
            } else if (summary.hasResume) {
              badge = 'Continue';
              badgeColor = 'bg-yellow-500/30 text-yellow-200';
            } else if (summary.bestStarsTotal > 0) {
              badge = 'Started';
              badgeColor = 'bg-blue-500/30 text-blue-200';
            }
          }
          
          // Progress bar percentage
          const progressPercent = summary?.completionPercent || 0;
          
          // Button label
          const buttonLabel = summary?.hasResume ? 'Continue' : 'Play';
          
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => navigate(withKid(game.route))}
              aria-label={`Open ${game.title} game`}
              className="library-card"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`text-2xl font-bold ${game.color}`}>{game.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badgeColor}`}>
                    {badge}
                  </span>
                </div>
                <p className="text-sm text-white/80 mt-2">{game.description}</p>
                
                {/* Progress Bar */}
                {kidId && summary && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60">Progress</span>
                      <span className="text-xs font-semibold text-white/90">
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-yellow-300 font-semibold">{buttonLabel}</div>
                {summary && (
                  <div className="text-sm text-white/70">
                    ⭐ {summary.bestStarsTotal || 0}
                  </div>
                )}
              </div>
            </button>
          );
        })}
        
        {/* Coming soon placeholders for empty stages */}
        {filteredGames.length === 0 && (
          <>
            <div className="library-card disabled" aria-hidden>
              <div>
                <h3 className="text-2xl font-bold text-gray-300">More Games Coming</h3>
                <p className="text-sm text-white/80 mt-2">New games for this stage will be added soon</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-white/60">—</div>
                <div className="text-sm text-white/60">Coming Soon</div>
              </div>
            </div>
            <div className="library-card disabled" aria-hidden>
              <div>
                <h3 className="text-2xl font-bold text-gray-300">Stay Tuned</h3>
                <p className="text-sm text-white/80 mt-2">Exciting new content in development</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-white/60">—</div>
                <div className="text-sm text-white/60">Coming Soon</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KidsPhonicsLibrary;
