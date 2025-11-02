/**
 * BackgroundStage - Animated Backgrounds for Balloon Pop IPA
 * 
 * 6 themes that cycle every 5 rounds:
 * 1. Sky Day - Animated clouds
 * 2. Undersea - Rising bubbles
 * 3. Space - Twinkling stars
 * 4. Fairy Garden - Floating fireflies
 * 5. Aurora - Animated gradient sweep
 * 6. Candy Land - Parallax stripes with sparkles
 * 
 * All effects are CSS/SVG-based for performance.
 * Respects reduced motion preference.
 */

import React, { useMemo } from 'react';

interface BackgroundStageProps {
  themeId: number; // 0-5
  reducedMotion?: boolean;
}

const THEME_NAMES = [
  'Sky Day',
  'Undersea',
  'Space',
  'Fairy Garden',
  'Aurora',
  'Candy Land',
];

export { THEME_NAMES };

const BackgroundStage: React.FC<BackgroundStageProps> = ({ 
  themeId, 
  reducedMotion = false 
}) => {
  const theme = themeId % 6;

  // Generate particles for themes that need them
  const particles = useMemo(() => {
    if (reducedMotion) return [];
    
    const count = theme === 1 ? 15 : theme === 3 ? 12 : theme === 5 ? 10 : 0;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }));
  }, [theme, reducedMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Theme 0: Sky Day */}
      {theme === 0 && (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-blue-200">
          {!reducedMotion && (
            <>
              {/* Cloud 1 */}
              <div 
                className="absolute top-[10%] w-64 h-32 bg-white/40 rounded-full blur-xl"
                style={{ 
                  animation: 'float-cloud-1 40s ease-in-out infinite',
                  left: '-10%'
                }}
              />
              {/* Cloud 2 */}
              <div 
                className="absolute top-[30%] w-48 h-24 bg-white/30 rounded-full blur-lg"
                style={{ 
                  animation: 'float-cloud-2 35s ease-in-out infinite',
                  left: '20%'
                }}
              />
              {/* Cloud 3 */}
              <div 
                className="absolute top-[50%] w-56 h-28 bg-white/35 rounded-full blur-xl"
                style={{ 
                  animation: 'float-cloud-3 45s ease-in-out infinite',
                  left: '60%'
                }}
              />
              <style>{`
                @keyframes float-cloud-1 {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(120vw); }
                }
                @keyframes float-cloud-2 {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(110vw); }
                }
                @keyframes float-cloud-3 {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(100vw); }
                }
              `}</style>
            </>
          )}
        </div>
      )}

      {/* Theme 1: Undersea */}
      {theme === 1 && (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500 via-cyan-500 to-teal-400">
          {!reducedMotion && particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white/20 border border-white/30"
              style={{
                left: `${p.x}%`,
                bottom: '-5%',
                width: `${p.size}px`,
                height: `${p.size}px`,
                animation: `bubble-rise ${p.duration}s ease-in infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
          {!reducedMotion && (
            <style>{`
              @keyframes bubble-rise {
                0% { transform: translateY(0) scale(0.8); opacity: 0.4; }
                50% { opacity: 0.7; }
                100% { transform: translateY(-110vh) scale(1.2); opacity: 0; }
              }
            `}</style>
          )}
        </div>
      )}

      {/* Theme 2: Space */}
      {theme === 2 && (
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900">
          {/* Stars */}
          {!reducedMotion && Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
          {/* Planet */}
          <div 
            className="absolute top-[20%] right-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-orange-300 to-red-400 opacity-80 blur-sm"
            style={{
              animation: reducedMotion ? 'none' : 'float-planet 20s ease-in-out infinite',
            }}
          />
          {!reducedMotion && (
            <style>{`
              @keyframes twinkle {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
              }
              @keyframes float-planet {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
              }
            `}</style>
          )}
        </div>
      )}

      {/* Theme 3: Fairy Garden */}
      {theme === 3 && (
        <div className="absolute inset-0 bg-gradient-to-b from-green-400 via-emerald-300 to-lime-200">
          {/* Fireflies */}
          {!reducedMotion && particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.8)]"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animation: `firefly-float ${p.duration}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
          {!reducedMotion && (
            <style>{`
              @keyframes firefly-float {
                0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                25% { transform: translate(20px, -30px); opacity: 1; }
                50% { transform: translate(-15px, -60px); opacity: 0.7; }
                75% { transform: translate(25px, -40px); opacity: 1; }
              }
            `}</style>
          )}
        </div>
      )}

      {/* Theme 4: Aurora */}
      {theme === 4 && (
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-pink-800 to-indigo-900">
          <div 
            className="absolute inset-0"
            style={{
              background: reducedMotion 
                ? 'radial-gradient(ellipse at 50% 30%, rgba(167, 139, 250, 0.3), transparent 50%)'
                : 'conic-gradient(from 0deg at 50% 30%, rgba(167, 139, 250, 0.4), rgba(236, 72, 153, 0.4), rgba(59, 130, 246, 0.4), rgba(167, 139, 250, 0.4))',
              animation: reducedMotion ? 'none' : 'aurora-sweep 15s linear infinite',
            }}
          />
          {!reducedMotion && (
            <style>{`
              @keyframes aurora-sweep {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          )}
        </div>
      )}

      {/* Theme 5: Candy Land */}
      {theme === 5 && (
        <div className="absolute inset-0 bg-gradient-to-b from-pink-300 via-purple-200 to-blue-200">
          {/* Candy stripes */}
          {!reducedMotion && (
            <>
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255, 255, 255, 0.3) 50px, rgba(255, 255, 255, 0.3) 100px)',
                  animation: 'candy-scroll 30s linear infinite',
                }}
              />
              {/* Sparkles */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute text-yellow-300"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    fontSize: `${p.size}px`,
                    animation: `sparkle ${p.duration}s ease-in-out infinite`,
                    animationDelay: `${p.delay}s`,
                  }}
                >
                  ✨
                </div>
              ))}
              <style>{`
                @keyframes candy-scroll {
                  0% { transform: translateX(0) translateY(0); }
                  100% { transform: translateX(100px) translateY(100px); }
                }
                @keyframes sparkle {
                  0%, 100% { opacity: 0.3; transform: scale(0.8); }
                  50% { opacity: 1; transform: scale(1.2); }
                }
              `}</style>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BackgroundStage;