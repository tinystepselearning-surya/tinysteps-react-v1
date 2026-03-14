import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

export interface BentoProps {
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  className?: string;
  children: React.ReactNode;
}

const toGlowRgba = (glowColor: string, alpha: number) => `rgba(${glowColor}, ${alpha})`;

const MagicBento: React.FC<BentoProps> = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = 400,
  particleCount = 12,
  enableTilt = false,
  glowColor = "132, 0, 255",
  clickEffect = true,
  enableMagnetism = false,
  className = "",
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disableAnimations || !containerRef.current) return;
    const host = containerRef.current;
    const cards = Array.from(host.querySelectorAll<HTMLElement>(".magic-bento-card"));
    if (cards.length === 0) return;
    const hoverParticles = new WeakMap<HTMLElement, HTMLDivElement[]>();

    let raf = 0;

    cards.forEach((card) => {
      card.style.setProperty("--mb-glow-color", glowColor);
      card.style.setProperty("--mb-glow-x", "50%");
      card.style.setProperty("--mb-glow-y", "50%");
      card.style.setProperty("--mb-glow-intensity", "0");
    });

    const spawnParticles = (card: HTMLElement) => {
      if (!enableStars) return;
      const rect = card.getBoundingClientRect();
      for (let i = 0; i < particleCount; i += 1) {
        const dot = document.createElement("div");
        dot.className = "magic-bento-particle";
        dot.style.left = `${Math.random() * rect.width}px`;
        dot.style.top = `${Math.random() * rect.height}px`;
        dot.style.background = toGlowRgba(glowColor, 0.92);
        card.appendChild(dot);
        const dx = (Math.random() - 0.5) * 90;
        const dy = (Math.random() - 0.5) * 90;
        gsap.fromTo(
          dot,
          { opacity: 0, scale: 0 },
          {
            opacity: 0.85,
            scale: 1,
            x: dx,
            y: dy,
            duration: 0.26,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(dot, {
                opacity: 0,
                scale: 0,
                duration: 0.42,
                ease: "power2.in",
                onComplete: () => dot.remove(),
              });
            },
          }
        );
      }
    };

    const startHoverParticles = (card: HTMLElement) => {
      if (!enableStars || hoverParticles.has(card)) return;
      const rect = card.getBoundingClientRect();
      const dots: HTMLDivElement[] = [];
      const count = Math.max(6, Math.round(particleCount * 0.75));

      for (let i = 0; i < count; i += 1) {
        const dot = document.createElement("div");
        dot.className = "magic-bento-particle";
        const size = 3 + Math.random() * 2.2;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.left = `${Math.random() * rect.width}px`;
        dot.style.top = `${Math.random() * rect.height}px`;
        dot.style.background = toGlowRgba(glowColor, 0.95);
        card.appendChild(dot);

        gsap.fromTo(
          dot,
          { opacity: 0, scale: 0.5 },
          { opacity: 0.9, scale: 1, duration: 0.28, ease: "power2.out", delay: i * 0.035 }
        );
        gsap.to(dot, {
          x: (Math.random() - 0.5) * 120,
          y: (Math.random() - 0.5) * 120,
          duration: 2 + Math.random() * 1.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(dot, {
          opacity: 0.22 + Math.random() * 0.6,
          duration: 1 + Math.random() * 1.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        dots.push(dot);
      }

      hoverParticles.set(card, dots);
    };

    const stopHoverParticles = (card: HTMLElement) => {
      const dots = hoverParticles.get(card);
      if (!dots) return;
      dots.forEach((dot) => {
        gsap.killTweensOf(dot);
        gsap.to(dot, {
          opacity: 0,
          scale: 0,
          duration: 0.24,
          ease: "power2.in",
          onComplete: () => dot.remove(),
        });
      });
      hoverParticles.delete(card);
    };

    const handlers = cards.map((card) => {
      const onMove = (e: MouseEvent) => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * 100;
          const relY = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty("--mb-glow-x", `${relX}%`);
          card.style.setProperty("--mb-glow-y", `${relY}%`);
          card.style.setProperty("--mb-glow-intensity", "1");

          if (enableTilt) {
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rx = ((e.clientY - rect.top - cy) / cy) * -4;
            const ry = ((e.clientX - rect.left - cx) / cx) * 4;
            gsap.to(card, { rotateX: rx, rotateY: ry, duration: 0.16, ease: "power2.out" });
          }

          if (enableMagnetism) {
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const mx = (e.clientX - rect.left - cx) * 0.03;
            const my = (e.clientY - rect.top - cy) * 0.03;
            gsap.to(card, { x: mx, y: my, duration: 0.2, ease: "power2.out" });
          }
        });
      };

      const onEnter = () => {
        card.style.setProperty("--mb-glow-intensity", "1");
        startHoverParticles(card);
      };

      const onLeave = () => {
        card.style.setProperty("--mb-glow-intensity", "0");
        gsap.to(card, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.24, ease: "power2.out" });
        stopHoverParticles(card);
      };

      const onClick = (e: MouseEvent) => {
        spawnParticles(card);
        if (!clickEffect) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ripple = document.createElement("span");
        ripple.className = "magic-bento-ripple";
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.background = `radial-gradient(circle, ${toGlowRgba(glowColor, 0.45)} 0%, ${toGlowRgba(
          glowColor,
          0.15
        )} 35%, rgba(0,0,0,0) 72%)`;
        card.appendChild(ripple);
        gsap.fromTo(
          ripple,
          { scale: 0, opacity: 1 },
          {
            scale: 1,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
            onComplete: () => ripple.remove(),
          }
        );
      };

      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
      card.addEventListener("mousemove", onMove);
      card.addEventListener("click", onClick);
      return { card, onEnter, onLeave, onMove, onClick };
    });

    const hostMove = (e: MouseEvent) => {
      if (!enableSpotlight || !spotlightRef.current) return;
      const rect = host.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      gsap.to(spotlightRef.current, {
        opacity: inside ? 1 : 0,
        left: e.clientX - rect.left,
        top: e.clientY - rect.top,
        duration: inside ? 0.18 : 0.35,
        ease: "power2.out",
      });
    };

    host.addEventListener("mousemove", hostMove);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      host.removeEventListener("mousemove", hostMove);
      handlers.forEach(({ card, onEnter, onLeave, onMove, onClick }) => {
        stopHoverParticles(card);
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("mouseleave", onLeave);
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("click", onClick);
      });
    };
  }, [
    clickEffect,
    disableAnimations,
    enableBorderGlow,
    enableMagnetism,
    enableSpotlight,
    enableStars,
    enableTilt,
    glowColor,
    particleCount,
  ]);

  return (
    <div ref={containerRef} className={`magic-bento relative ${className}`} style={{ ["--mb-radius" as string]: `${spotlightRadius}px` }}>
      <style>{`
        .magic-bento .magic-bento-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          pointer-events: none;
          box-shadow: 0 0 10px rgba(var(--mb-glow-color), 0.65);
          z-index: 30;
        }
        .magic-bento .magic-bento-ripple {
          position: absolute;
          width: calc(var(--mb-radius) * 1.5);
          height: calc(var(--mb-radius) * 1.5);
          transform: translate(-50%, -50%);
          border-radius: 999px;
          pointer-events: none;
          z-index: 28;
        }
        .magic-bento .magic-bento-card {
          transform-style: preserve-3d;
          will-change: transform;
          isolation: isolate;
        }
        .magic-bento .magic-bento-card > * {
          position: relative;
          z-index: 3;
        }
        .magic-bento .magic-bento-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          z-index: 1;
          background: linear-gradient(
            150deg,
            rgba(var(--mb-glow-color), 0.14) 0%,
            rgba(var(--mb-glow-color), 0.08) 28%,
            rgba(0, 0, 0, 0) 62%
          );
        }
        .magic-bento .magic-bento-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          opacity: ${enableBorderGlow ? 1 : 0};
          background: radial-gradient(
            var(--mb-radius) circle at var(--mb-glow-x, 50%) var(--mb-glow-y, 50%),
            rgba(var(--mb-glow-color), calc(var(--mb-glow-intensity, 0) * 0.42)) 0%,
            rgba(var(--mb-glow-color), calc(var(--mb-glow-intensity, 0) * 0.18)) 34%,
            rgba(var(--mb-glow-color), 0) 66%
          );
          transition: opacity 180ms ease;
          z-index: 2;
        }
        .magic-bento .magic-bento-title {
          ${textAutoHide ? "-webkit-line-clamp: 1; line-clamp: 1;" : ""}
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .magic-bento .magic-bento-description {
          ${textAutoHide ? "-webkit-line-clamp: 2; line-clamp: 2;" : ""}
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      {enableSpotlight && !disableAnimations && (
        <div
          ref={spotlightRef}
          className="pointer-events-none absolute left-0 top-0 z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 mix-blend-screen"
          style={{
            background: `radial-gradient(circle, ${toGlowRgba(glowColor, 0.15)} 0%, ${toGlowRgba(
              glowColor,
              0.08
            )} 18%, ${toGlowRgba(glowColor, 0.04)} 35%, rgba(0,0,0,0) 72%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

export default MagicBento;
