import { useEffect, useMemo, useRef, useState } from 'react'
import type { PricePoint } from '../lib/types'

const HEIGHT = 170
const VOLUME_HEIGHT = 36
const PAD = { top: 10, right: 12, bottom: 22, left: 40 }
const Y_TICKS = 4

interface Props {
  points: PricePoint[]
  /** 'day' - подписи датами, 'hour' - часами */
  unit: 'day' | 'hour'
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

const fmtTime = (t: number, unit: Props['unit']) =>
  unit === 'day'
    ? new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : new Date(t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

// медиана сделок линией, разброс мин-макс полосой, объём отдельной полоской снизу
export function PriceChart({ points, unit }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const geo = useMemo(() => {
    const t0 = points[0]?.t ?? 0
    const t1 = points[points.length - 1]?.t ?? 1
    const values = points.flatMap((p) => [p.median, p.min ?? p.median, p.max ?? p.median])
    const lo = Math.floor(Math.min(...values) * 0.95)
    const hi = Math.ceil(Math.max(...values) * 1.05)
    const innerW = width - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const x = (t: number) => PAD.left + (t1 === t0 ? innerW / 2 : ((t - t0) / (t1 - t0)) * innerW)
    const y = (v: number) => PAD.top + innerH - ((v - lo) / Math.max(1, hi - lo)) * innerH
    const maxVol = Math.max(1, ...points.map((p) => p.volume))
    return { x, y, lo, hi, innerW, maxVol }
  }, [points, width])

  if (points.length < 2) return <p className="small faint">Мало сделок, график не построить.</p>

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${geo.x(p.t).toFixed(1)},${geo.y(p.median).toFixed(1)}`).join('')
  const band =
    points.map((p, i) => `${i ? 'L' : 'M'}${geo.x(p.t).toFixed(1)},${geo.y(p.max ?? p.median).toFixed(1)}`).join('') +
    [...points].reverse().map((p) => `L${geo.x(p.t).toFixed(1)},${geo.y(p.min ?? p.median).toFixed(1)}`).join('') + 'Z'
  const ticks = Array.from({ length: Y_TICKS + 1 }, (_, i) => Math.round(geo.lo + ((geo.hi - geo.lo) * i) / Y_TICKS))
  const barW = Math.max(1, geo.innerW / points.length - 2)
  const hp = hover !== null ? points[hover] : null

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - box.left + PAD.left
    let best = 0
    for (let i = 1; i < points.length; i++) if (Math.abs(geo.x(points[i].t) - px) < Math.abs(geo.x(points[best].t) - px)) best = i
    setHover(best)
  }

  return (
    <div ref={ref} className="chart" style={{ position: 'relative' }}>
      <svg width={width} height={HEIGHT} role="img" aria-label="Медианная цена сделок">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={geo.y(v)} y2={geo.y(v)} className="chart__grid" />
            <text x={PAD.left - 6} y={geo.y(v) + 4} textAnchor="end" className="chart__axis">{v}</text>
          </g>
        ))}
        <text x={PAD.left} y={HEIGHT - 4} className="chart__axis">{fmtTime(points[0].t, unit)}</text>
        <text x={width - PAD.right} y={HEIGHT - 4} textAnchor="end" className="chart__axis">{fmtTime(points[points.length - 1].t, unit)}</text>
        <path d={band} className="chart__band" />
        <path d={line} className="chart__line" />
        {hp && (
          <>
            <line x1={geo.x(hp.t)} x2={geo.x(hp.t)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="chart__cross" />
            <circle cx={geo.x(hp.t)} cy={geo.y(hp.median)} r={4} className="chart__dot" />
          </>
        )}
        <rect x={PAD.left} y={0} width={geo.innerW} height={HEIGHT} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      <svg width={width} height={VOLUME_HEIGHT} aria-label="Количество сделок">
        {points.map((p, i) => {
          const h = Math.max(1, (p.volume / geo.maxVol) * (VOLUME_HEIGHT - 4))
          return <rect key={p.t} x={geo.x(p.t) - barW / 2} y={VOLUME_HEIGHT - h} width={barW} height={h} rx={1} className={`chart__vol ${hover === i ? 'chart__vol--on' : ''}`} />
        })}
      </svg>
      {hp && (
        <div className="chart__tip" style={{ left: Math.min(geo.x(hp.t) + 10, width - 170) }}>
          <div className="faint">{fmtTime(hp.t, unit)}</div>
          <div>Медиана <span className="num">{hp.median} пл</span></div>
          {hp.min !== null && hp.max !== null && <div className="muted">от {hp.min} до {hp.max}</div>}
          <div className="muted">Сделок: <span className="num">{hp.volume}</span></div>
        </div>
      )}
    </div>
  )
}
