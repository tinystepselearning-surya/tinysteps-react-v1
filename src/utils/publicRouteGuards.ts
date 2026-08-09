const PROTECTED_APP_ROUTE_PREFIXES = [
  '/surya',
  '/admin',
  '/teacher',
  '/parent',
  '/kids',
  '/kid',
  '/messages',
  '/learning-partner/dashboard',
  '/learningpartner/dashboard',
  '/school',
];

const AUTH_ENTRY_ROUTES = new Set([
  '/login',
  '/surya/login',
  '/admin/login',
  '/teacher/login',
  '/parent/login',
  '/learning-partner/login',
  '/learningpartner/login',
  '/school/login',
  '/kid/login',
]);

export const normalizePathname = (pathname: string): string => {
  const lower = pathname.toLowerCase();

  if (lower !== '/' && lower.endsWith('/')) {
    return lower.replace(/\/+$/, '');
  }

  return lower;
};

const matchesRoutePrefix = (
  pathname: string,
  prefix: string,
) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isProtectedAppRoute = (
  pathname: string,
): boolean => {
  const normalizedPath = normalizePathname(pathname);

  return PROTECTED_APP_ROUTE_PREFIXES.some((prefix) =>
    matchesRoutePrefix(normalizedPath, prefix),
  );
};

export const isAuthEntryRoute = (
  pathname: string,
): boolean => {
  const normalizedPath = normalizePathname(pathname);

  return AUTH_ENTRY_ROUTES.has(normalizedPath);
};

export const shouldShowPublicSupportWidgets = (
  pathname: string,
): boolean => {
  const normalizedPath = normalizePathname(pathname);

  return (
    !isProtectedAppRoute(normalizedPath) &&
    !isAuthEntryRoute(normalizedPath)
  );
};
