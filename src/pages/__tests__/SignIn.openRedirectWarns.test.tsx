import { render } from '@testing-library/react';
import * as rrd from 'react-router-dom';
import { vi } from 'vitest';

import SignIn from '@/pages/SignIn';

it('warns when redirect query is unsafe', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const params = new URLSearchParams('redirect=https://evil.com');
  vi.spyOn(rrd, 'useSearchParams').mockReturnValue([params, vi.fn()] as any);
  render(<SignIn />);
  expect(warn).toHaveBeenCalledWith('Blocked unsafe redirect', 'https://evil.com');
  warn.mockRestore();
});
