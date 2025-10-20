import { render, waitFor } from '@testing-library/react';
import * as rrd from 'react-router-dom';
import { vi } from 'vitest';

import AuthCallback from '@/pages/AuthCallback';

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Missing or invalid code' },
      }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

describe('AuthCallback missing code', () => {
  it('redirects to /sign-in on missing code', async () => {
    const navigate = vi.fn();
    vi.spyOn(rrd, 'useNavigate').mockReturnValue(navigate as any);
    vi.spyOn(rrd, 'useSearchParams').mockReturnValue([new URLSearchParams(''), vi.fn()] as any);
    render(<AuthCallback />);
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/sign-in?error=callback', { replace: true }),
    );
  });
});
