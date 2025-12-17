// src/pages/KidsPortal.tsx
import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function KidsPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';

  // Helper to preserve kidId in navigation
  const withKid = (path: string) => {
    if (!kidId) return path;
    if (path.includes('kidId=')) return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}kidId=${encodeURIComponent(kidId)}`;
  };

  return (
    <>
      <style>{`
        /* Keyframes */
        @keyframes driftA {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-30px, 30px); }
        }
        @keyframes driftB {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, -40px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes cometFly1 {
          0% { transform: translate(-300px, -300px) rotate(-25deg); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { transform: translate(calc(100vw + 300px), calc(100vh + 300px)) rotate(-25deg); opacity: 0; }
        }
        @keyframes cometFly2 {
          0% { transform: translate(-300px, -300px) rotate(-28deg); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { transform: translate(calc(100vw + 300px), calc(100vh + 300px)) rotate(-28deg); opacity: 0; }
        }
        @keyframes cometFly3 {
          0% { transform: translate(-300px, -300px) rotate(-22deg); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { transform: translate(calc(100vw + 300px), calc(100vh + 300px)) rotate(-22deg); opacity: 0; }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes ringSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes moonOrbit {
          0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
        }
        @keyframes rocketFly {
          0% { transform: translateX(-80px); }
          100% { transform: translateX(calc(100vw + 80px)); }
        }
        @keyframes rocketBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        /* Stars using pseudo-elements (no heavy DOM) */
        .stars-layer::before,
        .stars-layer::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #fff 1px, transparent 1px);
          background-size: 80px 80px;
          opacity: 0.4;
        }
        .stars-layer::before {
          animation: driftA 100s linear infinite, twinkle 3s ease-in-out infinite;
        }
        .stars-layer::after {
          background-size: 120px 120px;
          opacity: 0.3;
          animation: driftB 140s linear infinite, twinkle 4s ease-in-out infinite 1s;
        }
        
        /* Planet styles */
        :root {
          --planetSize: 250px;
          --planetSizeMobile: 230px;
        }
        
        .planet-button {
          position: relative;
          width: var(--planetSizeMobile);
          height: var(--planetSizeMobile);
          border-radius: 50%;
          border: none;
          background: none;
          cursor: pointer;
          transition: transform 0.2s ease, filter 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        @media (min-width: 768px) {
          .planet-button {
            width: var(--planetSize);
            height: var(--planetSize);
          }
        }
        
        .planet-button:hover {
          transform: scale(1.04);
          filter: brightness(1.1);
        }
        
        .planet-button:active {
          transform: scale(1.04) scaleY(0.97);
        }
        
        .planet-surface {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
        }
        
        .planet-base {
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }
        
        .planet-highlight {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.5), transparent 45%);
          pointer-events: none;
        }
        
        .planet-shadow {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 75% 65%, rgba(0,0,0,0.7), transparent 50%);
          pointer-events: none;
        }
        
        .planet-atmosphere {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          pointer-events: none;
        }
        
        .planet-texture {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          opacity: 0.3;
          pointer-events: none;
        }
        
        .planet-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        }
        
        .icon-orb {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.10);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.10), inset 0 -10px 20px rgba(0, 0, 0, 0.1), inset 0 10px 20px rgba(255, 255, 255, 0.15);
          font-size: 32px;
        }
        
        @media (max-width: 768px) {
          .icon-orb {
            width: 52px;
            height: 52px;
            font-size: 28px;
          }
        }
        
        /* Sparkles */
        .sparkles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
        }
        
        .sparkles::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 15% 20%, rgba(255,255,255,0.8) 1px, transparent 2px),
            radial-gradient(circle at 85% 25%, rgba(147,197,253,0.7) 1.5px, transparent 2.5px),
            radial-gradient(circle at 25% 75%, rgba(216,180,254,0.6) 1px, transparent 2px),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.7) 1px, transparent 2px),
            radial-gradient(circle at 45% 35%, rgba(147,197,253,0.5) 1px, transparent 2px),
            radial-gradient(circle at 60% 60%, rgba(255,255,255,0.6) 1.5px, transparent 2.5px),
            radial-gradient(circle at 35% 50%, rgba(216,180,254,0.5) 1px, transparent 2px),
            radial-gradient(circle at 80% 45%, rgba(147,197,253,0.6) 1px, transparent 2px);
          animation: sparkleAnim 4s ease-in-out infinite;
        }
        
        @keyframes sparkleAnim {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .anim {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden" style={{
        background: 'linear-gradient(180deg, #050510 0%, #150a2b 40%, #0b2a5e 100%)',
        boxShadow: 'inset 0 0 160px rgba(0,0,0,0.75)'
      }}>
        {/* Galaxy nebula glows */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
        </div>

        {/* Stars (CSS pseudo-elements) */}
        <div className="stars-layer absolute inset-0 pointer-events-none anim" style={{ zIndex: 10 }} />

        {/* Comets */}
        <div className="absolute inset-0 pointer-events-none anim" style={{ zIndex: 20 }}>
          <div
            className="absolute w-64 h-[2px] anim"
            style={{
              left: '10%',
              top: '15%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0))',
              animation: 'cometFly1 14s linear infinite',
            }}
          />
          <div
            className="absolute w-56 h-[2px] anim"
            style={{
              left: '50%',
              top: '5%',
              background: 'linear-gradient(90deg, rgba(147,197,253,0), rgba(147,197,253,0.9), rgba(147,197,253,0))',
              animation: 'cometFly2 18s linear infinite',
              animationDelay: '6s',
            }}
          />
          <div
            className="absolute w-52 h-[2px] anim"
            style={{
              left: '25%',
              top: '25%',
              background: 'linear-gradient(90deg, rgba(216,180,254,0), rgba(216,180,254,0.9), rgba(216,180,254,0))',
              animation: 'cometFly3 22s linear infinite',
              animationDelay: '11s',
            }}
          />
        </div>

        {/* Distant rocket */}
        <div className="absolute bottom-24 left-0 pointer-events-none anim" style={{ zIndex: 30, animation: 'rocketFly 50s linear infinite' }}>
          <span className="inline-block text-xl opacity-50 anim" style={{ animation: 'rocketBob 3s ease-in-out infinite' }}>
            🚀
          </span>
        </div>

        {/* Content layer */}
        <div className="relative min-h-screen flex flex-col p-6 pointer-events-auto" style={{ zIndex: 40 }}>
          {/* Glass panel behind content */}
          <div className="absolute inset-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 pointer-events-none" style={{ zIndex: -1 }} />

          {/* Sparkles layer */}
          <div className="sparkles anim" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl">
                🚀 Kids Portal
              </h1>
              <p className="text-sm md:text-base text-purple-300 mt-1">Mission Control</p>
            </div>
            <Link
              to={withKid('/parent?tab=kids')}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold rounded-full shadow-xl hover:bg-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              ← Back to Parent
            </Link>
          </div>

          {/* Instruction */}
          <p className="text-center text-2xl md:text-3xl font-bold text-yellow-300 mb-10 drop-shadow-lg">
            Pick a planet!
          </p>

          {/* Orbit trail */}
          <svg 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
            style={{ zIndex: 15, width: '80%', height: '60%', maxWidth: '900px' }}
            viewBox="0 0 900 400"
          >
            <path
              d="M 150 200 Q 300 120, 450 200 T 750 200"
              fill="none"
              stroke="rgba(147, 197, 253, 0.15)"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 4px rgba(147, 197, 253, 0.3))' }}
            />
          </svg>

          {/* Planet Buttons (realistic spheres) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto w-full pb-10">
            {/* Planet 1: Games */}
            <div className="relative anim flex justify-center items-center" style={{ animation: 'floaty 5s ease-in-out infinite', animationDelay: '0s' }}>
              <button
                type="button"
                onClick={() => navigate(withKid('/kids/games'))}
                className="planet-button"
              >
                {/* Planet surface layers */}
                <div className="planet-surface">
                  {/* Base gradient */}
                  <div className="planet-base" style={{
                    background: 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)',
                  }} />
                  
                  {/* Texture */}
                  <div className="planet-texture" style={{
                    background: `
                      radial-gradient(circle at 40% 40%, rgba(255,255,255,0.2), transparent 35%),
                      radial-gradient(circle at 60% 70%, rgba(0,0,0,0.15), transparent 40%),
                      radial-gradient(circle at 30% 80%, rgba(255,255,255,0.1), transparent 30%)
                    `,
                  }} />
                  
                  {/* Highlight */}
                  <div className="planet-highlight" />
                  
                  {/* Shadow */}
                  <div className="planet-shadow" />
                  
                  {/* Atmosphere rim */}
                  <div className="planet-atmosphere" style={{
                    boxShadow: 'inset 0 0 30px rgba(236, 72, 153, 0.6), 0 0 20px rgba(236, 72, 153, 0.3)',
                  }} />
                </div>

                {/* Content */}
                <div className="planet-content">
                  <div className="icon-orb">⭐</div>
                  <h2 className="text-xl font-bold text-white drop-shadow-lg">Games</h2>
                  <p className="text-white/80 text-xs text-center">Play and learn</p>
                </div>
              </button>
            </div>

            {/* Planet 2: Join Class (with Saturn ring) */}
            <div className="relative anim flex justify-center items-center" style={{ animation: 'floaty 5s ease-in-out infinite', animationDelay: '0.7s' }}>
              <button
                onClick={() => alert('Coming soon')}
                className="planet-button"
              >
                {/* Saturn ring back layer */}
                <div
                  className="absolute top-1/2 left-1/2 anim"
                  style={{
                    width: '335px',
                    height: '75px',
                    background: 'linear-gradient(90deg, rgba(147, 197, 253, 0.2), rgba(96, 165, 250, 0.4), rgba(147, 197, 253, 0.2))',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%) rotate(-18deg)',
                    animation: 'ringSpin 140s linear infinite',
                    zIndex: 0,
                    pointerEvents: 'none',
                    filter: 'blur(0.3px)',
                    opacity: 0.45,
                    border: '2px solid rgba(147, 197, 253, 0.3)',
                  }}
                />

                {/* Planet surface layers */}
                <div className="planet-surface">
                  {/* Base gradient */}
                  <div className="planet-base" style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                  }} />
                  
                  {/* Texture */}
                  <div className="planet-texture" style={{
                    background: `
                      radial-gradient(circle at 35% 45%, rgba(255,255,255,0.2), transparent 38%),
                      radial-gradient(circle at 65% 60%, rgba(0,0,0,0.15), transparent 35%),
                      radial-gradient(circle at 50% 80%, rgba(255,255,255,0.12), transparent 32%)
                    `,
                  }} />
                  
                  {/* Highlight */}
                  <div className="planet-highlight" />
                  
                  {/* Shadow */}
                  <div className="planet-shadow" />
                  
                  {/* Atmosphere rim */}
                  <div className="planet-atmosphere" style={{
                    boxShadow: 'inset 0 0 30px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.3)',
                  }} />
                </div>

                {/* Ring front layer */}
                <div
                  className="absolute top-1/2 left-1/2 anim"
                  style={{
                    width: '335px',
                    height: '75px',
                    background: 'linear-gradient(90deg, rgba(147, 197, 253, 0.25), rgba(96, 165, 250, 0.5), rgba(147, 197, 253, 0.25))',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%) rotate(-18deg)',
                    animation: 'ringSpin 140s linear infinite',
                    clipPath: 'polygon(0 0, 100% 0, 100% 42%, 0 42%)',
                    zIndex: 20,
                    pointerEvents: 'none',
                    filter: 'blur(0.3px)',
                    opacity: 0.5,
                    border: '2px solid rgba(147, 197, 253, 0.4)',
                  }}
                />

                {/* Content */}
                <div className="planet-content">
                  <div className="icon-orb">🚀</div>
                  <h2 className="text-xl font-bold text-white drop-shadow-lg">Join Class</h2>
                  <p className="text-white/80 text-xs text-center">Live mission</p>
                </div>
              </button>
            </div>

            {/* Planet 3: Worksheets */}
            <div className="relative anim flex justify-center items-center" style={{ animation: 'floaty 5s ease-in-out infinite', animationDelay: '1.4s' }}>
              <button
                onClick={() => alert('Coming soon')}
                className="planet-button"
              >
                {/* Planet surface layers */}
                <div className="planet-surface">
                  {/* Base gradient */}
                  <div className="planet-base" style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)',
                  }} />
                  
                  {/* Texture */}
                  <div className="planet-texture" style={{
                    background: `
                      radial-gradient(circle at 38% 42%, rgba(255,255,255,0.2), transparent 36%),
                      radial-gradient(circle at 62% 68%, rgba(0,0,0,0.15), transparent 38%),
                      radial-gradient(circle at 45% 75%, rgba(255,255,255,0.1), transparent 30%)
                    `,
                  }} />
                  
                  {/* Highlight */}
                  <div className="planet-highlight" />
                  
                  {/* Shadow */}
                  <div className="planet-shadow" />
                  
                  {/* Atmosphere rim */}
                  <div className="planet-atmosphere" style={{
                    boxShadow: 'inset 0 0 30px rgba(34, 197, 94, 0.6), 0 0 20px rgba(34, 197, 94, 0.3)',
                  }} />
                </div>

                {/* Content */}
                <div className="planet-content">
                  <div className="icon-orb">🪐</div>
                  <h2 className="text-xl font-bold text-white drop-shadow-lg">Worksheets</h2>
                  <p className="text-white/80 text-xs text-center">Practice quests</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
