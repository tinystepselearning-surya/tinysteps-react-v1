/**
 * RatingStars.tsx
 * Star rating display (read-only or interactive)
 */

import { motion } from "framer-motion";

interface RatingStarsProps {
  rating: number; // 0-3 (or 0-5 if you prefer)
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function RatingStars({ 
  rating, 
  maxStars = 3,
  size = "md",
  interactive = false,
  onChange
}: RatingStarsProps) {
  const sizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  };
  
  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };
  
  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : "img"} aria-label={`${rating} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const isFilled = i < rating;
        const isPartial = i === Math.floor(rating) && rating % 1 !== 0;
        
        return (
          <motion.button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!interactive}
            whileHover={interactive ? { scale: 1.2 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
            className={`${sizes[size]} ${interactive ? 'cursor-pointer' : 'cursor-default'} transition-transform`}
            aria-label={`${i + 1} star${i !== 0 ? 's' : ''}`}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? isFilled : undefined}
          >
            {isFilled ? (
              <span className="text-amber-400">★</span>
            ) : isPartial ? (
              <span className="relative">
                <span className="text-gray-300">★</span>
                <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${(rating % 1) * 100}%` }}>★</span>
              </span>
            ) : (
              <span className="text-gray-300">★</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
