import { useEffect, useRef } from 'react'
import { useProgress } from '../state/AppState'
import { useMarketIndex } from './useCatalog'
import { watchCheck } from '../lib/watchlist'
import type { WatchEntry } from '../lib/progress'

const CHECK_EVERY_MS = 10 * 60_000
const FIRST_CHECK_MS = 30_000

// раз в 10 минут смотрим цены из слежки. маркет сам кэширует на 15 минут, так что запросов немного
export function useWatchNotifier(): void {
  const { progress, update } = useProgress()
  const index = useMarketIndex()
  const watchRef = useRef(progress.watch)
  watchRef.current = progress.watch
  const indexRef = useRef(index)
  indexRef.current = index

  useEffect(() => {
    if (!window.wf) return
    let stopped = false
    const check = async () => {
      const updates: Record<string, WatchEntry> = {}
      for (const [slug, entry] of Object.entries(watchRef.current)) {
        if (stopped) return
        const res = await window.wf!.marketPrice(slug).catch(() => null)
        if (!res?.ok || !res.data) continue
        const { notify, next } = watchCheck(entry, res.data.sell)
        if (next !== entry) updates[slug] = next
        if (!notify) continue
        const name = indexRef.current.bySlug.get(slug)
        const seller = res.data.sellers[0]?.name
        void window.wf!.notify({
          kind: 'watchlist',
          title: `${name?.ru ?? name?.en ?? slug}: ${res.data.sell} пл`,
          body: `${seller ? `Продаёт ${seller}. ` : ''}Ты ждал цену до ${entry.target} пл.`,
          hash: `/market?q=${encodeURIComponent(name?.en ?? slug)}`,
        })
      }
      if (Object.keys(updates).length) update((s) => ({ ...s, watch: { ...s.watch, ...updates } }))
    }
    const first = window.setTimeout(() => void check(), FIRST_CHECK_MS)
    const id = window.setInterval(() => void check(), CHECK_EVERY_MS)
    return () => {
      stopped = true
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [update])
}
