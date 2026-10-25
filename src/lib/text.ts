const TAG_RE = /<[^>]{1,40}>/g
const PLACEHOLDER_RE = /\|[A-Z_]{1,30}\|/g

// убираем игровую разметку типа <DT_FIRE_COLOR>
export function cleanGameText(text: string | undefined): string {
  if (!text) return ''
  return text
    .replace(TAG_RE, '')
    .replace(PLACEHOLDER_RE, 'N')
    .replace(/\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((f) => f?.toLowerCase().includes(q))
}

// .../w/Soma_Prime -> 'soma prime'
export function wikiKey(wikiaUrl?: string): string {
  const tail = wikiaUrl?.split('/w/')[1]
  return tail ? decodeURIComponent(tail).replace(/[/_]/g, ' ').toLowerCase() : ''
}
