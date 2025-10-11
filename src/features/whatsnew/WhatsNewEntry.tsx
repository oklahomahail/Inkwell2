import { usePrefs } from '../../services/prefsService'; // Adjust import path as needed

export function WhatsNewEntry() {
  const { get } = usePrefs();

  // Temporarily disabled until tour launch loop is fixed
  if (get('features.whatsNew') !== true) return null;

  return null; // Will be replaced with actual component later
}
