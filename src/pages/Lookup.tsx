import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrames, useMarketIndex, useRelics, useWeapons } from '../hooks/useCatalog'
import { useMarketPrices } from '../hooks/useApi'
import { usePlayer, useProgress } from '../state/AppState'
import { buildLookupIndex, findLookup, type LookupHit } from '../lib/lookupMatch'
import { masteryStatus } from '../lib/mastery'
import { partKey } from '../lib/progress'
import { componentRu, dropLocationRu, isPrimaryDropLocation, rarityRu } from '../lib/i18n'
import { RESOURCES } from '../data/resources'
import type { Item, RelicItem } from '../lib/types'

const WIDTH = 360
const MAX_ROWS = 4

function PartInfo({ item, component, slug, relics }: { item: Item; component: string; slug: string | null; relics: RelicItem[] }) {
  const { progress } = useProgress()
  const { data: prices } = useMarketPrices()
  const index = useMarketIndex()
  const part = item.components?.find((c) => c.name === component)
  const owned = Boolean(progress.parts[partKey(item.uniqueName, component)])
  const inRelics = slug
    ? relics.flatMap((r) => r.rewards.filter((x) => x.slug === slug).map((x) => ({ relic: r, reward: x })))
        .sort((a, b) => Number(a.relic.vaulted) - Number(b.relic.vaulted) || (b.reward.intact ?? 0) - (a.reward.intact ?? 0))
    : []
  const drops = (part?.drops ?? []).filter((d) => isPrimaryDropLocation(d.location) && !/Relic/.test(d.location)).sort((a, b) => b.chance - a.chance)
  const price = slug ? prices?.[slug]?.median : undefined
  const ducats = slug ? index.bySlug.get(slug)?.ducats : null
  return (
    <>
      <div className="lookup__title">{item.name}: {componentRu(component)}</div>
      <div className="small muted">
        {price !== undefined && <span className="gold num">{Math.round(price)} пл</span>}
        {ducats ? <span className="num"> · {ducats} дук</span> : null}
        {owned ? <span style={{ color: 'var(--lotus)' }}> · уже есть</span> : progress.goals.includes(item.uniqueName) ? <span> · нужна для цели</span> : null}
      </div>
      {inRelics.length > 0 && (
        <ul className="clean small" style={{ marginTop: 6 }}>
          {inRelics.slice(0, MAX_ROWS).map(({ relic, reward }) => (
            <li key={relic.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{relic.tier} {relic.code} <span className="faint">{reward.rarity ? rarityRu(reward.rarity).toLowerCase() : ''}</span></span>
              <span className={relic.vaulted ? 'faint' : 'num'}>{relic.vaulted ? 'в хранилище' : `${reward.intact ?? '?'}%`}</span>
            </li>
          ))}
        </ul>
      )}
      {inRelics.length === 0 && drops.length > 0 && (
        <ul className="clean small" style={{ marginTop: 6 }}>
          {drops.slice(0, MAX_ROWS).map((d) => (
            <li key={d.location} className="row" style={{ justifyContent: 'space-between' }}><span>{dropLocationRu(d.location)}</span><span className="num">{d.chance}%</span></li>
          ))}
        </ul>
      )}
      {inRelics.length === 0 && drops.length === 0 && <div className="small faint" style={{ marginTop: 6 }}>Не падает с миссий: маркет, синдикат или исследование клана</div>}
    </>
  )
}

function ItemInfo({ item }: { item: Item }) {
  const { xpByUnique, profile } = usePlayer()
  const { progress } = useProgress()
  const status = masteryStatus(item, xpByUnique)
  const parts = (item.components ?? []).filter((c) => progress.parts[partKey(item.uniqueName, c.name)]).length
  return (
    <>
      <div className="lookup__title">{item.name}</div>
      {profile && <div className="small muted">{status.mastered ? 'Вкачан, мастерство получено' : status.seen ? `Ранг ${status.rank} из ${status.maxRank}` : 'Ещё не было, даст мастерство'}</div>}
      {parts > 0 && <div className="small muted">Отмечено частей: {parts}</div>}
    </>
  )
}

function Content({ hit, items, relics }: { hit: LookupHit; items: Map<string, Item>; relics: RelicItem[] }) {
  if (hit.kind === 'resource') {
    const r = RESOURCES.find((x) => x.id === hit.resourceId)
    if (!r) return null
    return (
      <>
        <div className="lookup__title">{r.name}</div>
        <div className="small">Где: {r.where}</div>
        <div className="small muted">Лучше всего: {r.best}</div>
      </>
    )
  }
  const item = items.get(hit.itemId)
  if (!item) return null
  return hit.kind === 'part' ? <PartInfo item={item} component={hit.component} slug={hit.slug} relics={relics} /> : <ItemInfo item={item} />
}

// маленькое окно у курсора: main присылает строки текста вокруг мыши, тут решаем, что это за предмет
export function Lookup() {
  const { frames } = useFrames()
  const { weapons } = useWeapons()
  const { data: relics } = useRelics()
  const index = useMarketIndex()
  const [hit, setHit] = useState<LookupHit | null>(null)
  const box = useRef<HTMLDivElement>(null)

  const items = useMemo(() => new Map([...frames, ...weapons].map((i) => [i.uniqueName, i])), [frames, weapons])
  const lookupIndex = useMemo(() => buildLookupIndex([...items.values()], [...index.bySlug.values()], RESOURCES), [items, index])

  useEffect(() => {
    document.documentElement.classList.add('overlay-mode')
    if (!window.wf) return
    return window.wf.onLookupLines(({ lines }) => {
      const found = findLookup(lines, lookupIndex)
      setHit(found)
      if (!found) void window.wf?.hideLookup()
    })
  }, [lookupIndex])

  useLayoutEffect(() => {
    if (hit && box.current) void window.wf?.showLookup({ width: WIDTH, height: Math.ceil(box.current.getBoundingClientRect().height) + 2 })
  }, [hit])

  return (
    <div ref={box} className="lookup" style={{ width: WIDTH }}>
      {hit && <Content hit={hit} items={items} relics={relics ?? []} />}
    </div>
  )
}
