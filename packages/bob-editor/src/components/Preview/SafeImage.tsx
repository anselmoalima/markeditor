import type React from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
}

function sanitizeSrc(src: string | undefined): string | undefined {
  if (!src) return undefined;
  const lower = src.toLowerCase().trim();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) return undefined;
  // Block data: URIs that aren't images
  if (lower.startsWith('data:')) {
    const allowed = [
      'data:image/png',
      'data:image/jpeg',
      'data:image/gif',
      'data:image/webp',
      'data:image/svg+xml',
    ];
    if (!allowed.some((prefix) => lower.startsWith(prefix))) return undefined;
  }
  return src;
}

export function SafeImage({ src, alt, ...rest }: SafeImageProps): JSX.Element | null {
  const safeSrc = sanitizeSrc(src);
  if (!safeSrc) return null;
  return <img src={safeSrc} alt={alt ?? ''} {...rest} />;
}
