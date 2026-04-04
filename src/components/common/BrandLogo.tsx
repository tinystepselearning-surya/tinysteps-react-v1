import { cn } from '@components/lib/utils';
import OptimizedImage from '../OptimizedImage';

type BrandLogoVariant = 'header' | 'main';

interface BrandLogoProps {
  alt?: string;
  className?: string;
  height?: number;
  loading?: 'eager' | 'lazy';
  priority?: boolean;
  variant?: BrandLogoVariant;
  width?: number;
}

const BRAND_LOGO_SOURCES: Record<BrandLogoVariant, { png: string; webp: string }> = {
  header: {
    png: '/logo-header-112.png',
    webp: '/logo-header-112.webp',
  },
  main: {
    png: '/logo-main-112.png',
    webp: '/logo-main-112.webp',
  },
};

export default function BrandLogo({
  alt = 'Tiny Steps logo',
  className,
  height = 44,
  loading,
  priority = false,
  variant = 'header',
  width = 44,
}: BrandLogoProps) {
  const source = BRAND_LOGO_SOURCES[variant];

  return (
    <OptimizedImage
      alt={alt}
      src={source.png}
      webpSrc={source.webp}
      width={width}
      height={height}
      priority={priority}
      loading={loading}
      className={cn('object-contain', className)}
    />
  );
}
