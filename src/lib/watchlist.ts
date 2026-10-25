import type { ProgressState, WatchEntry } from './progress'

export function setWatch(state: ProgressState, slug: string, target: number): ProgressState {
  if (!(target > 0)) return state
  return { ...state, watch: { ...state.watch, [slug]: { target: Math.round(target), notifiedAt: null } } }
}

export function removeWatch(state: ProgressState, slug: string): ProgressState {
  const { [slug]: _removed, ...rest } = state.watch
  return { ...state, watch: rest }
}

// уведомляем когда цена дошла до цели, повторно - только если стало ещё дешевле. ушла выше - сбрасываем
export function watchCheck(entry: WatchEntry, sell: number | null): { notify: boolean; next: WatchEntry } {
  if (sell === null) return { notify: false, next: entry }
  if (sell > entry.target) return { notify: false, next: entry.notifiedAt === null ? entry : { ...entry, notifiedAt: null } }
  if (entry.notifiedAt !== null && sell >= entry.notifiedAt) return { notify: false, next: entry }
  return { notify: true, next: { ...entry, notifiedAt: sell } }
}
