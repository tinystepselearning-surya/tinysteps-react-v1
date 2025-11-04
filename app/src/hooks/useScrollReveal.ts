import { useEffect, useRef } from "react";

type ScrollRevealVariant = "up" | "down" | "left" | "right" | "zoom";

type ScrollRevealOptions = {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
  variant?: ScrollRevealVariant;
  delay?: number;
};

/**
 * Adds a smooth intersection observer powered entrance animation.
 * Returns a ref to attach to any element you want to reveal.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>({
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.2,
  once = true,
  variant = "up",
  delay = 0,
}: ScrollRevealOptions = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    node.classList.add("scroll-reveal");
    node.dataset.revealVariant = variant;
    if (delay) {
      node.style.setProperty("--scroll-reveal-delay", `${delay}ms`);
    } else {
      node.style.removeProperty("--scroll-reveal-delay");
    }

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("scroll-reveal--visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== node) return;

          if (entry.isIntersecting) {
            node.classList.add("scroll-reveal--visible");
            if (once) observer.unobserve(node);
          } else if (!once) {
            node.classList.remove("scroll-reveal--visible");
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, once, variant, delay]);

  return ref;
}
