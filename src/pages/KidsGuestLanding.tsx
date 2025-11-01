import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/kids.css";
import "../styles/kids-landing.css";
import "../styles/kids-planets.css";

type PlanetLink = {
  label: string;
  description: string;
  emoji: string;
  orbit: string;
  color: 'blue' | 'purple' | 'pink';
  animation: 'bounce' | 'pulse' | 'float';
} & (
  | {
      to: string;
      href?: never;
    }
  | {
      href: string;
      to?: never;
    }
);

export default function KidsGuestLanding() {
  const speechRef = useRef<HTMLDivElement | null>(null);
  const mascotRef = useRef<HTMLButtonElement | null>(null);
  const starLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const speech = speechRef.current;
    const mascot = mascotRef.current;
    if (!speech) return;

    const rotateLines = [
      "👏 Great job showing up today! 🌟",
      "🎯 Keep learning and having fun!",
      "🚀 You're a shining star in class!",
      "📚 Every step counts — keep going!",
    ];
    const surpriseLines = [
      "🎉 Bonus tip: teach someone else what you learned!",
      "🔤 Say the ABCs backwards… just kidding! 😄",
      "🧠 Brain stretch: find 3 words that rhyme!",
      "🎯 Mini mission: play 2 games today!",
      "🥳 High five! You’re doing amazing!",
    ];

    let index = 0;
    let interval: number | undefined;

    const fadeToNextLine = () => {
      if (!speech) return;
      speech.classList.add("hide");
      window.setTimeout(() => {
        index = (index + 1) % rotateLines.length;
        speech.textContent = rotateLines[index];
        speech.classList.remove("hide");
      }, 600);
    };

    const startCycle = () => {
      stopCycle();
      interval = window.setInterval(fadeToNextLine, 5000) as unknown as number;
    };

    const stopCycle = () => {
      if (interval) window.clearInterval(interval);
    };

    startCycle();

    const onMascotClick = () => {
      stopCycle();
      if (!speech || !mascotRef.current) return;
      speech.classList.add("hide");
      window.setTimeout(() => {
        speech.textContent = surpriseLines[Math.floor(Math.random() * surpriseLines.length)];
        speech.classList.remove("hide");
      }, 600);

      const mascot = mascotRef.current;
      mascot.classList.remove("pop");
      void mascot.offsetWidth;
      mascot.classList.add("pop");

      window.setTimeout(startCycle, 5000);
    };

    mascot?.addEventListener("click", onMascotClick);
    return () => {
      stopCycle();
      mascot?.removeEventListener("click", onMascotClick);
    };
  }, []);

  useEffect(() => {
    const nebula = document.querySelector<HTMLElement>(".nebula");
    const onScroll = () => {
      if (!nebula) return;
      nebula.style.transform = `translateY(${window.scrollY * 0.1}px) scale(1.05)`;
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const spawnStar = () => {
      const star = document.createElement("div");
      star.className = "falling-star";
      star.style.left = `${Math.random() * 100}vw`;
      const duration = 4 + Math.random() * 5;
      star.style.animationDuration = `${duration}s`;
      const size = 1 + Math.random() * 2;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      document.body.appendChild(star);
      window.setTimeout(() => star.remove(), duration * 1000);
    };
    const id = window.setInterval(spawnStar, 300);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const container = starLayerRef.current;
    if (!container) return;

    const makeInteractiveStar = () => {
      if (!container) return;
      const star = document.createElement("button");
      star.type = "button";
      star.className = "interactive-star";
      star.style.top = `${Math.random() * 90}vh`;
      star.style.left = `${Math.random() * 100}vw`;
      const lifetime = 9000 + Math.random() * 6000;
      const explode = () => {
        star.classList.add("explode");
        star.addEventListener(
          "animationend",
          () => star.remove(),
          { once: true },
        );
      };
      star.addEventListener("click", explode);
      container.appendChild(star);
      window.setTimeout(() => {
        if (star.isConnected) {
          star.classList.add("fade");
          star.addEventListener(
            "animationend",
            () => star.remove(),
            { once: true },
          );
        }
      }, lifetime);
    };

    for (let i = 0; i < 40; i += 1) makeInteractiveStar();
    const id = window.setInterval(makeInteractiveStar, 1200);
    return () => {
      window.clearInterval(id);
      container.innerHTML = "";
    };
  }, []);

  const planetLinks: PlanetLink[] = [
    {
      label: "Play Games!",
      description: "🎮 Fun learning games",
      emoji: "🎮",
      orbit: "orbit-one",
      to: "/kids/games",
      color: "blue",
      animation: "bounce"
    },
    {
      label: "Member Login",
      description: "👋 Welcome back!",
      emoji: "🌟",
      orbit: "orbit-two",
      to: "/login/kids",
      color: "purple",
      animation: "pulse"
    },
    {
      label: "Parent Zone",
      description: "👥 For parents",
      emoji: "🏠",
      orbit: "orbit-three",
      to: "/login/parents",
      color: "pink",
      animation: "float"
    },
  ];

  return (
    <div className="kids-guest">
      <div className="nebula" />
      <div className="stars" />
      <div className="glow-star" />
      <div className="glow-star" />
      <div className="glow-star" />
      <div className="glow-star" />
      <div className="shooting-star" />
      <div className="shooting-star" />
      <div className="shooting-star" />
      <div ref={starLayerRef} className="kids-interactive-stars" />

      <main>
        <section className="kids-hero" aria-label="Welcome">
          <div className="kids-welcome">
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to Tiny Steps! 🚀</h1>
            <p className="text-xl text-blue-200 mb-8">Start your learning adventure!</p>
          </div>
          
          <div className="kids-atlas">
            {planetLinks.map((planet) => {
              const LinkComponent = "to" in planet ? Link : "a";
              const linkProps = "to" in planet 
                ? { to: planet.to } 
                : { href: planet.href, target: "_blank", rel: "noreferrer" };

              return (
                <LinkComponent
                  key={planet.label}
                  {...linkProps}
                  className={`kids-planet kids-planet--${planet.color} kids-planet--${planet.animation} ${planet.orbit}`}
                >
                  <div className="kids-planet__content">
                    <div className="kids-planet__inner">
                      <span className="kids-planet__emoji" role="img" aria-hidden="true">
                        {planet.emoji}
                      </span>
                      <h2 className="kids-planet__label">{planet.label}</h2>
                      <p className="kids-planet__description">{planet.description}</p>
                      {planet.label === "Play Games!" && (
                        <span className="kids-planet__badge">Free!</span>
                      )}
                    </div>
                  </div>
                  <div className="kids-planet__effects">
                    <span className="kids-planet__glow" aria-hidden />
                    <span className="kids-planet__sparkles" aria-hidden />
                    <span className="kids-planet__rings" aria-hidden />
                    <span className="kids-planet__orbit" aria-hidden />
                  </div>
                </LinkComponent>
              );
            })}
          </div>
        </section>
      </main>

      <div className="kids-mascot">
        <button className="kids-mascot__button" ref={mascotRef} title="Tap for a surprise" aria-label="Mascot">
          🚀
        </button>
        <div className="kids-mascot__speech" ref={speechRef}>
          👏 Great job showing up today! <br />© {new Date().getFullYear()} Tiny Steps Learning
        </div>
      </div>
    </div>
  );
}
