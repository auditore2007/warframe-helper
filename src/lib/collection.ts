import type { CollectionEntry, ProgressState } from './progress'

export const MIN_ELEMENT_BONUS = 25
export const MAX_ELEMENT_BONUS = 60

export function toggleCollected(state: ProgressState, key: string): ProgressState {
  if (state.collection[key]) {
    const { [key]: _removed, ...rest } = state.collection
    return { ...state, collection: rest }
  }
  return { ...state, collection: { ...state.collection, [key]: { element: null, bonus: null } } }
}

// если заполнил стихию - значит оружие есть
export function setCollectionInfo(state: ProgressState, key: string, patch: Partial<CollectionEntry>): ProgressState {
  const current = state.collection[key] ?? { element: null, bonus: null }
  return { ...state, collection: { ...state.collection, [key]: { ...current, ...patch } } }
}

export function clampBonus(value: number): number | null {
  if (!Number.isFinite(value)) return null
  return Math.min(MAX_ELEMENT_BONUS, Math.max(MIN_ELEMENT_BONUS, Math.round(value)))
}
