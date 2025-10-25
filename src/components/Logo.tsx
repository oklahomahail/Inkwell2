import { cn } from '@/lib/utils';

type LogoVariant =
  | 'mark-light' // gold feather on white (4.png)
  | 'mark-dark' // gold feather on navy (2.png)
  | 'wordmark-light' // feather + wordmark on white (3.png)
  | 'wordmark-dark' // feather + wordmark on navy (1.png)
  | 'outline-dark' // outlined navy feather (6.png)
  | 'outline-light' // light feather on black (5.png)
  | 'svg-feather-gold' // SVG gold feather (crisp scaling)
  | 'svg-feather-navy'; // SVG navy feather (crisp scaling)

type Props = {
  variant: LogoVariant;
  size?: number; // height in px
  className?: string;
};

const ASSET_MAP: Record<LogoVariant, { src: string; aspectRatio: number; fallback?: string }> = {
  'mark-light': {
    src: '/assets/brand/inkwell-logo-icon-variant-a.png',
    aspectRatio: 1,
    fallback: '/assets/brand/inkwell-logo-icon-512.png',
  }, // square - gold feather on white
  'mark-dark': {
    src: '/assets/brand/inkwell-logo-icon-variant-b.png',
    aspectRatio: 1,
    fallback: '/assets/brand/inkwell-logo-icon-512.png',
  }, // square - gold feather on navy
  'wordmark-light': {
    src: '/assets/brand/inkwell-logo-horizontal.png',
    aspectRatio: 4,
    fallback: '/assets/brand/inkwell-logo-full.png',
  }, // wide - navy text + gold feather on white
  'wordmark-dark': {
    src: '/assets/brand/inkwell-logo-full.png',
    aspectRatio: 4,
    fallback: '/assets/brand/inkwell-logo-horizontal.png',
  }, // wide - gold text + feather on navy
  'outline-dark': {
    src: '/assets/brand/inkwell-logo-icon-variant-c.png',
    aspectRatio: 1,
    fallback: '/assets/brand/inkwell-logo-icon-512.png',
  }, // square - navy outline feather
  'outline-light': {
    src: '/assets/brand/inkwell-logo-icon-variant-d.png',
    aspectRatio: 4,
    fallback: '/assets/brand/inkwell-logo-icon-512.png',
  }, // wide - light on black
  'svg-feather-gold': {
    src: '/assets/brand/inkwell-logo-icon-variant-a.png',
    aspectRatio: 1,
    fallback: '/assets/brand/inkwell-logo-icon-512.png',
  },
  'svg-feather-navy': {
    src: '/assets/brand/inkwell-logo-icon-variant-b.png',
    aspectRatio: 1,
    fallback: '/assets/brand/inkwell-logo-icon-512.png',
  },
};

export default function Logo({ variant, size = 48, className }: Props) {
  const asset = ASSET_MAP[variant];
  const width = Math.round(size * asset.aspectRatio);

  return (
    <img
      src={asset.src}
      alt="Inkwell"
      width={width}
      height={size}
      className={cn('select-none', className)}
      onError={(e) => {
        const currentSrc = e.currentTarget.src;

        // Try the defined fallback first
        if (asset.fallback && !currentSrc.includes(asset.fallback)) {
          e.currentTarget.src = asset.fallback;
        }
        // Last resort: use the main logo icon
        else if (!currentSrc.includes('inkwell-logo-icon-512.png')) {
          e.currentTarget.src = '/assets/brand/inkwell-logo-icon-512.png';
        }
        // Prevent infinite error loop
        else {
          e.currentTarget.onerror = null;
          console.error(`Failed to load logo: ${variant}`, currentSrc);
        }
      }}
    />
  );
}
