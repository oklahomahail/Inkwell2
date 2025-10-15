import { MAIN_TAGLINE, ALT_TAGLINE } from '@/constants/branding';

export default function BrandHeader() {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-gradient-to-b from-neutral-50 to-white p-5">
      {/* Left: brand + MAIN tagline */}
      <div>
        <h1 className="text-xl font-semibold">Inkwell by Nexus Partners</h1>
        <p className="text-sm text-neutral-600">{MAIN_TAGLINE}</p>
      </div>

      {/* Right: pill with ALT tagline */}
      <div>
        <span
          className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-neutral-700"
          aria-label={ALT_TAGLINE}
        >
          {ALT_TAGLINE}
        </span>
      </div>
    </div>
  );
}
