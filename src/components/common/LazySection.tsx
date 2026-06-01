import { type ReactNode, useEffect, useRef, useState } from 'react';

type LazySectionProps = {
  children: ReactNode;
  rootMargin?: string;
  minHeightClassName?: string;
  fallback?: ReactNode;
};

export default function LazySection({
  children,
  rootMargin = '280px 0px',
  minHeightClassName = 'min-h-[120px]',
  fallback = null,
}: LazySectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    const target = containerRef.current;
    if (!target) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} className={!isVisible ? minHeightClassName : undefined}>
      {isVisible ? children : fallback}
    </div>
  );
}
