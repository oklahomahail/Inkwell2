export const isProfilesRoute = (loc: Location | { pathname?: string }) => {
  const pathname = (loc.pathname ?? '').toLowerCase().replace(/\/+$/, '');
  return pathname === '/profiles' || pathname.startsWith('/profiles/') || pathname === '/profile';
};

export const shouldBlockTourHere = (loc: Location | { pathname?: string }) => {
  // Block tours on profiles/settings pages
  if (isProfilesRoute(loc)) return true;

  // Check session storage for route-specific suppression
  try {
    const suppressed = sessionStorage.getItem('inkwell:tour:suppress');
    if (suppressed) return true;
  } catch {
    // Ignore storage errors
  }

  return false;
};
