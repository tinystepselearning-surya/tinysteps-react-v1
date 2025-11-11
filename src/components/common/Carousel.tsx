import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

type CarouselProps = {
  children: React.ReactNode[];
  autoRotateMs?: number;
  className?: string;
};

export const Carousel: React.FC<CarouselProps> = ({ children, autoRotateMs = 5000, className }) => {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const total = children.length;

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % total), autoRotateMs);
    return () => clearInterval(id);
  }, [autoRotateMs, total]);

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        ref={containerRef}
        className="flex transition-transform duration-500 will-change-transform"
        style={{ transform: `translateX(-${index * 100}%)`, width: `${total * 100}%` }}
      >
        {React.Children.map(children, (child, i) => (
          <div className="w-full shrink-0 grow-0 basis-full px-2">{child}</div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <button className="rounded-full border px-3 py-1 text-sm" onClick={prev} aria-label="Previous">
          ← Previous
        </button>
        <span className="text-sm text-gray-600">
          Slide {index + 1} of {total}
        </span>
        <button className="rounded-full border px-3 py-1 text-sm" onClick={next} aria-label="Next">
          Next →
        </button>
      </div>
    </div>
  );
};

