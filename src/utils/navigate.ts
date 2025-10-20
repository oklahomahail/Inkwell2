// Note: We're using a special exception here because this module must import useNavigate
// directly as it is the foundational wrapper for all navigation in the app
// eslint-disable-next-line no-restricted-imports
import { useNavigate } from 'react-router-dom';

/**
 * Wrapper around useNavigate so tests can vi.mock this module without touching react-router-dom.
 * All components should import and use this hook instead of the direct react-router-dom version.
 */
export function useGo() {
  const navigate = useNavigate();
  return (to: string, opts?: { replace?: boolean }) => navigate(to, opts);
}
