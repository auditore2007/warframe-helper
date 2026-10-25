import type { ApiResult } from './types'

const API_BASE = 'https://api.warframestat.us'
export const IMG_BASE = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/'

export const TTL = {
  world: 60,
  items: 60 * 60 * 12,
  drops: 60 * 60 * 24,
} as const

// в electron через main (кэш, офлайн), в браузере просто fetch
export async function apiGet<T>(path: string, ttlSeconds: number, force = false): Promise<ApiResult<T>> {
  if (typeof window !== 'undefined' && window.wf) {
    return (await window.wf.apiGet(path, ttlSeconds, force)) as ApiResult<T>
  }
  try {
    const res = await fetch(API_BASE + path)
    if (!res.ok) return { ok: false, error: `Сервер ответил ${res.status}` }
    return { ok: true, data: (await res.json()) as T, fetchedAt: Date.now(), stale: false }
  } catch {
    return { ok: false, error: 'Нет связи с сервером данных' }
  }
}

export function imageUrl(imageName?: string): string | undefined {
  if (!imageName) return undefined
  const base = typeof window !== 'undefined' && window.wf ? 'wfimg://img/' : IMG_BASE
  return base + encodeURIComponent(imageName)
}

export function openExternal(url: string): void {
  if (window.wf) void window.wf.openExternal(url)
  else window.open(url, '_blank', 'noopener')
}

// .../w/Saryn%2FPrime -> Saryn
export function baseKeyFromWiki(wikiaUrl?: string): string | null {
  if (!wikiaUrl) return null
  const tail = wikiaUrl.split('/w/')[1]
  if (!tail) return null
  return decodeURIComponent(tail).split(/[/_]/)[0] || null
}

export function wikiUrl(englishName: string): string {
  return 'https://wiki.warframe.com/w/' + encodeURIComponent(englishName.replace(/ /g, '_'))
}
