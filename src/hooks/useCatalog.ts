import { useMemo } from 'react'
import { useApi, useCatalogData, useMarketItems } from './useApi'
import { buildMarketIndex, type MarketIndex } from '../lib/market'
import { TTL } from '../lib/api'
import type { Item, WorldState } from '../lib/types'

export const WORLD_PATH = '/pc/?language=ru'
export const FRAMES_PATH = '/warframes/?language=ru'
export const WEAPONS_PATH = '/weapons/?language=ru'

export function useWorld() {
  return useApi<WorldState>(WORLD_PATH, TTL.world, 60)
}

export function useFrames() {
  const state = useApi<Item[]>(FRAMES_PATH, TTL.items)
  const frames = useMemo(
    () => (state.data ?? []).filter((f) => f.category === 'Warframes' && f.wikiaUrl && !f.uniqueName.includes('/EntratiMech/')),
    [state.data],
  )
  return { ...state, frames }
}

export function useWeapons() {
  const state = useApi<Item[]>(WEAPONS_PATH, TTL.items)
  const weapons = useMemo(
    () => (state.data ?? []).filter((w) => w.masterable !== false && ['Primary', 'Secondary', 'Melee', 'Arch-Gun', 'Arch-Melee'].includes(w.category)),
    [state.data],
  )
  return { ...state, weapons }
}

export function useMarketIndex(enabled = true): MarketIndex {
  const { data } = useMarketItems(enabled)
  return useMemo(() => buildMarketIndex(data), [data])
}

export const useMods = () => useCatalogData('mods')
export const useArcanes = () => useCatalogData('arcanes')
export const useRelics = () => useCatalogData('relics')
export const useCompanions = () => useCatalogData('companions')
