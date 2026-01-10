export function formatBlogDate(ymd?: string) {
  // If no ymd provided, return today's date in en-IN format
  if (!ymd) return new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(ymd);
  if (!m) {
    // Fallback: try native parsing
    try {
      return new Date(ymd).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return ymd;
    }
  }

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  // Create a UTC date for the given Y-M-D and format it in a fixed timezone
  // This prevents client timezone shifts when parsing 'YYYY-MM-DD'.
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric' });
}

export function isoDateFromYMD(ymd?: string) {
  if (!ymd) return new Date().toISOString();
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(ymd);
  if (!m) return new Date(ymd).toISOString();
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}
