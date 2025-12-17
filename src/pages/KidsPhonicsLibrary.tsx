// src/pages/KidsPhonicsLibrary.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const KidsPhonicsLibrary: React.FC = () => {
  const navigate = useNavigate();

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
        .library-card { padding:20px 22px; border-radius:18px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); backdrop-filter:blur(8px); min-height:140px; display:flex; flex-direction:column; justify-content:space-between; cursor:pointer; transition:transform .18s ease, box-shadow .18s ease; }
        .library-card:hover { transform:translateY(-6px) scale(1.02); box-shadow:0 12px 40px rgba(0,0,0,0.5); }
        .library-card:active { transform:scale(0.99); }
        .library-card.disabled { opacity:0.5; cursor:not-allowed; transform:none; box-shadow:none; }

        @media (prefers-reduced-motion: reduce) { .library-stars, .comet, .library-card { animation:none !important; transition:none !important; } }
      `}</style>

      <div className="absolute inset-0 library-stars" aria-hidden />
      <div className="comet" aria-hidden />

      <Link
        to="/kids/games"
        className="absolute top-6 right-6 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-200"
        style={{ zIndex: 40 }}
      >
        ← Back to Games Hub
      </Link>

      <div className="w-full max-w-6xl mx-auto text-center mb-10" style={{ zIndex: 10 }}>
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl">Phonics Library</h1>
        <p className="text-lg text-purple-300 mt-2">Choose a game</p>
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8" style={{ zIndex: 10 }}>
        <button
          type="button"
          onClick={() => navigate('/kids/games/phonics/letter-sound')}
          aria-label="Open Letter to Sound Match game"
          className="library-card"
        >
          <div>
            <h3 className="text-2xl font-bold text-pink-300">Letter → Sound Match</h3>
            <p className="text-sm text-white/80 mt-2">Age 3–5 — Match letter to its sound</p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-yellow-300 font-semibold">Start</div>
            <div className="text-sm text-white/60">⭐ Simple</div>
          </div>
        </button>

        <div className="library-card disabled" aria-hidden>
          <div>
            <h3 className="text-2xl font-bold text-blue-300">Picture → Starting Sound</h3>
            <p className="text-sm text-white/80 mt-2">Coming soon</p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-white/60">—</div>
            <div className="text-sm text-white/60">Coming Soon</div>
          </div>
        </div>

        <div className="library-card disabled" aria-hidden>
          <div>
            <h3 className="text-2xl font-bold text-teal-300">Blend the Sounds</h3>
            <p className="text-sm text-white/80 mt-2">Coming soon</p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-white/60">—</div>
            <div className="text-sm text-white/60">Coming Soon</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsPhonicsLibrary;
