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
  const [pasted, setPasted] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const link = (accountId: string) => update((s) => setAccount(s, { accountId, platform, displayName: logName }))

  const login = async () => {
    if (!window.wf) return
    setBusy(true)
    setMessage(null)
    const res = await window.wf.loginWarframe()
    setBusy(false)
    if (res.ok && res.accountId) link(res.accountId)
    else setMessage(res.error === 'Окно входа закрыто' ? null : res.error ?? 'Не получилось')
  }

  const tryPasted = async (text: string) => {
    setPasted(text)
    if (!text.trim() || !window.wf) return setMessage(null)
    const id = await window.wf.parseAccountId(text)
    if (id) link(id)
    else setMessage('Не нашёл тут ID. Нужна строка user_id (24 символа, цифры и a-f).')
  }

  return (
    <Orokin>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Привязка аккаунта</h2>
        <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} aria-label="Платформа">
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>
      {logName && <p className="small muted" style={{ margin: '4px 0 0' }}>В игре на этом компе последним заходил <span className="gold">{logName}</span>.</p>}

      <div className="grid grid--2" style={{ marginTop: 16 }}>
        <div>
          <div className="meta-label">Быстро</div>
          <button className="btn btn--gold" onClick={login} disabled={busy || !window.wf}>
            <Icon name="user" size={16} />{busy ? 'Жду вход...' : 'Войти через warframe.com'}
          </button>
          <p className="small faint">
            Откроется обычная страница входа DE. Пароль вводишь там, приложение его не видит и забирает только ID аккаунта. После входа окно закроется само.
          </p>
        </div>
        <div>
          <div className="meta-label">Если уже залогинен в браузере</div>
          <button className="btn" onClick={() => void window.wf?.openUserDataPage()}><Icon name="external" size={15} />Открыть страницу с ID</button>
          <textarea className="input" rows={2} style={{ marginTop: 8, resize: 'vertical' }} value={pasted}
            onChange={(e) => void tryPasted(e.target.value)}
            placeholder="Скопируй всё со страницы (Ctrl+A, Ctrl+C) и вставь сюда. Или просто ID" aria-label="ID аккаунта или текст страницы" />
        </div>
      </div>
      {message && <p className="small" role="alert" style={{ color: 'var(--kuva)', marginTop: 12 }}>{message}</p>}
    </Orokin>
  )
}

export function AccountLinkPanel() {
  const { progress } = useProgress()
  const logName = useLogName()
  return progress.account ? <Linked logName={logName} /> : <NotLinked logName={logName} />
}
