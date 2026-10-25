import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '../lib/types'

export interface SettingsHook {
  settings: AppSettings | null
  failedHotkeys: string[]
  save: (patch: Partial<AppSettings>) => Promise<void>
}

// настройки живут в main процессе, тут только читаем и шлём изменения
export function useSettings(): SettingsHook {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [failedHotkeys, setFailed] = useState<string[]>([])

  useEffect(() => {
    if (!window.wf) return
    let alive = true
    window.wf.getSettings().then((s) => {
      if (!alive) return
      setSettings(s.settings)
      setFailed(s.failedHotkeys)
    }).catch(() => undefined)
    const off = window.wf.onSettings((s) => setSettings(s))
    return () => {
      alive = false
      off()
    }
  }, [])

  const save = useCallback(async (patch: Partial<AppSettings>) => {
    if (!window.wf) return
    const res = await window.wf.setSettings(patch)
    setSettings(res.settings)
    setFailed(res.failedHotkeys)
  }, [])

  return { settings, failedHotkeys, save }
}
