import { useNavigate } from 'react-router-dom';

/** Wrapper so tests can vi.mock this module without touching react-router-dom. */
export function useGo() {
  const navigate = useNavigate();
  return (to: string, opts?: { replace?: boolean }) => navigate(to, opts);
}
