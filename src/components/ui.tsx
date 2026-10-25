import { useState, type ReactNode } from 'react'
import { imageUrl } from '../lib/api'
import { formatRelative } from '../lib/time'
import type { Tier as TierValue } from '../data/frames'
import { TIER_HINT } from '../data/frames'
import { Icon } from './Icon'

interface OrokinProps {
  children: ReactNode
  small?: boolean
  className?: string
}

// золотая рамка, только для главного блока на странице
export function Orokin({ children, small, className = '' }: OrokinProps) {
  return (
    <div className={`orokin ${small ? 'orokin--sm' : ''} ${className}`}>
      <div className="orokin__body">{children}</div>
    </div>
  )
}

export function Tier({ tier }: { tier: TierValue }) {
  return (
    <span className={`tier tier--${tier}`} title={`Тир ${tier}: ${TIER_HINT[tier]}`}>
      <span>{tier}</span>
    </span>
  )
}

interface ItemImageProps {
  name?: string
  imageName?: string
  className?: string
}

export function ItemImage({ name, imageName, className }: ItemImageProps) {
  const [failed, setFailed] = useState(false)
  const src = imageUrl(imageName)
  if (!src || failed) return <span className="img-fallback" aria-hidden="true">{name?.[0] ?? '?'}</span>
  return <img src={src} alt={name ?? ''} loading="lazy" className={className} onError={() => setFailed(true)} />
}

export function Loading({ rows = 3, height = 64 }: { rows?: number; height?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  )
}

interface StateProps {
  title: string
  children?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, children, action }: StateProps) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      title="Данные не загрузились"
      action={onRetry && <button className="btn" onClick={onRetry}><Icon name="refresh" size={16} />Повторить</button>}
    >
      {message}. Проверь подключение к интернету.
    </EmptyState>
  )
}

interface FreshnessProps {
  fetchedAt?: number
  stale: boolean
  now: number
  onRefresh?: () => void
}

export function Freshness({ fetchedAt, stale, now, onRefresh }: FreshnessProps) {
  return (
    <span className="stale-note">
      {stale ? <span className="tag tag--kuva">офлайн-копия</span> : <span className="live-dot" aria-hidden="true" />}
      Обновлено {formatRelative(fetchedAt, now)}
      {onRefresh && (
        <button className="btn btn--ghost" onClick={onRefresh} aria-label="Обновить данные">
          <Icon name="refresh" size={15} />
        </button>
      )}
    </span>
  )
}

interface CheckProps {
  checked: boolean
  onChange: () => void
  title: ReactNode
  hint?: ReactNode
}

export function Check({ checked, onChange, title, hint }: CheckProps) {
  return (
    <label className={`check ${checked ? 'check--done' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="check__text">
        <span className="check__title">{title}</span>
        {hint && <span className="small faint" style={{ display: 'block' }}>{hint}</span>}
      </span>
    </label>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="search">
      <Icon name="search" size={16} />
      <input className="input" type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
    </div>
  )
}
