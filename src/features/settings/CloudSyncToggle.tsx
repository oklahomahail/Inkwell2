import { useEffect, useState } from 'react';

export function CloudSyncToggle({
  value,
  onChange,
}: {
  value?: boolean;
  onChange: (v: boolean) => void;
}) {
  const [checked, setChecked] = useState(
    Boolean(value ?? import.meta.env.VITE_ENABLE_SUPABASE_SYNC === 'true'),
  );

  useEffect(() => {
    onChange(checked);
  }, [checked, onChange]);

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      <span>Enable cloud sync (local‑first remains active)</span>
    </label>
  );
}
