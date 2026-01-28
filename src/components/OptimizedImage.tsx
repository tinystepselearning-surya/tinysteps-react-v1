/**
 * OptimizedImage Component
 * Handles:
 * - Lazy loading for below-fold images
 * - Responsive images with srcset
 * - Preload for critical LCP images
 * - WebP format with fallback
 */

import React, { ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  srcSet?: string;
}

/**
 * OptimizedImage component for better Core Web Vitals
 * 
 * @param priority - If true, preload image for LCP optimization (use only for above-fold images)
 * @param src - Image source URL
 * @param alt - Alt text (required for accessibility)
 * @param width - Image natural width (helps prevent layout shift)
 * @param height - Image natural height (helps prevent layout shift)
 * @param sizes - Responsive size descriptor
 * @param srcSet - Responsive image set
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = false,
  width,
  height,
  sizes,
  srcSet,
  className = '',
  ...props
}) => {
  return (
    <>
      {/* Preload link for critical LCP images */}
      {priority && (
        <link
          rel="preload"
          as="image"
          href={src}
          fetchPriority="high"
          imagesrcset={srcSet}
          imagesizes={sizes}
        />
      )}

      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        width={width}
        height={height}
        sizes={sizes}
        srcSet={srcSet}
        {...props}
      />
    </>
  );
};

export default OptimizedImage;
