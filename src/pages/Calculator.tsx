import { useMemo, useState } from 'react'
import { useMods, useWeapons } from '../hooks/useCatalog'
import { calcDamage, factionMultiplier, type DamageResult, type DamageType, type WeaponStats } from '../lib/damage'
import { FACTIONS } from '../data/factions'
import { wikiKey } from '../lib/text'
import { CALC_MODS, MAX_MOD_SLOTS, type CalcMod, type WeaponClass } from '../data/damageMods'
import type { Item } from '../lib/types'
import { EmptyState, ItemImage, Loading, Orokin } from '../components/ui'
import { Icon } from '../components/Icon'

const TYPE_LABEL: Record<DamageType, string> = {
  impact: 'Удар', puncture: 'Пронзание', slash: 'Разрез', heat: 'Жар', cold: 'Холод', electricity: 'Электричество',
  toxin: 'Токсин', blast: 'Взрыв', radiation: 'Радиация', gas: 'Газ', magnetic: 'Магнетизм', viral: 'Вирус',
  corrosive: 'Коррозия', void: 'Пустота', tau: 'Тау',
}
const DAMAGE_KEYS = Object.keys(TYPE_LABEL) as DamageType[]

function classOf(w: Item): WeaponClass {
  if (w.category === 'Melee') return 'melee'
  if (w.category === 'Secondary') return 'pistol'
  return w.type === 'Shotgun' ? 'shotgun' : 'rifle'
}

function statsOf(w: Item): WeaponStats {
  const damage: WeaponStats['damage'] = {}
  for (const k of DAMAGE_KEYS) if (w.damage?.[k]) damage[k] = w.damage[k]
  return {
    damage,
    critChance: w.criticalChance ?? 0,
    critMultiplier: w.criticalMultiplier ?? 1,
    statusChance: w.procChance ?? 0,
    fireRate: w.fireRate ?? 1,
    multishot: w.multishot ?? 1,
    magazine: w.magazineSize ?? 0,
    reload: w.reloadTime ?? 0,
  }
}

const n0 = (v: number) => Math.round(v).toLocaleString('ru-RU')
const n1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString('ru-RU')
const pct = (v: number) => `${(Math.round(v * 1000) / 10).toLocaleString("ru-RU")}%`

