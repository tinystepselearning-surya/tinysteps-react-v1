// src/pages/KidsGamesHub.tsx
import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const KidsGamesHub: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  let kidId = searchParams.get('kidId') || '';

  // Fallback: if no kidId in URL, try localStorage
  useEffect(() => {
    if (!kidId && user?.uid) {
      try {
        const stored = localStorage.getItem(`ts_parent_selected_kid_v1:${user.uid}`);
        if (stored) {
          // Redirect to same page with kidId
          navigate(`/kids/games?kidId=${encodeURIComponent(stored)}`, { replace: true });
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [kidId, user?.uid, navigate]);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-start py-12 px-4 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #050510 0%, #150a2b 35%, #0b2a5e 100%)',
        boxShadow: 'inset 0 0 160px rgba(0,0,0,0.75)',
      }}
    >
      <style>{`
        /* Animations */
        @keyframes twinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, -20px); }
        }
        @keyframes rocketFly {
          0% { transform: translate(-15vw, 20vh) rotate(-25deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translate(115vw, -20vh) rotate(-25deg); opacity: 0; }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        /* Starfield layer (lightweight) */
        .stars-layer::before,
        .stars-layer::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(circle at 10% 15%, white 1px, transparent 1.1px),
            radial-gradient(circle at 80% 20%, white 0.8px, transparent 0.9px),
            radial-gradient(circle at 30% 70%, white 1px, transparent 1.1px),
            radial-gradient(circle at 65% 60%, white 0.9px, transparent 1px);
          background-size: 100px 100px;
        }
        .stars-layer::before {
          animation: drift 100s linear infinite, twinkle 5s ease-in-out infinite;
        }
        .stars-layer::after {
          background-size: 150px 150px;
          animation: drift 150s linear infinite, twinkle 7s ease-in-out infinite 1s;
        }

        /* Mission Card styles */
        .mission-card {
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
          padding: 20px 24px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          transition: transform 200ms ease, box-shadow 200ms ease;
          cursor: pointer;
          text-align: left;
          position: relative;
          overflow: hidden;
        }
        .mission-card:hover {
          transform: scale(1.04);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
        .mission-card:active {
          transform: scale(1.02) scaleY(0.98);
        }
        .mission-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 20px;
          pointer-events: none;
          transition: box-shadow 300ms ease;
        }
        .mission-card.accent-phonics:hover::after { box-shadow: inset 0 0 60px 20px rgba(219, 39, 119, 0.15); }
        .mission-card.accent-grammar:hover::after { box-shadow: inset 0 0 60px 20px rgba(59, 130, 246, 0.15); }
        .mission-card.accent-speaking:hover::after { box-shadow: inset 0 0 60px 20px rgba(16, 185, 129, 0.15); }

        /* Meta info (dots, reward) */
        .meta-row { display: flex; align-items: center; gap: 10px; justify-content: space-between; width: 100%; }
        .dots { display: flex; gap: 6px; align-items: center; }
        .dot { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.5); }
        .dot.dim { opacity: 0.3; }
        .reward { display: flex; align-items: center; gap: 4px; font-size: 14px; color: #FFD700; font-weight: 500; }

        @media (prefers-reduced-motion: reduce) {
          .mission-card, .stars-layer, .rocket { animation: none !important; }
        }
      `}</style>

      {/* Background Layers (non-interactive) */}
      <div className="absolute inset-0 stars-layer pointer-events-none" style={{ zIndex: 0 }} />
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none rocket"
        style={{ zIndex: 5, animation: 'rocketFly 25s linear infinite 2s' }}
        aria-hidden
      >
        <span className="text-2xl opacity-60">🚀</span>
      </div>

      {/* Back Button */}
      <Link
        to={`/kids${kidId ? `?kidId=${kidId}` : ''}`}
        className="absolute top-6 right-6 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-200"
        style={{ zIndex: 40 }}
      >
        ← Back to Kids Portal
      </Link>

      {/* Header */}
      <div className="w-full max-w-6xl mx-auto text-center mb-10" style={{ zIndex: 10 }}>
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl">🚀 Games Hub</h1>
        <p className="text-lg text-purple-300 mt-2">Choose your mission</p>
        
        {/* Warning Banner */}
        {!kidId && (
          <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg max-w-2xl mx-auto">
            <p className="text-yellow-200 font-semibold mb-2">⚠️ No child selected</p>
            <p className="text-yellow-100/80 text-sm mb-3">Please go back to Parent Dashboard and choose a child.</p>
            <Link
              to="/parent"
              className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
            >
              ← Back to Parent Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Primary Mission Card */}
      <div className="w-full max-w-4xl mx-auto mb-12" style={{ zIndex: 10 }}>
        <button
          type="button"
          onClick={() => {
            const qs = searchParams.toString();
            navigate(qs ? `/kids/games/english-excellence?${qs}` : '/kids/games/english-excellence');
          }}
          className="mission-card accent-phonics w-full"
          style={{ animation: 'floaty 7s ease-in-out infinite', minHeight: '180px' }}
        >
          <h2 className="text-4xl font-bold text-purple-300">✨ English Excellence Mission</h2>
          <p className="text-base text-white/90 mt-2">A complete learning journey: sounds → words → sentences → reading → speaking</p>
          <div className="meta-row mt-4">
            <div className="dots" aria-label="Difficulty: Progressive">
              <span className="dot bg-purple-500" />
              <span className="dot bg-purple-500" />
              <span className="dot bg-purple-500" />
            </div>
            <div className="reward text-lg">🎯 Start Learning</div>
          </div>
        </button>
      </div>

      {/* Quick Access Section */}
      <div className="w-full max-w-5xl mx-auto" style={{ zIndex: 10 }}>
        <h3 className="text-2xl font-bold text-white/70 mb-6 text-center">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            id="comet-courier-card"
            type="button"
            onClick={() => navigate(`/kids/games/comet-courier${kidId ? `?kidId=${kidId}` : ''}`)}
            className="mission-card"
            style={{
              animation: 'floaty 7s ease-in-out infinite 0.15s',
              minHeight: '120px',
              background: 'linear-gradient(160deg, rgba(122, 255, 219, 0.16), rgba(255, 176, 94, 0.12))',
              borderColor: 'rgba(122, 255, 219, 0.35)',
            }}
          >
            <h4 className="text-lg font-bold text-emerald-200">Comet Courier</h4>
            <p className="text-xs text-white/80 mt-1">Collect stars. Dodge drones.</p>
          </button>

          {/* Phonics Library */}
          <button
            type="button"
            onClick={() => navigate(`/kids/games/phonics${kidId ? `?kidId=${kidId}` : ''}`)}
            className="mission-card accent-phonics"
            style={{ animation: 'floaty 7s ease-in-out infinite', minHeight: '120px' }}
          >
            <h4 className="text-lg font-bold text-pink-300">Phonics Library</h4>
            <p className="text-xs text-white/70 mt-1">Sounds & letters</p>
          </button>

          {/* Grammar Mission */}
          <button
            type="button"
            onClick={() => navigate(`/kids/games/grammar${kidId ? `?kidId=${kidId}` : ''}`)}
            className="mission-card accent-grammar"
            style={{ animation: 'floaty 7s ease-in-out infinite 0.3s', minHeight: '120px' }}
          >
            <h4 className="text-lg font-bold text-blue-300">Grammar Mission</h4>
            <p className="text-xs text-white/70 mt-1">Build sentences</p>
          </button>

          {/* Speaking Mission */}
          <button
            type="button"
            onClick={() => navigate(`/kids/games/speaking${kidId ? `?kidId=${kidId}` : ''}`)}
            className="mission-card accent-speaking"
            style={{ animation: 'floaty 7s ease-in-out infinite 0.6s', minHeight: '120px' }}
          >
            <h4 className="text-lg font-bold text-teal-300">Speaking Mission</h4>
            <p className="text-xs text-white/70 mt-1">Speak with confidence</p>
          </button>

          {/* SpellBee Practice (Coming Soon) */}
          <button
            type="button"
            disabled
            className="mission-card"
            style={{ minHeight: '120px', opacity: 0.5, cursor: 'not-allowed' }}
          >
            <h4 className="text-lg font-bold text-yellow-300">SpellBee Practice</h4>
            <p className="text-xs text-white/70 mt-1">Coming Soon</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KidsGamesHub;
