// Conservative detection for obviously broken prerendered canonical pages.
// Google may classify other types of pages as Soft 404; this is not a Google indexing emulator.
const NOT_FOUND_HEADING = /^\s*(?:404\b|page not found\b|article not found\b|unexpected application error\b|this page (?:does not exist|is unavailable)\b)/i;

export function inspectSoft404Prerender({ title = '', headings = [], rootText } = {}) {
  const problems = [];

  if (typeof rootText !== 'string') {
    problems.push('missing rendered #root content');
  } else {
    const normalized = rootText.replace(/\s+/g, ' ').trim();
    if (normalized.length < 120) {
      problems.push(`rendered content is too thin (${normalized.length} characters)`);
    }
  }

  const notFoundSignal = [title, ...headings].find(
    (value) => typeof value === 'string' && NOT_FOUND_HEADING.test(value),
  );
  if (notFoundSignal) {
    problems.push(`not-found/error title or H1: ${notFoundSignal}`);
  }

  return problems;
}
