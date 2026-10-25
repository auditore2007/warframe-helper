import type { ProgressState, ShardSlot } from './progress'

export const MAX_SHARDS = 5

export function setShardSlot(state: ProgressState, frameId: string, index: number, slot: ShardSlot | null): ProgressState {
  if (!Number.isInteger(index) || index < 0 || index >= MAX_SHARDS) return state
  const current = state.shards[frameId] ?? Array.from({ length: MAX_SHARDS }, () => null)
  const next = current.map((s, i) => (i === index ? slot : s))
  if (next.every((s) => s === null)) {
    const { [frameId]: _removed, ...rest } = state.shards
    return { ...state, shards: rest }
  }
  return { ...state, shards: { ...state.shards, [frameId]: next } }
}
