import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompanions, useFrames, useMarketIndex, useWeapons } from '../hooks/useCatalog'
import { ALL_PAGES } from '../data/navigation'
import { searchEntries, type SearchEntry } from '../lib/search'
import { wikiKey } from '../lib/text'
import { Icon } from './Icon'

const LIMIT = 12

function useEntries(open: boolean): SearchEntry[] {
  const { frames } = useFrames()
  const { weapons } = useWeapons()
  const { data: companions } = useCompanions()
  const market = useMarketIndex(open)
  return useMemo(() => {
    const pages = ALL_PAGES.map((p) => ({ label: p.label, hint: p.section, to: p.to, group: 'Разделы' }))
    const item = (to: string, group: string) => (i: { uniqueName: string; name: string; wikiaUrl?: string }) =>
      ({ label: i.name, alt: wikiKey(i.wikiaUrl), hint: group, to: `${to}/${encodeURIComponent(i.uniqueName)}`, group })
    const goods = [...market.bySlug.values()].map((m) => ({ label: m.ru ?? m.en, alt: m.en, hint: 'Цена на рынке', to: `/market?q=${encodeURIComponent(m.en)}`, group: 'Рынок' }))
    return [
      ...pages,
      ...frames.map(item('/frames', 'Варфрейм')),
      ...weapons.map(item('/weapons', 'Оружие')),
      ...(companions ?? []).map(item('/companions', 'Компаньон')),
      ...goods,
    ]
  }, [frames, weapons, companions, market])
}

// поиск по всему приложению: Ctrl+K или кнопка в шапке
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const entries = useEntries(open)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const results = useMemo(() => searchEntries(query, entries, LIMIT), [query, entries])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    window.setTimeout(() => input.current?.focus(), 0)
  }, [open])

  if (!open) return null

  const go = (e: SearchEntry | undefined) => {
    if (!e) return
    onClose()
    navigate(e.to)
  }

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Escape') onClose()
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (ev.key === 'Enter') go(results[active])
  }

  return (
    <div className="palette" role="dialog" aria-modal="true" aria-label="Поиск" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette__box" onKeyDown={onKey}>
        <div className="palette__field">
          <Icon name="search" size={18} />
          <input ref={input} value={query} onChange={(e) => { setQuery(e.target.value); setActive(0) }} placeholder="Фрейм, оружие, предмет или раздел" aria-label="Что найти" />
          <kbd>Esc</kbd>
        </div>
        {query.trim().length >= 2 && (
          <ul className="palette__list" role="listbox">
            {results.length === 0 && <li className="palette__empty">Ничего не нашлось. Попробуй по-английски, например «saryn».</li>}
            {results.map((r, i) => (
              <li key={r.group + r.to} role="option" aria-selected={i === active}>
                <button className={`palette__item ${i === active ? 'is-active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => go(r)}>
                  <span>{r.label}</span>
                  <span className="palette__hint">{r.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim().length < 2 && <p className="palette__empty">Начни вводить. Стрелки выбирают, Enter открывает.</p>}
      </div>
    </div>
  )
}
