import { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { acceleratorLabel, keyToAccelerator } from '../lib/hotkeys'
import type { AppSettings } from '../lib/types'
import { EmptyState, Orokin } from '../components/ui'
import { Icon } from '../components/Icon'

const HOTKEY_LABEL: Record<keyof AppSettings['hotkeys'], string> = {
  overlay: 'Показать / спрятать оверлей',
  rewards: 'Распознать награды разлома',
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className={`check ${checked ? 'check--done' : ''}`} style={{ textDecoration: 'none' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="check__text">
        <span style={{ display: 'block' }}>{label}</span>
        {hint && <span className="small faint">{hint}</span>}
      </span>
    </label>
  )
}

function HotkeyRow({ name, value, failed, onSave }: { name: keyof AppSettings['hotkeys']; value: string; failed: boolean; onSave: (v: string) => void }) {
  const [recording, setRecording] = useState(false)
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '6px 0' }}>
      <span>{HOTKEY_LABEL[name]}</span>
      <span className="row" style={{ gap: 8 }}>
        {failed && <span className="small" style={{ color: 'var(--kuva)' }}>занята другой программой</span>}
        <button
          className={`btn ${recording ? 'btn--gold' : ''}`}
          onClick={() => setRecording(true)}
          onBlur={() => setRecording(false)}
          onKeyDown={(e) => {
            if (!recording) return
            e.preventDefault()
            if (e.code === 'Escape') return setRecording(false)
            const accel = keyToAccelerator(e)
            if (accel) {
              onSave(accel)
              setRecording(false)
            }
          }}
        >
          {recording ? 'Нажми сочетание...' : acceleratorLabel(value)}
        </button>
      </span>
    </div>
  )
}

function AreaPreview({ area }: { area: AppSettings['rewardArea'] }) {
  return (
    <div style={{ position: 'relative', width: 240, aspectRatio: '16 / 9', background: 'var(--void-deep)', border: '1px solid var(--line-strong)' }} aria-hidden="true">
      <div style={{ position: 'absolute', left: `${area.x * 100}%`, top: `${area.y * 100}%`, width: `${area.w * 100}%`, height: `${area.h * 100}%`, border: '1px solid var(--gold)', background: 'rgba(200,164,77,.15)' }} />
    </div>
  )
}

