export const isProfilesRoute = (loc: Location | { pathname: string; search?: string }) => {
  const pathname = (loc.pathname || '').toLowerCase().replace(/\/+$/, '');
  return pathname === '/profiles' || pathname.startsWith('/profiles/');
};

export const isProfilesDashboardView = (loc: Location | { search?: string }) =>
  typeof loc.search === 'string' && /(^|[?&])view=dashboard(&|$)/i.test(loc.search);
