import type { Item } from '../lib/types'
import { componentRu, dropLocationRu, isPrimaryDropLocation, rarityRu } from '../lib/i18n'
import { countOwnedParts, togglePart, partKey } from '../lib/progress'
import { useProgress } from '../state/AppState'
import { isResourceComponent } from '../lib/parts'

const MAX_DROPS = 4

export function ItemParts({ item }: { item: Item }) {
  const { progress, update } = useProgress()
  const parts = (item.components ?? []).filter((c) => !isResourceComponent(c))
  const resources = (item.components ?? []).filter((c) => isResourceComponent(c))
  if (parts.length === 0 && resources.length === 0) {
    return <p className="muted">Состав крафта не указан. Обычно такой предмет покупается целиком - проверь вики.</p>
  }
  const owned = countOwnedParts(progress, item.uniqueName, parts.map((p) => p.name))

  return (
    <div>
      {parts.length > 0 && (
        <div className="row small muted" style={{ marginBottom: 4 }}>
          Собрано <span className="num" style={{ color: 'var(--bone)' }}>{owned} из {parts.length}</span>
        </div>
      )}
      <ul className="clean">
        {parts.map((part) => {
          const key = partKey(item.uniqueName, part.name)
          const drops = (part.drops ?? [])
            .filter((d) => isPrimaryDropLocation(d.location))
            .sort((a, b) => b.chance - a.chance)
            .slice(0, MAX_DROPS)
          return (
            <li key={part.name} className="part">
              <label className={`check ${progress.parts[key] ? 'check--done' : ''}`} style={{ border: 0, padding: 0, gridColumn: '1 / -1' }}>
                <input type="checkbox" checked={Boolean(progress.parts[key])} onChange={() => update((s) => togglePart(s, item.uniqueName, part.name))} />
                <span className="check__text">
                  <span className="check__title">{componentRu(part.name)}</span>
                  {part.itemCount && part.itemCount > 1 ? <span className="faint small"> ×{part.itemCount}</span> : null}
                </span>
              </label>
              {drops.length > 0 ? (
                <ul className="clean part__drops">
                  {drops.map((d) => (
                    <li key={d.location}>
                      <span>{dropLocationRu(d.location)}{d.rarity ? <span className="faint">, {rarityRu(d.rarity).toLowerCase()}</span> : null}</span>
                      <span className="num">{d.chance}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="part__drops">Покупается в Маркете, в магазине синдиката или создаётся в кузнице</div>
              )}
            </li>
          )
        })}
      </ul>
      {resources.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="meta-label">Ресурсы для сборки</div>
          <div className="chips">
            {resources.map((r) => (
              <span key={r.name} className="tag">{componentRu(r.name)} ×{r.itemCount ?? 1}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
