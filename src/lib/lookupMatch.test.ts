import { describe, it, expect } from 'vitest'
import { similarity, buildLookupIndex, findLookup } from './lookupMatch'
import type { Item, MarketItem } from './types'

const saryn: Item = {
  uniqueName: '/Saryn', name: 'Сарина Прайм', category: 'Warframes', wikiaUrl: 'https://wiki.warframe.com/w/Saryn/Prime',
  components: [
    { name: 'Neuroptics', uniqueName: '/Recipes/SarynPrimeHelmetComponent' },
    { name: 'Orokin Cell', uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCell', itemCount: 3 },
  ],
}
const market: MarketItem[] = [
  { slug: 'saryn_prime_neuroptics_blueprint', gameRef: '/Recipes/SarynPrimeHelmetBlueprint', en: 'Saryn Prime Neuroptics Blueprint', ru: 'Сарина Прайм: Нейрооптика (Чертеж)', ducats: 45, tags: [] },
]
const resources = [{ id: 'orokin-cell', name: 'Клетка Орокин', en: 'Orokin Cell' }]

describe('lookup matching', () => {
  const index = buildLookupIndex([saryn], market, resources)

  it('scores word order and small typos as similar', () => {
    expect(similarity('Нейрооптика Сарина Прайм', 'Сарина Прайм: Нейрооптика')).toBe(1)
    expect(similarity('Saryn Prlme Neuroptlcs', 'Saryn Prime Neuroptics')).toBeGreaterThan(0.85)
  })

  it('finds a prime part by its market name in either language', () => {
    const hit = findLookup([{ text: 'Сарина Прайм: Нейрооптика (Чертеж)', dx: 0, dy: -20 }], index)
    expect(hit).toMatchObject({ kind: 'part', itemId: '/Saryn', component: 'Neuroptics', slug: 'saryn_prime_neuroptics_blueprint' })
    expect(findLookup([{ text: 'SARYN PRIME NEUROPTICS', dx: 5, dy: 10 }], index)).toMatchObject({ kind: 'part', component: 'Neuroptics' })
  })

  it('joins a name split over two lines', () => {
    const hit = findLookup([{ text: 'Saryn Prime', dx: 0, dy: -10 }, { text: 'Neuroptics Blueprint', dx: 0, dy: 12 }], index)
    expect(hit).toMatchObject({ kind: 'part', component: 'Neuroptics' })
  })

  it('finds resources and whole items', () => {
    expect(findLookup([{ text: 'Клетка Орокин', dx: 0, dy: 0 }], index)).toMatchObject({ kind: 'resource', resourceId: 'orokin-cell' })
    expect(findLookup([{ text: 'Saryn Prime', dx: 0, dy: 0 }], index)).toMatchObject({ kind: 'item', itemId: '/Saryn' })
  })

  it('prefers the line closest to the cursor and ignores noise', () => {
    const hit = findLookup([{ text: 'Клетка Орокин', dx: 0, dy: -150 }, { text: 'Saryn Prime Neuroptics', dx: 0, dy: 5 }], index)
    expect(hit).toMatchObject({ component: 'Neuroptics' })
    expect(findLookup([{ text: 'x7 ]]', dx: 0, dy: 0 }, { text: 'ВЫБЕРИТЕ', dx: 0, dy: 0 }], index)).toBeNull()
  })
})
