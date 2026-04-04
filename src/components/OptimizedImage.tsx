/**
 * OptimizedImage Component
 * Handles:
 * - Lazy loading for below-fold images
 * - Responsive images with srcSet + sizes
 * - Preload for critical LCP images (in <head>, not in body)
 * - WebP via <picture> with JPG/PNG fallback
 */

import React, { ImgHTMLAttributes, useEffect, useMemo } from "react";

type FetchPriority = "high" | "low" | "auto";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string; // fallback (jpg/png/etc)
  alt: string;

  width?: number;
  height?: number;

  /** If true, we preload + eager-load (use only for above-the-fold / LCP candidate) */
  priority?: boolean;

  /** Responsive */
  sizes?: string;
  srcSet?: string;

  /** WebP support (optional) */
  webpSrc?: string;
  webpSrcSet?: string;

  /** Generic alternate formats (AVIF/WebP/etc) */
  sources?: Array<{
    type: string;
    srcSet: string;
    sizes?: string;
  }>;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = false,
  width,
  height,
  sizes,
  srcSet,
  webpSrc,
  webpSrcSet,
  sources,
  className = "",
  ...rest
}) => {
  const normalizedSources = useMemo(
    () =>
      (sources ?? []).filter(
        (source): source is { type: string; srcSet: string; sizes?: string } =>
          Boolean(source?.type && source?.srcSet),
      ),
    [sources],
  );

  const primarySource = normalizedSources[0];
  const preloadHref = primarySource?.srcSet ?? webpSrc ?? src;

  const preloadKey = useMemo(() => {
    // stable key to avoid duplicate <link> tags in <head>
    const s1 = preloadHref || "";
    const s2 = (webpSrcSet ?? srcSet ?? "").trim();
    const s3 = (sizes ?? "").trim();
    return `oi:${s1}::${s2}::${s3}`;
  }, [preloadHref, webpSrcSet, srcSet, sizes]);

  // Preload in <head> (avoids React typing issues + correct HTML placement)
  useEffect(() => {
    if (!priority) return;

    const head = document.head || document.getElementsByTagName("head")[0];
    if (!head) return;

    // Prevent duplicates
    const existing = head.querySelector<HTMLLinkElement>(`link[data-optimized-preload="${preloadKey}"]`);
    if (existing) return;

    const link = document.createElement("link");
    link.setAttribute("rel", "preload");
    link.setAttribute("as", "image");
    link.setAttribute("href", preloadHref);
    link.setAttribute("data-optimized-preload", preloadKey);

    // Hint browser which format is likely used
    if (primarySource?.type) {
      link.setAttribute("type", primarySource.type);
    } else if (webpSrc) {
      link.setAttribute("type", "image/webp");
    }

    // NOTE: these must be lowercase attribute names in HTML
    const effectiveSrcSet =
      (primarySource?.srcSet ?? "").trim() ||
      (webpSrcSet ?? "").trim() ||
      (srcSet ?? "").trim();
    if (effectiveSrcSet) link.setAttribute("imagesrcset", effectiveSrcSet);
    if (primarySource?.sizes ?? sizes) link.setAttribute("imagesizes", primarySource?.sizes ?? sizes ?? "");

    // fetchpriority is supported in Chromium-based browsers
    link.setAttribute("fetchpriority", "high");

    head.appendChild(link);

    return () => {
      // Optional cleanup (keeps head tidy on route changes)
      try {
        head.removeChild(link);
      } catch {
        // ignore
      }
    };
  }, [priority, preloadHref, preloadKey, primarySource, webpSrc, webpSrcSet, srcSet, sizes]);

  const loading: "eager" | "lazy" = priority ? "eager" : "lazy";
  const fetchPriority: FetchPriority = priority ? "high" : "auto";

  const imgCommonProps = {
    ...rest,
    src,
    alt,
    className,
    width,
    height,
    sizes,
    srcSet,
    loading,
    decoding: "async" as const,
    // fetchPriority is not typed in some React/@types versions, so cast safely.
    ...( { fetchPriority } as any ),
  };

  if (normalizedSources.length > 0 || webpSrc || webpSrcSet) {
    return (
      <picture>
        {normalizedSources.map((source) => (
          <source
            key={`${source.type}:${source.srcSet}`}
            type={source.type}
            sizes={source.sizes ?? sizes}
            srcSet={source.srcSet}
          />
        ))}
        <source
          type="image/webp"
          sizes={sizes}
          srcSet={(webpSrcSet ?? webpSrc ?? "").trim() || undefined}
        />
        <img {...imgCommonProps} />
      </picture>
    );
  }

  return <img {...imgCommonProps} />;
};

export default OptimizedImage;
