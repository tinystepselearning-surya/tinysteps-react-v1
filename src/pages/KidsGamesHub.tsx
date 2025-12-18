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

      {/* Mission Grid */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8" style={{ zIndex: 10 }}>
        {/* Phonics Mission */}
        <button
          type="button"
          onClick={() => navigate(`/kids/games/phonics${kidId ? `?kidId=${kidId}` : ''}`)}
          className="mission-card accent-phonics"
          style={{ animation: 'floaty 7s ease-in-out infinite' }}
        >
          <h2 className="text-2xl font-bold text-pink-300">Phonics Mission</h2>
          <p className="text-sm text-white/80">Learn sounds and letters.</p>
          <div className="meta-row mt-3">
            <div className="dots" aria-label="Difficulty: 1 of 3">
              <span className="dot bg-pink-500" />
              <span className="dot bg-pink-500 dim" />
              <span className="dot bg-pink-500 dim" />
            </div>
            <div className="reward">⭐ +10</div>
          </div>
        </button>

        {/* Grammar Mission */}
        <button
          type="button"
          onClick={() => navigate(`/kids/games/grammar${kidId ? `?kidId=${kidId}` : ''}`)}
          className="mission-card accent-grammar"
          style={{ animation: 'floaty 7s ease-in-out infinite 0.5s' }}
        >
          <h2 className="text-2xl font-bold text-blue-300">Grammar Mission</h2>
          <p className="text-sm text-white/80">Build strong sentences.</p>
          <div className="meta-row mt-3">
            <div className="dots" aria-label="Difficulty: 2 of 3">
              <span className="dot bg-blue-500" />
              <span className="dot bg-blue-500" />
              <span className="dot bg-blue-500 dim" />
            </div>
            <div className="reward">⭐ +15</div>
          </div>
        </button>

        {/* Speaking Mission */}
        <button
          type="button"
          onClick={() => navigate(`/kids/games/speaking${kidId ? `?kidId=${kidId}` : ''}`)}
          className="mission-card accent-speaking"
          style={{ animation: 'floaty 7s ease-in-out infinite 1s' }}
        >
          <h2 className="text-2xl font-bold text-teal-300">Speaking Mission</h2>
          <p className="text-sm text-white/80">Practice with confidence.</p>
          <div className="meta-row mt-3">
            <div className="dots" aria-label="Difficulty: 2 of 3">
              <span className="dot bg-teal-500" />
              <span className="dot bg-teal-500" />
              <span className="dot bg-teal-500 dim" />
            </div>
            <div className="reward">⭐ +15</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default KidsGamesHub;
