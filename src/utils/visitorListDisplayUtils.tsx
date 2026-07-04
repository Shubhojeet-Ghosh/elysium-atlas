export function truncateMiddle(s?: string) {
  if (!s) return "";
  const start = 6;
  const end = 4;
  if (s.length <= start + end) return s;
  return `${s.slice(0, start)}.....${s.slice(-end)}`;
}

export function truncateVisitorAt(s?: string) {
  if (!s) return "";
  const end = 20;
  if (s.length <= end) return s;
  return `...${s.slice(-end)}`;
}

export function highlightTruncated(full: string, term: string) {
  const t = truncateMiddle(full);
  if (!term.trim()) return t;
  const lower = t.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const idx = lower.indexOf(lowerTerm);
  if (idx === -1) return t;
  return (
    <>
      {t.substring(0, idx)}
      <span className="bg-serene-purple/80 text-white font-semibold">
        {t.substring(idx, idx + term.length)}
      </span>
      {t.substring(idx + term.length)}
    </>
  );
}
