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
    src: '/brand/1.svg', // square icon
    aspectRatio: 1,
    fallback: '/brand/2.svg',
  },
  'mark-dark': {
    src: '/brand/1.svg', // square icon
    aspectRatio: 1,
    fallback: '/brand/3.svg',
  },
  'wordmark-light': {
    src: '/brand/2.svg', // square logo with wordmark (light background)
    aspectRatio: 1,
    fallback: '/brand/1.svg',
  },
  'wordmark-dark': {
    src: '/brand/3.svg', // square logo with wordmark (dark background)
    aspectRatio: 1,
    fallback: '/brand/1.svg',
  },
  'outline-dark': {
    src: '/brand/1.svg', // square icon
    aspectRatio: 1,
    fallback: '/brand/3.svg',
  },
  'outline-light': {
    src: '/brand/1.svg', // square icon
    aspectRatio: 1,
    fallback: '/brand/2.svg',
  },
  'svg-feather-gold': {
    src: '/brand/1.svg', // square icon
    aspectRatio: 1,
    fallback: '/brand/2.svg',
  },
  'svg-feather-navy': {
    src: '/brand/1.svg', // square icon
    aspectRatio: 1,
    fallback: '/brand/3.svg',
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
        // Last resort: use the square icon
        else if (!currentSrc.includes('1.svg')) {
          e.currentTarget.src = '/brand/1.svg';
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
