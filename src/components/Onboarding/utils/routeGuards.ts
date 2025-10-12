// Matches /profiles and /profiles/ with or without query params
export const isProfilesRoute = (loc: Location | { pathname: string; search?: string }) => {
  // Normalize and clean pathname
  const pathname = (loc.pathname || '').toLowerCase().replace(/\/+$/, '');
  const baseMatch = pathname === '/profiles' || pathname.startsWith('/profiles/');

  // Always return true for profiles route - block all profile views
  return baseMatch;
};

// Matches /profiles*?view=dashboard
export const isProfilesDashboardView = (loc: Location | { pathname: string; search?: string }) => {
  const search = new URLSearchParams(loc.search || '');
  return search.get('view') === 'dashboard';
};

export const isProfilesDashboardView = (loc: Location | { search?: string }) =>
  typeof loc.search === 'string' && /(^|[?&])view=dashboard(&|$)/i.test(loc.search);
