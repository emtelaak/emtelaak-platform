import { ImgHTMLAttributes } from 'react';

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /**
   * Base image path without extension (e.g., "/properties/property1")
   * The component will automatically append .webp and generate responsive sources
   */
  src: string;
  
  /**
   * Alt text for the image (required for accessibility)
   */
  alt: string;
  
  /**
   * Whether to generate responsive sources (sm, md, lg)
   * Default: true
   */
  responsive?: boolean;
  
  /**
   * Fallback image format if WebP is not supported
   * Default: 'jpg'
   */
  fallbackFormat?: 'jpg' | 'png';
  
  /**
   * Loading strategy
   * Default: 'lazy'
   */
  loading?: 'lazy' | 'eager';
  
  /**
   * Image decoding strategy
   * Default: 'async'
   */
  decoding?: 'async' | 'sync' | 'auto';
}

/**
 * ResponsiveImage component that serves WebP images with responsive sizes
 * 
 * Features:
 * - Automatic WebP format with fallback to JPG/PNG
 * - Responsive image sources for mobile, tablet, and desktop
 * - Lazy loading by default
 * - Async decoding for better performance
 * 
 * Usage:
 * ```tsx
 * // Simple usage
 * <ResponsiveImage src="/properties/property1" alt="Property 1" />
 * 
 * // With custom class
 * <ResponsiveImage 
 *   src="/brand/backgrounds/hero-bg" 
 *   alt="Hero background"
 *   className="w-full h-screen object-cover"
 * />
 * 
 * // Disable responsive sources
 * <ResponsiveImage 
 *   src="/logo" 
 *   alt="Logo"
 *   responsive={false}
 * />
 * ```
 */
export function ResponsiveImage({
  src,
  alt,
  responsive = true,
  fallbackFormat = 'jpg',
  loading = 'lazy',
  decoding = 'async',
  className,
  ...props
}: ResponsiveImageProps) {
  // Remove file extension if present
  const basePath = src.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  
  // Generate WebP sources
  const webpSrc = `${basePath}.webp`;
  const fallbackSrc = `${basePath}.${fallbackFormat}`;
  
  if (!responsive) {
    // Simple picture element without responsive sources
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={fallbackSrc}
          alt={alt}
          loading={loading}
          decoding={decoding}
          className={className}
          {...props}
        />
      </picture>
    );
  }
  
  // Generate responsive sources
  const smWebp = `${basePath}-sm.webp`;
  const mdWebp = `${basePath}-md.webp`;
  const lgWebp = `${basePath}-lg.webp`;
  
  return (
    <picture>
      {/* WebP sources with responsive sizes */}
      <source
        srcSet={`${smWebp} 640w, ${mdWebp} 768w, ${lgWebp} 1024w, ${webpSrc} 1200w`}
        sizes="(max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, 1200px"
        type="image/webp"
      />
      
      {/* Fallback to original format */}
      <img
        src={fallbackSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={className}
        {...props}
      />
    </picture>
  );
}

/**
 * BackgroundImage component for background images with WebP support
 * 
 * Usage:
 * ```tsx
 * <BackgroundImage 
 *   src="/brand/backgrounds/hero-bg"
 *   className="min-h-screen"
 * >
 *   <div>Content here</div>
 * </BackgroundImage>
 * ```
 */
interface BackgroundImageProps {
  src: string;
  children: React.ReactNode;
  className?: string;
  fallbackFormat?: 'jpg' | 'png';
}

export function BackgroundImage({
  src,
  children,
  className = '',
  fallbackFormat = 'jpg',
}: BackgroundImageProps) {
  const basePath = src.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  const webpSrc = `${basePath}.webp`;
  const fallbackSrc = `${basePath}.${fallbackFormat}`;
  
  return (
    <div
      className={className}
      style={{
        backgroundImage: `url('${webpSrc}'), url('${fallbackSrc}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {children}
    </div>
  );
}

/**
 * PropertyImage component specifically for property images with responsive sizes
 * 
 * Usage:
 * ```tsx
 * <PropertyImage 
 *   propertyId="property1"
 *   alt="Luxury Villa in New Cairo"
 *   className="w-full h-64 object-cover rounded-lg"
 * />
 * ```
 */
interface PropertyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  propertyId: string;
  alt: string;
}

export function PropertyImage({ propertyId, alt, ...props }: PropertyImageProps) {
  return (
    <ResponsiveImage
      src={`/properties/${propertyId}`}
      alt={alt}
      responsive={true}
      fallbackFormat="jpg"
      {...props}
    />
  );
}
