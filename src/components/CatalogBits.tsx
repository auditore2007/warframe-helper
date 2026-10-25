import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ShortDrop } from '../lib/types'
import { dropLocationRu, rarityRu } from '../lib/i18n'
import { cleanGameText } from '../lib/text'

export const PAGE_SIZE = 60

const RARITY_CLASS: Record<string, string> = {
  Common: 'rarity--common',
  Uncommon: 'rarity--uncommon',
  Rare: 'rarity--rare',
  Legendary: 'rarity--legendary',
}

export function rarityClass(rarity?: string): string {
  return rarity ? RARITY_CLASS[rarity] ?? '' : ''
}

export function DropList({ drops, limit = 3 }: { drops: ShortDrop[]; limit?: number }) {
  if (drops.length === 0) return <div className="small faint">Не выпадает в миссиях: магазин синдиката, Баро или событие</div>
  return (
    <ul className="clean part__drops" style={{ gridColumn: 'auto' }}>
      {drops.slice(0, limit).map((d) => (
        <li key={d.location}>
          <span>{dropLocationRu(d.location)}{d.rarity ? <span className="faint">, {rarityRu(d.rarity).toLowerCase()}</span> : null}</span>
          <span className="num">{d.chance}%</span>
        </li>
      ))}
    </ul>
  )
}

export function StatLines({ stats }: { stats: string[] }) {
  const lines = stats.flatMap((s) => cleanGameText(s).split('\n')).filter(Boolean)
  if (lines.length === 0) return null
  return (
    <div className="small" style={{ whiteSpace: 'pre-line' }}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  )
}

export function ShowMore({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (total <= shown) return null
  return (
    <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
      <button className="btn" onClick={onMore}>Показать ещё {Math.min(PAGE_SIZE * 2, total - shown)}</button>
    </div>
  )
}

// ?q= в адресе, чтобы можно было кинуть ссылку прямо на поиск
export function useQueryParam(): [string, (v: string) => void] {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  useEffect(() => {
    const q = params.get('q')
    if (q !== null) setQuery(q)
  }, [params])
  return [query, setQuery]
}
