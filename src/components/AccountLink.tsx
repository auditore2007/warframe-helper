import { useEffect, useState } from 'react'
import { useNow } from '../hooks/useNow'
import { setAccount, type Platform } from '../lib/progress'
import { formatRelative } from '../lib/time'
import { usePlayer, useProgress } from '../state/AppState'
import { Orokin } from './ui'
import { Icon } from './Icon'

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'pc', label: 'ПК' },
  { id: 'ps4', label: 'PlayStation' },
  { id: 'xb1', label: 'Xbox' },
  { id: 'swi', label: 'Switch' },
]

// ник из EE.log, чтобы показать "в игре ты X" и сверить с профилем
function useLogName(): string | null {
  const { detect } = usePlayer()
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    detect().then((res) => alive && setName(res.account?.displayName ?? res.logName ?? null)).catch(() => undefined)
    return () => {
      alive = false
    }
  }, [detect])
  return name
}

function Linked({ logName }: { logName: string | null }) {
  const { progress, update } = useProgress()
  const { refresh, status, error, fetchedAt, stale, profile } = usePlayer()
  const now = useNow(30_000)
  const account = progress.account!
  const name = profile?.displayName ?? account.displayName
  const mismatch = logName && profile?.displayName && profile.displayName.toLowerCase() !== logName.toLowerCase()
  return (
    <Orokin>
      <div className="row" style={{ gap: 18, alignItems: 'center' }}>
        <span className="mr-badge"><span>{profile?.masteryRank ?? '-'}</span></span>
        <div>
          <h2>{name ?? 'Тэнно'}</h2>
          <div className="small muted">
            {status === 'loading' && 'Обновляю профиль...'}
            {status === 'ready' && `Обновлено ${formatRelative(fetchedAt ?? undefined, now)}${stale ? ', сохранённая копия' : ''}. Само обновляется раз в 30 минут`}
            {status === 'error' && error}
          </div>
        </div>
        <span className="spacer" />
        <button className="btn" onClick={refresh} disabled={status === 'loading'}><Icon name="refresh" size={16} />Обновить</button>
        <button className="btn btn--ghost" onClick={() => window.confirm('Отвязать аккаунт?') && update((s) => setAccount(s, null))}>Отвязать</button>
      </div>
      {mismatch && (
        <p className="small" style={{ color: 'var(--kuva)', margin: '12px 0 0' }}>
          В игре последним заходил «{logName}», а привязан «{profile?.displayName}». Если это не твой аккаунт - отвяжи и привяжи заново.
        </p>
      )}
      <p className="small faint" style={{ margin: '14px 0 0' }}>
        Из профиля берутся MR, вкачанные предметы и репутация синдикатов. Инвентарь игра наружу не отдаёт, так что части отмечай сам.
      </p>
    </Orokin>
  )
}

function NotLinked({ logName }: { logName: string | null }) {
  const { update } = useProgress()
  const [platform, setPlatform] = useState<Platform>('pc')
  const [manual, setManual] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const link = (accountId: string, displayName: string | null) => update((s) => setAccount(s, { accountId, platform, displayName: displayName ?? logName }))

  const login = async () => {
    if (!window.wf) return
    setBusy(true)
    setMessage(null)
    const res = await window.wf.loginWarframe()
    setBusy(false)
    if (res.ok && res.accountId) link(res.accountId, res.displayName ?? null)
    else if (res.error !== 'Окно входа закрыто') setMessage(res.error ?? 'Не получилось войти')
  }

  const saveManual = async () => {
    const id = window.wf ? await window.wf.parseAccountId(manual) : null
    if (id) link(id, null)
    else setMessage('ID - это 24 символа: цифры и буквы a-f.')
  }

  return (
    <Orokin>
      <div className="link-panel">
        <div>
          <h2>Привяжи аккаунт</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Тогда тут появятся твой MR, вкачанные предметы и репутация синдикатов.
            {logName && <> В игре на этом компьютере последним был <span className="gold">{logName}</span>.</>}
          </p>
        </div>
        <div className="link-panel__action">
          <button className="btn btn--gold btn--big" onClick={login} disabled={busy || !window.wf}>
            {busy ? 'Жду, пока войдёшь...' : 'Войти через warframe.com'}
          </button>
          <p className="small faint" style={{ margin: 0 }}>
            Откроется страница входа Warframe. Можно войти через Steam, PlayStation, Xbox, Switch или Epic. Пароль вводишь на сайте DE, приложение его не видит.
          </p>
          <div className="row small" style={{ gap: 12 }}>
            <label className="row" style={{ gap: 6 }}>
              <span className="muted">Платформа</span>
              <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
            <button className="btn btn--ghost small" onClick={() => setShowManual((v) => !v)}>Есть ID аккаунта?</button>
          </div>
          {showManual && (
            <div className="row">
              <input className="input" style={{ flex: 1 }} value={manual} onChange={(e) => setManual(e.target.value)} placeholder="24 символа" aria-label="ID аккаунта" />
              <button className="btn" onClick={() => void saveManual()}>Привязать</button>
            </div>
          )}
          {message && <p className="small" role="alert" style={{ color: 'var(--kuva)', margin: 0 }}>{message}</p>}
        </div>
      </div>
    </Orokin>
  )
}

export function AccountLinkPanel() {
  const { progress } = useProgress()
  const logName = useLogName()
  return progress.account ? <Linked logName={logName} /> : <NotLinked logName={logName} />
}
