import { useMemo, useState } from 'react'
import { useFrames } from '../hooks/useCatalog'
import { useProgress } from '../state/AppState'
import { baseKeyFromWiki } from '../lib/api'
import { setShardSlot, MAX_SHARDS } from '../lib/shards'
import { SHARD_COLORS, type ShardColor, type ShardSlot } from '../lib/progress'
import { FRAME_GUIDES, ROLE_LABEL } from '../data/frames'
import { FRAME_SHARD_TIPS, ROLE_SHARD_TIPS, SHARD_BY_COLOR, SHARD_FACTS, SHARDS } from '../data/shards'
import type { Item } from '../lib/types'
import { ItemImage, Orokin } from '../components/ui'

const GUIDE_BY_KEY = new Map(FRAME_GUIDES.map((g) => [g.key, g]))

function SlotEditor({ frameId, index, slot }: { frameId: string; index: number; slot: ShardSlot | null }) {
  const { update } = useProgress()
  const set = (next: ShardSlot | null) => update((s) => setShardSlot(s, frameId, index, next))
  const info = slot ? SHARD_BY_COLOR.get(slot.color) : undefined
  return (
    <div className="panel" style={{ padding: 12, borderColor: info?.hex }}>
      <div className="meta-label">Слот {index + 1}</div>
      <select className="input" style={{ width: '100%' }} value={slot?.color ?? ''} aria-label={`Цвет осколка, слот ${index + 1}`}
        onChange={(e) => set(e.target.value ? { color: e.target.value as ShardColor, bonus: 0, tau: slot?.tau ?? false } : null)}>
        <option value="">Пусто</option>
        {SHARD_COLORS.map((c) => <option key={c} value={c}>{SHARD_BY_COLOR.get(c)?.name}</option>)}
      </select>
      {slot && info && (
        <>
          <select className="input" style={{ width: '100%', marginTop: 6 }} value={slot.bonus} aria-label={`Бонус, слот ${index + 1}`}
            onChange={(e) => set({ ...slot, bonus: Number(e.target.value) })}>
            {info.bonuses.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
          </select>
          <label className="row small" style={{ gap: 6, marginTop: 6 }}>
            <input type="checkbox" checked={slot.tau} onChange={() => set({ ...slot, tau: !slot.tau })} />
            Тау-закалённый
          </label>
          <div className="num gold" style={{ marginTop: 4 }}>{slot.tau ? info.bonuses[slot.bonus]?.tau : info.bonuses[slot.bonus]?.normal}</div>
        </>
      )}
    </div>
  )
}

function FramePlanner({ frames }: { frames: Item[] }) {
  const { progress } = useProgress()
  const planned = frames.filter((f) => progress.shards[f.uniqueName])
  const [frameId, setFrameId] = useState<string>(() => planned[0]?.uniqueName ?? '')
  const frame = frames.find((f) => f.uniqueName === frameId)
  const key = baseKeyFromWiki(frame?.wikiaUrl)
  const guide = key ? GUIDE_BY_KEY.get(key) : undefined
  const tip = (key && FRAME_SHARD_TIPS[key]) || (guide ? ROLE_SHARD_TIPS[guide.roles[0]] : null)
  const slots = progress.shards[frameId] ?? Array.from({ length: MAX_SHARDS }, () => null)

  return (
    <Orokin>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: 6 }}>Сборка осколков</h2>
          <p className="small muted" style={{ marginTop: 0 }}>Выбери варфрейм и разложи пять осколков. План хранится на этом компьютере.</p>
        </div>
        <select className="input" value={frameId} onChange={(e) => setFrameId(e.target.value)} aria-label="Варфрейм">
          <option value="">Выбери варфрейм</option>
          {frames.map((f) => <option key={f.uniqueName} value={f.uniqueName}>{f.name}</option>)}
        </select>
      </div>
      {planned.length > 0 && (
        <div className="chips" style={{ margin: '8px 0 14px' }}>
          {planned.map((f) => <button key={f.uniqueName} className="chip" aria-pressed={f.uniqueName === frameId} onClick={() => setFrameId(f.uniqueName)}>{f.name}</button>)}
        </div>
      )}
      {frame && (
        <>
          <div className="row" style={{ gap: 14, margin: '10px 0 14px' }}>
            <div style={{ width: 64, height: 64 }}><ItemImage name={frame.name} imageName={frame.imageName} /></div>
            <div>
              <div>{frame.name}</div>
              {guide && <div className="small faint">{guide.roles.map((r) => ROLE_LABEL[r]).join(' · ')}</div>}
              {tip && <div className="small" style={{ marginTop: 4 }}>Совет: {tip}</div>}
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${MAX_SHARDS}, 1fr)` }}>
            {slots.map((slot, i) => <SlotEditor key={i} frameId={frameId} index={i} slot={slot} />)}
          </div>
        </>
      )}
    </Orokin>
  )
}

export function Shards() {
  const { frames } = useFrames()
  const sorted = useMemo(() => [...frames].sort((a, b) => a.name.localeCompare(b.name, 'ru')), [frames])
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Осколки Архонта</h1>
          <p>Что даёт каждый цвет, где брать и что ставить на фрейм.</p>
        </div>
      </div>
      <FramePlanner frames={sorted} />
      <section className="section">
        <h2 style={{ marginBottom: 12 }}>Цвета и бонусы</h2>
        <div className="grid grid--3">
          {SHARDS.map((s) => (
            <article key={s.color} className="panel" style={{ borderTop: `3px solid ${s.hex}` }}>
              <h3 style={{ color: s.hex }}>{s.name}</h3>
              <div className="small faint" style={{ marginBottom: 8 }}>{s.source}</div>
              <table className="table small">
                <thead><tr><th>Бонус</th><th className="right">Обычный</th><th className="right">Тау</th></tr></thead>
                <tbody>
                  {s.bonuses.map((b) => (
                    <tr key={b.label}><td>{b.label}</td><td className="right num">{b.normal}</td><td className="right num gold">{b.tau}</td></tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <h2 style={{ marginBottom: 12 }}>Что нужно знать</h2>
        <ul className="dots">{SHARD_FACTS.map((f) => <li key={f}>{f}</li>)}</ul>
        <h3 style={{ margin: '16px 0 8px' }}>По ролям</h3>
        <div className="grid grid--2">
          {Object.entries(ROLE_SHARD_TIPS).map(([role, tip]) => (
            <div key={role} className="small"><span className="gold">{ROLE_LABEL[role as keyof typeof ROLE_LABEL]}:</span> {tip}</div>
          ))}
        </div>
      </section>
    </div>
  )
}
