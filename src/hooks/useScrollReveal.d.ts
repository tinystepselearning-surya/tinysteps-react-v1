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
export declare function useScrollReveal<T extends HTMLElement = HTMLElement>({ rootMargin, threshold, once, variant, delay, }?: ScrollRevealOptions): import("react").RefObject<T | null>;
export {};
//# sourceMappingURL=useScrollReveal.d.ts.map