// урон по каждой фракции: слабость x1.5, сопротивление x0.5 по каждому типу урона
function FactionTable({ result }: { result: DamageResult }) {
  const rows = FACTIONS.map((f) => ({ f, mult: factionMultiplier(result.damage, f) })).sort((a, b) => b.mult - a.mult)
  return (
    <section className="panel">
      <h3 style={{ marginBottom: 8 }}>Урон по фракциям</h3>
      <table className="table">
        <thead><tr><th>Фракция</th><th className="right">Множитель</th><th className="right">ДПС</th><th className="small">Слабость / сопротивление</th></tr></thead>
        <tbody>
          {rows.map(({ f, mult }) => (
            <tr key={f.id}>
              <td>{f.name}</td>
              <td className="right num" style={{ color: mult > 1.001 ? 'var(--lotus)' : mult < 0.999 ? 'var(--kuva)' : undefined }}>x{mult.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
              <td className="right num">{n0(result.sustainedDps * mult)}</td>
              <td className="small faint">
                {f.weak.map((t) => TYPE_LABEL[t]).join(', ')}
                {f.resist.length > 0 && <span style={{ color: 'var(--kuva)' }}> / {f.resist.map((t) => TYPE_LABEL[t]).join(', ')}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small faint" style={{ marginBottom: 0 }}>Броня, щиты и статусы (Коррозия, Вирус, Жар) не учтены. Таблица слабостей с вики, урон 2.0.</p>
    </section>
  )
}

export function Calculator() {
  const { weapons, loading } = useWeapons()
  const { data: catalogMods } = useMods()
  const [weaponId, setWeaponId] = useState('')
  const [picked, setPicked] = useState<string[]>([])

  const guns = useMemo(
    () => weapons.filter((w) => ['Primary', 'Secondary', 'Melee'].includes(w.category) && w.damage && w.fireRate).sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [weapons],
  )
  const ruName = useMemo(() => new Map((catalogMods ?? []).map((m) => [wikiKey(m.wikiaUrl), m.name])), [catalogMods])
  const weapon = guns.find((w) => w.uniqueName === weaponId)
  const pool = weapon ? CALC_MODS[classOf(weapon)] : []
  const mods = picked.map((n) => pool.find((m) => m.name === n)).filter((m): m is CalcMod => Boolean(m))

  const base = weapon ? calcDamage(statsOf(weapon), []) : null
  const modded = weapon ? calcDamage(statsOf(weapon), mods) : null

  const toggle = (mod: CalcMod) => setPicked((list) => {
    if (list.includes(mod.name)) return list.filter((n) => n !== mod.name)
    if (list.length >= MAX_MOD_SLOTS) return list
    const sameGroup = mod.group ? pool.filter((m) => m.group === mod.group).map((m) => m.name) : []
    return [...list.filter((n) => !sameGroup.includes(n)), mod.name]
  })
  const moveUp = (i: number) => setPicked((list) => (i === 0 ? list : [...list.slice(0, i - 1), list[i], list[i - 1], ...list.slice(i + 1)]))
  const label = (m: CalcMod) => ruName.get(m.name.toLowerCase()) ?? m.name

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Калькулятор урона</h1>
          <p>Выбери оружие и моды, увидишь урон по типам, ДПС и урон по каждой фракции. Порядок модов важен: стихии смешиваются слева направо, как в игре.</p>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 20 }}>
        <select className="input" style={{ minWidth: 280 }} value={weaponId} onChange={(e) => { setWeaponId(e.target.value); setPicked([]) }} aria-label="Оружие">
          <option value="">{loading ? 'Загружаю оружие...' : 'Выбери оружие'}</option>
          {guns.map((w) => <option key={w.uniqueName} value={w.uniqueName}>{w.name}</option>)}
        </select>
        {weapon && classOf(weapon) === 'melee' && <span className="small muted">Ближний бой без комбо и условных модов: скорость атаки вместо скорострельности.</span>}
      </div>
      {loading && guns.length === 0 && <Loading rows={3} height={60} />}
      {!weapon && !loading && <EmptyState title="Оружие не выбрано">Например, Сома Прайм или Нюкор Кува.</EmptyState>}
      {weapon && base && modded && (
        <div className="split">
          <div className="stack" style={{ gap: 16 }}>
            <section className="panel">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3>Моды</h3>
                <span className="small muted num">{picked.length} / {MAX_MOD_SLOTS}</span>
              </div>
              {mods.length > 0 && (
                <ol className="clean" style={{ margin: '8px 0 12px' }}>
                  {mods.map((m, i) => (
                    <li key={m.name} className="row small" style={{ justifyContent: 'space-between', padding: '3px 0' }}>
                      <span><span className="faint num">{i + 1}.</span> {label(m)}</span>
                      <span>
                        <button className="btn btn--ghost" onClick={() => moveUp(i)} disabled={i === 0} aria-label="Выше" title="Поставить выше">↑</button>
                        <button className="btn btn--ghost" onClick={() => toggle(m)} aria-label="Убрать"><Icon name="close" size={14} /></button>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              <div className="chips">
                {pool.filter((m) => !picked.includes(m.name)).map((m) => (
                  <button key={m.name} className="chip" title={m.name} onClick={() => toggle(m)} disabled={picked.length >= MAX_MOD_SLOTS}>{label(m)}</button>
                ))}
              </div>
            </section>
          </div>
          <div className="stack" style={{ gap: 16 }}>
            <Orokin>
              <div className="row" style={{ gap: 14 }}>
                <div style={{ width: 80, height: 50 }}><ItemImage name={weapon.name} imageName={weapon.imageName} /></div>
                <div>
                  <h2>{weapon.name}</h2>
                  <div className="small faint">Сравнение: без модов → с модами</div>
                </div>
              </div>
              <table className="table" style={{ marginTop: 10 }}>
                <tbody>
                  <tr><td>ДПС очередью</td><td className="right num muted">{n0(base.burstDps)}</td><td className="right num gold">{n0(modded.burstDps)}</td></tr>
                  <tr><td>ДПС с перезарядкой</td><td className="right num muted">{n0(base.sustainedDps)}</td><td className="right num gold">{n0(modded.sustainedDps)}</td></tr>
                  <tr><td>Урон за выстрел (в среднем)</td><td className="right num muted">{n1(base.perShot)}</td><td className="right num">{n1(modded.perShot)}</td></tr>
                  <tr><td>Шанс крита</td><td className="right num muted">{pct(base.critChance)}</td><td className="right num">{pct(modded.critChance)}</td></tr>
                  <tr><td>Множитель крита</td><td className="right num muted">x{n1(base.critMultiplier)}</td><td className="right num">x{n1(modded.critMultiplier)}</td></tr>
                  <tr><td>Шанс статуса</td><td className="right num muted">{pct(base.statusChance)}</td><td className="right num">{pct(modded.statusChance)}</td></tr>
                  <tr><td>Мультивыстрел</td><td className="right num muted">{n1(base.multishot)}</td><td className="right num">{n1(modded.multishot)}</td></tr>
                  <tr><td>Скорострельность</td><td className="right num muted">{n1(base.fireRate)}</td><td className="right num">{n1(modded.fireRate)}</td></tr>
                </tbody>
              </table>
            </Orokin>
            <section className="panel">
              <h3 style={{ marginBottom: 8 }}>Урон по типам (один снаряд, без крита)</h3>
              <table className="table">
                <tbody>
                  {(Object.entries(modded.damage) as [DamageType, number][]).sort((a, b) => b[1] - a[1]).map(([type, v]) => (
                    <tr key={type}><td>{TYPE_LABEL[type]}</td><td className="right num">{n1(v)}</td><td className="right num muted">{pct(v / modded.total)}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="small faint" style={{ marginBottom: 0 }}>Без учёта брони, ривенов, аркан и условных бонусов (Galvanized, Blood Rush и т.п.). Для сравнения сборок между собой хватает.</p>
            </section>
            <FactionTable result={modded} />
          </div>
        </div>
      )}
    </div>
  )
}
