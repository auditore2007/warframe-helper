import { useMemo, useState } from 'react'
import { useMods, useWeapons } from '../hooks/useCatalog'
import { usePlayer, useProgress } from '../state/AppState'
import { clampBonus, setCollectionInfo, toggleCollected, MAX_ELEMENT_BONUS } from '../lib/collection'
import { toggleMod } from '../lib/progress'
import { wikiKey } from '../lib/text'
import { LICH_ELEMENTS, LICH_FAMILIES, NIGHTMARE_HOW, NIGHTMARE_MODS, NIGHTMARE_PLANETS, type LichFamily, type NightmareGroup } from '../data/collections'
import type { Item } from '../lib/types'
import { ItemImage, Loading, Orokin } from '../components/ui'

type Tab = LichFamily | 'nightmare'
const CATEGORY_LABEL: Record<string, string> = { Primary: 'Основное', Secondary: 'Вторичное', Melee: 'Ближний бой', 'Arch-Gun': 'Арк-пушка', 'Arch-Melee': 'Арк-ближний бой' }
const TABS: { id: Tab; label: string }[] = [...LICH_FAMILIES.map((f) => ({ id: f.id as Tab, label: f.title })), { id: 'nightmare', label: 'Моды Кошмара' }]

function LichWeapon({ weapon, family }: { weapon: Item; family: LichFamily }) {
  const { progress, update } = useProgress()
  const { xpByUnique } = usePlayer()
  const key = `${family}:${weapon.uniqueName}`
  const entry = progress.collection[key]
  const inProfile = xpByUnique.has(weapon.uniqueName)
  const owned = Boolean(entry) || inProfile
  return (
    <div className="list-row" style={{ gridTemplateColumns: '48px 1fr auto auto auto', opacity: owned ? 1 : 0.7 }}>
      <ItemImage name={weapon.name} imageName={weapon.imageName} />
      <span>
        <span style={{ display: 'block' }}>{weapon.name}</span>
        <span className="small faint">{CATEGORY_LABEL[weapon.category] ?? weapon.category}{inProfile ? ' · есть в профиле' : ''}</span>
      </span>
      <select className="input" value={entry?.element ?? ''} aria-label={`Стихия ${weapon.name}`} disabled={!owned}
        onChange={(e) => update((s) => setCollectionInfo(s, key, { element: e.target.value || null }))}>
        <option value="">Стихия</option>
        {LICH_ELEMENTS.map((el) => <option key={el.id} value={el.id}>{el.label}</option>)}
      </select>
      <input className="input num" style={{ width: 76 }} type="number" min={25} max={MAX_ELEMENT_BONUS} placeholder="%" value={entry?.bonus ?? ''} disabled={!owned}
        aria-label={`Бонус стихии ${weapon.name}`} title="Бонус стихии: от 25 до 60%"
        onChange={(e) => update((s) => setCollectionInfo(s, key, { bonus: e.target.value === '' ? null : clampBonus(Number(e.target.value)) }))} />
      <label className="row small" style={{ gap: 6 }}>
        <input type="checkbox" checked={owned} disabled={inProfile} onChange={() => update((s) => toggleCollected(s, key))} />
        Есть
      </label>
    </div>
  )
}

function LichList({ family }: { family: LichFamily }) {
  const { weapons, loading } = useWeapons()
  const { progress } = useProgress()
  const { xpByUnique } = usePlayer()
  const info = LICH_FAMILIES.find((f) => f.id === family)!
  const list = useMemo(
    () => weapons.filter((w) => w.wikiaUrl?.includes(`/w/${info.wikiPrefix}`)).sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [weapons, info],
  )
  if (loading && list.length === 0) return <Loading rows={6} height={56} />
  const owned = list.filter((w) => progress.collection[`${family}:${w.uniqueName}`] || xpByUnique.has(w.uniqueName))
  const perfect = owned.filter((w) => progress.collection[`${family}:${w.uniqueName}`]?.bonus === MAX_ELEMENT_BONUS).length
  return (
    <>
      <Orokin small>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Собрано <span className="num gold">{owned.length}</span> из {list.length}{perfect > 0 && <span className="muted"> · с бонусом 60%: {perfect}</span>}</span>
          <div className="bar" style={{ width: 220 }}><i style={{ width: `${list.length ? (owned.length / list.length) * 100 : 0}%` }} /></div>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>{info.source} Бонус стихии - от 25 до 60%; его поднимает Валентное слияние двух копий одного оружия.</p>
      </Orokin>
      <div className="stack section" style={{ gap: 6 }}>
        {list.map((w) => <LichWeapon key={w.uniqueName} weapon={w} family={family} />)}
      </div>
    </>
  )
}

function NightmareList() {
  const { data: mods, loading } = useMods()
  const { progress, update } = useProgress()
  const byKey = useMemo(() => new Map((mods ?? []).map((m) => [wikiKey(m.wikiaUrl), m])), [mods])
  if (loading && !mods) return <Loading rows={5} height={44} />
  const rows = NIGHTMARE_MODS.map((n) => ({ ...n, mod: byKey.get(n.name.toLowerCase()) }))
  const owned = rows.filter((r) => r.mod && progress.mods[r.mod.uniqueName]).length
  return (
    <>
      <Orokin small>
        <span>Собрано <span className="num gold">{owned}</span> из {rows.length}</span>
        <p className="small muted" style={{ marginBottom: 0 }}>{NIGHTMARE_HOW} Отметки общие со страницей «Моды».</p>
      </Orokin>
      {(['A', 'B', 'C'] as NightmareGroup[]).map((g) => (
        <section key={g} className="section">
          <div className="section-head">
            <h3>{NIGHTMARE_PLANETS[g]}</h3>
          </div>
          <div className="grid grid--3">
            {rows.filter((r) => r.group === g).map((r) => (
              <label key={r.name} className={`check ${r.mod && progress.mods[r.mod.uniqueName] ? 'check--done' : ''}`}>
                <input type="checkbox" disabled={!r.mod} checked={Boolean(r.mod && progress.mods[r.mod.uniqueName])} onChange={() => r.mod && update((s) => toggleMod(s, r.mod!.uniqueName))} />
                <span className="check__text">
                  <span className="check__title">{r.mod?.name ?? r.name}</span>
                  <span className="small faint" style={{ display: 'block' }}>{r.name}</span>
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export function Collections() {
  const [tab, setTab] = useState<Tab>('kuva')
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Коллекции</h1>
          <p>Оружие личей и сестёр со стихией и процентом, моды Кошмара. Что есть в профиле, отмечено само.</p>
        </div>
      </div>
      <div className="chips" role="tablist" style={{ marginBottom: 20 }}>
        {TABS.map((t) => <button key={t.id} role="tab" className="chip" aria-pressed={tab === t.id} aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      {tab === 'nightmare' ? <NightmareList /> : <LichList key={tab} family={tab} />}
    </div>
  )
}
