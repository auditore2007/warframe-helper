export interface SearchEntry {
  label: string
  // второе имя для поиска (английское), не показывается
  alt?: string
  hint: string
  to: string
  group: string
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim()

// 3 - название начинается с запроса, 2 - какое-то слово начинается, 1 - просто содержит
function score(text: string, q: string): number {
  const t = norm(text)
  if (t.startsWith(q)) return 3
  if (t.split(/[\s:()-]+/).some((w) => w.startsWith(q))) return 2
  return t.includes(q) ? 1 : 0
}

export function searchEntries(query: string, entries: SearchEntry[], limit: number): SearchEntry[] {
  const q = norm(query)
  if (q.length < 2) return []
  return entries
    .map((e, i) => ({ e, i, s: Math.max(score(e.label, q), e.alt ? score(e.alt, q) : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.label.length - b.e.label.length || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.e)
}
