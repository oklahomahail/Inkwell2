export function LocalFirstBadge({ online, syncing }: { online: boolean; syncing: boolean }) {
  const label = !online ? 'Offline, saved locally' : syncing ? 'Syncing…' : 'Local‑first, synced';
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border">
      {label}
    </span>
  );
}
