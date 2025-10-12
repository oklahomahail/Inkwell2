export const isProfilesRoute = (loc: Location | { pathname?: string }) => {
  const pathname = (loc.pathname ?? '').toLowerCase().replace(/\/+$/, '');
  return pathname === '/profiles' || pathname.startsWith('/profiles/');
};

export const shouldBlockTourHere = (loc: Location) => {
  // extend this as needed
  return isProfilesRoute(loc);
};
