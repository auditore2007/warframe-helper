import { useEffect, useMemo, useState } from 'react'
import { useMarketIndex, useRelics, useWorld } from '../hooks/useCatalog'
import { useMarketPrices } from '../hooks/useApi'
import { useNow } from '../hooks/useNow'
import { CYCLES } from '../components/CycleStrip'
import { TimerList } from './Foundry'
import { expectedValue } from '../lib/relicValue'
import { rollCycle } from '../lib/cycles'
import { cycleRu, missionRu } from '../lib/i18n'
import { formatCountdown, msUntil } from '../lib/time'
import type { PriceMap, RelicItem, WorldState } from '../lib/types'
import type { MarketIndex } from '../lib/market'
import { Icon } from '../components/Icon'

const OPACITY_KEY = 'wfh.overlay.opacity'
const DEFAULT_OPACITY = 0.92

function readOpacity(): number {
  try {
    const v = Number(window.localStorage.getItem(OPACITY_KEY))
    return v >= 0.3 && v <= 1 ? v : DEFAULT_OPACITY
  } catch {
    return DEFAULT_OPACITY
  }
}

function Cycles({ world, now }: { world: WorldState; now: number }) {
  return (
    <div className="overlay__grid">
      {CYCLES.map((def) => {
        const cycle = world[def.key]
        if (!cycle) return null
        const { state, expiry } = rollCycle(def.key, cycle, now)
        return (
          <div key={def.key} className="overlay__cell">
            <span className="faint">{def.place}</span>
            <span className={def.alt.includes(state) ? 'gold' : undefined}>{cycleRu(state)} <span className="num muted">{formatCountdown(expiry - now)}</span></span>
          </div>
        )
      })}
    </div>
  )
}

// вбил 'axi a1' - показали цены
function RelicLookup({ relics, prices, index }: { relics: RelicItem[]; prices: PriceMap; index: MarketIndex }) {
  const [query, setQuery] = useState('')
  const relic = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, ' ')
    if (q.length < 3) return null
    return relics.find((r) => `${r.tier} ${r.code}`.toLowerCase() === q) ?? relics.find((r) => `${r.tier} ${r.code}`.toLowerCase().startsWith(q)) ?? null
  }, [relics, query])
  return (
    <div>
      <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Реликвия, например Axi A1" aria-label="Реликвия" />
      {relic && (
        <div style={{ marginTop: 6 }}>
          <div className="row small" style={{ justifyContent: 'space-between' }}>
            <span>{relic.tier} {relic.code}</span>
            <span className="num">целая <span className="gold">{expectedValue(relic.rewards, prices, 'intact').value.toFixed(1)}</span> · сияющая <span className="gold">{expectedValue(relic.rewards, prices, 'radiant').value.toFixed(1)}</span> пл</span>
          </div>
          <ul className="clean small">
            {[...relic.rewards].sort((a, b) => (prices[b.slug ?? '']?.median ?? 0) - (prices[a.slug ?? '']?.median ?? 0)).map((r) => (
              <li key={r.uniqueName ?? r.name} className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">{(r.slug && index.bySlug.get(r.slug)?.ru) || r.name}</span>
                <span className="num">{r.slug && prices[r.slug] ? `${Math.round(prices[r.slug].median)} пл` : '-'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Overlay() {
  const { data: world } = useWorld()
  const { data: relics } = useRelics()
  const { data: prices } = useMarketPrices()
  const index = useMarketIndex()
  const now = useNow()
  const [opacity, setOpacity] = useState(readOpacity)

  useEffect(() => {
    document.documentElement.classList.add('overlay-mode')
    return () => document.documentElement.classList.remove('overlay-mode')
  }, [])

  useEffect(() => {
    void window.wf?.setOverlayOpacity(opacity)
    try {
      window.localStorage.setItem(OPACITY_KEY, String(opacity))
    } catch {
      /* не страшно */
    }
  }, [opacity])

  const baro = world?.voidTrader
  const baroHere = baro && msUntil(baro.activation, now) <= 0

  return (
    <div className="overlay">
      <header className="overlay__bar">
        <span className="overlay__title"><Icon name="sigil" size={16} /> Codex Tenno</span>
        <input type="range" min={0.3} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} aria-label="Прозрачность" title="Прозрачность" className="overlay__nodrag" />
        <button className="btn btn--ghost overlay__nodrag" onClick={() => void window.wf?.hideOverlay()} aria-label="Скрыть оверлей" title="Скрыть (Ctrl+Shift+O)"><Icon name="close" size={15} /></button>
      </header>
      <div className="overlay__body">
        {world && <Cycles world={world} now={now} />}
        {world?.arbitration?.node && !world.arbitration.expired && (
          <p className="small" style={{ margin: 0 }}><span className="faint">Арбитраж:</span> {missionRu(world.arbitration.type)} - {world.arbitration.node}</p>
        )}
        {baro && <p className="small" style={{ margin: 0 }}><span className="faint">Баро:</span> {baroHere ? `на ${baro.location}, уйдёт через` : 'прилетит через'} <span className="num">{formatCountdown(msUntil(baroHere ? baro.expiry : baro.activation, now))}</span></p>}
        <div className="meta-label">Литейная</div>
        <TimerList compact />
        <div className="meta-label">Цена реликвии</div>
        {relics && prices ? <RelicLookup relics={relics} prices={prices} index={index} /> : <p className="small faint">Загружаю цены…</p>}
      </div>
    </div>
  )
}
