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

const ASSET_MAP: Record<LogoVariant, { src: string; aspectRatio: number }> = {
  'mark-light': { src: '/brand/4.png', aspectRatio: 1 }, // square - gold feather on white
  'mark-dark': { src: '/brand/2.png', aspectRatio: 1 }, // square - gold feather on navy
  'wordmark-light': { src: '/brand/3.png', aspectRatio: 4 }, // wide - navy text + gold feather on white
  'wordmark-dark': { src: '/brand/1.png', aspectRatio: 4 }, // wide - gold text + feather on navy
  'outline-dark': { src: '/brand/6.png', aspectRatio: 1 }, // square - navy outline feather
  'outline-light': { src: '/brand/5.png', aspectRatio: 4 }, // wide - light on black
  'svg-feather-gold': { src: '/brand/inkwell-feather-gold.svg', aspectRatio: 1 },
  'svg-feather-navy': { src: '/brand/inkwell-feather-navy.svg', aspectRatio: 1 },
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
    />
  );
}