export function Settings() {
  const { settings: s, failedHotkeys, save } = useSettings()
  if (!window.wf) return <div className="page"><EmptyState title="Настройки есть только в приложении для ПК" /></div>
  if (!s) return <div className="page" />
  const setArea = (key: keyof AppSettings['rewardArea'], v: number) => save({ rewardArea: { ...s.rewardArea, [key]: v } })

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Настройки</h1>
          <p>Сохраняются сразу.</p>
        </div>
      </div>
      <div className="grid grid--2">
        <Orokin>
          <h2 style={{ marginBottom: 8 }}>Запуск</h2>
          <div className="stack" style={{ gap: 6 }}>
            <Toggle checked={s.closeToTray} onChange={(v) => save({ closeToTray: v })} label="Крестик сворачивает в трей"
              hint="Приложение остаётся у часов: работают таймеры, оверлей, горячие клавиши и цены" />
            <Toggle checked={s.autostart} onChange={(v) => save({ autostart: v })} label="Запускать вместе с Windows"
              hint="Стартует сразу в трей, окно не открывает" />
          </div>
          <h2 style={{ margin: '22px 0 8px' }}>Уведомления</h2>
          <div className="stack" style={{ gap: 6 }}>
            <Toggle checked={s.notify.foundry} onChange={(v) => save({ notify: { ...s.notify, foundry: v } })} label="Готов крафт в литейной" />
            <Toggle checked={s.notify.watchlist} onChange={(v) => save({ notify: { ...s.notify, watchlist: v } })} label="Цена упала до нужной (слежка за ценами)" />
          </div>
        </Orokin>

        <section className="panel">
          <h2 style={{ marginBottom: 8 }}>Горячие клавиши</h2>
          {(Object.keys(HOTKEY_LABEL) as (keyof AppSettings['hotkeys'])[]).map((k) => (
            <HotkeyRow key={k} name={k} value={s.hotkeys[k]} failed={failedHotkeys.includes(k)} onSave={(v) => save({ hotkeys: { ...s.hotkeys, [k]: v } })} />
          ))}
          <p className="small faint">Нажми на кнопку и потом нужное сочетание. Буква без Ctrl/Alt/Shift не подойдёт, иначе она мешала бы печатать. Esc - отмена.</p>
        </section>

        <section className="panel">
          <h2 style={{ marginBottom: 8 }}>Подсказка по компонентам в игре</h2>
          <div className="stack" style={{ gap: 6 }}>
            <Toggle checked={s.lookup.enabled} onChange={(v) => save({ lookup: { ...s.lookup, enabled: v } })} label="Включена"
              hint="Работает, только когда активно окно игры" />
          </div>
          <div className="chips" style={{ margin: '12px 0' }} role="group" aria-label="Когда показывать">
            <button className="chip" aria-pressed={s.lookup.mode === 'hover'} onClick={() => save({ lookup: { ...s.lookup, mode: 'hover' } })}>Навёл и подержал</button>
            <button className="chip" aria-pressed={s.lookup.mode === 'click'} onClick={() => save({ lookup: { ...s.lookup, mode: 'click' } })}>Кликнул</button>
          </div>
          {s.lookup.mode === 'hover' && (
            <label className="small">
              Задержка: <span className="num gold">{(s.lookup.delayMs / 1000).toLocaleString('ru-RU')} с</span>
              <input type="range" min={300} max={2000} step={100} value={s.lookup.delayMs} style={{ width: '100%', accentColor: 'var(--gold)' }}
                onChange={(e) => save({ lookup: { ...s.lookup, delayMs: Number(e.target.value) } })} />
            </label>
          )}
          <p className="small faint">Наводишь курсор на название компонента (в литейной, инвентаре, наградах) и рядом всплывает, где его брать и сколько он стоит. Если подсказка не появляется, посмотри, что увидело приложение:</p>
          <button className="btn btn--ghost" onClick={() => void window.wf?.openLastLookup()}><Icon name="search" size={15} />Последний снимок</button>
        </section>

        <section className="panel">
          <h2 style={{ marginBottom: 8 }}>Где искать награды разлома</h2>
          <div className="row" style={{ alignItems: 'flex-start', gap: 18 }}>
            <AreaPreview area={s.rewardArea} />
            <div className="stack" style={{ gap: 4, flex: 1, minWidth: 180 }}>
              {([['x', 'Слева'], ['y', 'Сверху'], ['w', 'Ширина'], ['h', 'Высота']] as const).map(([k, label]) => (
                <label key={k} className="small">
                  {label}: <span className="num">{Math.round(s.rewardArea[k] * 100)}%</span>
                  <input type="range" min={k === 'w' || k === 'h' ? 5 : 0} max={100} value={Math.round(s.rewardArea[k] * 100)}
                    style={{ width: '100%', accentColor: 'var(--gold)' }} onChange={(e) => setArea(k, Number(e.target.value) / 100)} />
                </label>
              ))}
            </div>
          </div>
          <p className="small faint">Рамка должна захватывать названия наград. Если скан промахивается, открой последний снимок и подвинь рамку.</p>
          <div className="row">
            <button className="btn btn--ghost" onClick={() => void window.wf?.openLastScan()}><Icon name="search" size={15} />Последний снимок</button>
            <button className="btn btn--ghost" onClick={() => save({ rewardArea: { x: 0.18, y: 0.16, w: 0.64, h: 0.4 } })}>Сбросить</button>
          </div>
        </section>
      </div>
    </div>
  )
}
