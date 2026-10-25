import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { EMPTY_PROGRESS, parseProgress, rollChecklist, type ProgressState, type AccountLink } from '../lib/progress'
import { gameDayKey, gameWeekKey } from '../lib/time'
import { dueTimers, markNotified } from '../lib/foundry'
import { CHECKLIST } from '../data/checklist'
import type { Profile } from '../lib/types'

const STORAGE_KEY = 'wfh.progress.v1'
const DAILY_IDS = new Set(CHECKLIST.filter((t) => t.period === 'daily').map((t) => t.id))
const TIMER_CHECK_MS = 10_000
const PROFILE_REFRESH_MS = 30 * 60_000

// оверлей - второе окно, уведомления шлёт только главное
export const isOverlayWindow = (): boolean => window.location.hash.startsWith('#/overlay')

function loadProgress(): ProgressState {
  try {
    return parseProgress(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return EMPTY_PROGRESS
  }
}

type Updater = (state: ProgressState) => ProgressState

interface ProgressContextValue {
  progress: ProgressState
  update: (fn: Updater) => void
}

export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ProfileContextValue {
  profile: Profile | null
  status: ProfileStatus
  error: string | null
  fetchedAt: number | null
  stale: boolean
  xpByUnique: Map<string, number>
  refresh: () => void
  detect: () => Promise<{ ok: boolean; error?: string; account?: AccountLink; logName?: string | null }>
}

const ProgressContext = createContext<ProgressContextValue | null>(null)
const ProfileContext = createContext<ProfileContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => {
    const now = Date.now()
    return rollChecklist(loadProgress(), gameDayKey(now), gameWeekKey(now), DAILY_IDS)
  })

  const update = useCallback((fn: Updater) => setProgress((prev) => fn(prev)), [])

  // чтобы не отправлять изменение обратно в то окно, откуда оно пришло
  const lastRaw = useRef<string | null>(null)

  useEffect(() => {
    const raw = JSON.stringify(progress)
    if (raw === lastRaw.current) return
    lastRaw.current = raw
    try {
      window.localStorage.setItem(STORAGE_KEY, raw)
    } catch {
      /* нет localStorage - живём без сохранения */
    }
  }, [progress])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return
      const next = parseProgress(e.newValue)
      lastRaw.current = JSON.stringify(next)
      setProgress(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useFoundryNotifications(progress, update)

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      setProgress((prev) => rollChecklist(prev, gameDayKey(now), gameWeekKey(now), DAILY_IDS))
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  const profileValue = useProfile(progress.account, update)
  const progressValue = useMemo(() => ({ progress, update }), [progress, update])

  return (
    <ProgressContext.Provider value={progressValue}>
      <ProfileContext.Provider value={profileValue}>{children}</ProfileContext.Provider>
    </ProgressContext.Provider>
  )
}

function notify(title: string, body: string) {
  if (typeof Notification === 'undefined') return
  const n = new Notification(title, { body })
  n.onclick = () => void window.wf?.focusWindow()
}

// уведомление о готовом крафте
function useFoundryNotifications(progress: ProgressState, update: (fn: Updater) => void) {
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    if (isOverlayWindow()) return
    const check = () => {
      const due = dueTimers(progressRef.current, Date.now())
      if (due.length === 0) return
      for (const t of due) notify('Литейная: готово', `${t.name} можно забирать`)
      update((s) => markNotified(s, due.map((t) => t.id)))
    }
    check()
    const id = window.setInterval(check, TIMER_CHECK_MS)
    return () => window.clearInterval(id)
  }, [update])
}

function useProfile(account: AccountLink | null, update: (fn: Updater) => void): ProfileContextValue {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [status, setStatus] = useState<ProfileStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [stale, setStale] = useState(false)

  const refresh = useCallback(() => {
    if (!account || !window.wf) return
    setStatus('loading')
    window.wf
      .fetchProfile(account.accountId, account.platform)
      .then((res) => {
        if (res.ok && res.data) {
          setProfile(res.data)
          setFetchedAt(res.fetchedAt ?? Date.now())
          setStale(Boolean(res.stale))
          setError(null)
          setStatus('ready')
        } else {
          setError(res.error ?? 'Не удалось загрузить профиль')
          setStatus('error')
        }
      })
      .catch(() => {
        setError('Не удалось загрузить профиль')
        setStatus('error')
      })
  }, [account])

  useEffect(() => {
    setProfile(null)
    if (account) refresh()
    else setStatus('idle')
  }, [account, refresh])

  // профиль сам обновляется раз в полчаса
  useEffect(() => {
    if (!account) return
    const id = window.setInterval(refresh, PROFILE_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [account, refresh])

  const detect = useCallback(async () => {
    if (!window.wf) return { ok: false, error: 'Автопоиск работает только в приложении для компьютера' }
    const res = await window.wf.detectAccount()
    if (!res.ok || !res.accountId) return { ok: false, error: res.error ?? 'Аккаунт не найден', logName: res.displayName ?? null }
    const link: AccountLink = { accountId: res.accountId, platform: 'pc', displayName: res.displayName ?? null }
    update((s) => ({ ...s, account: link }))
    return { ok: true, account: link }
  }, [update])

  const xpByUnique = useMemo(() => new Map((profile?.items ?? []).map((i) => [i.uniqueName, i.xp])), [profile])

  return useMemo(
    () => ({ profile, status, error, fetchedAt, stale, xpByUnique, refresh, detect }),
    [profile, status, error, fetchedAt, stale, xpByUnique, refresh, detect],
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside AppStateProvider')
  return ctx
}

export function usePlayer(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('usePlayer must be used inside AppStateProvider')
  return ctx
}
