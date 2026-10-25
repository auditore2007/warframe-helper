import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { CommandPalette } from './CommandPalette'
import { usePlayer, useProgress } from '../state/AppState'
import { useWorld } from '../hooks/useCatalog'
import { useWatchNotifier } from '../hooks/useWatchNotifier'
import { gameBuildDate } from '../lib/time'
import { SECTIONS, sectionOf } from '../data/navigation'

function AccountNode() {
  const { progress } = useProgress()
  const { profile } = usePlayer()
  if (!progress.account) {
    return (
      <Link to="/tracker" className="rail__account" title="Привязать аккаунт">
        <span className="rail__mr rail__mr--empty"><Icon name="user" size={16} /></span>
        <span className="rail__label">Войти</span>
      </Link>
    )
  }
  return (
    <Link to="/tracker" className="rail__account" title={profile?.displayName ?? progress.account.displayName ?? 'Аккаунт'}>
      <span className="rail__mr"><span>{profile?.masteryRank ?? '-'}</span></span>
      <span className="rail__label">MR</span>
    </Link>
  )
}

function Versions() {
  const { data } = useWorld()
  const build = gameBuildDate(data?.buildLabel)
  return (
    <div className="rail__version" title={build ? `Сборка игры от ${build}` : undefined}>
      v{__APP_VERSION__}
    </div>
  )
}

// вертикальная "орокинская" ось: разделы - ромбы на золотой линии
function Rail({ onSearch }: { onSearch: () => void }) {
  const { pathname } = useLocation()
  const current = sectionOf(pathname)
  return (
    <aside className="rail">
      <Link to="/" className="rail__brand" aria-label="Codex Tenno, на главную"><Icon name="sigil" size={30} /></Link>
      <nav className="rail__spine" aria-label="Разделы">
        {SECTIONS.map((s) => (
          <Link key={s.id} to={s.pages[0].to} className={`rail__node ${current.id === s.id ? 'is-active' : ''}`} aria-current={current.id === s.id ? 'page' : undefined}>
            <span className="rail__gem"><Icon name={s.icon} size={18} /></span>
            <span className="rail__label">{s.label}</span>
          </Link>
        ))}
      </nav>
      <div className="rail__foot">
        <button className="rail__tool" onClick={onSearch} title="Поиск (Ctrl+K)" aria-label="Поиск"><Icon name="search" size={18} /></button>
        {window.wf && (
          <button className="rail__tool" onClick={() => void window.wf?.toggleOverlay()} title="Оверлей поверх игры" aria-label="Оверлей"><Icon name="overlay" size={18} /></button>
        )}
        <AccountNode />
        <Versions />
      </div>
    </aside>
  )
}

function Topbar({ onSearch }: { onSearch: () => void }) {
  const { pathname } = useLocation()
  const section = sectionOf(pathname)
  return (
    <header className="topbar">
      <div className="topbar__title">{section.label}</div>
      {section.pages.length > 1 && (
        <nav className="tabs" aria-label={section.label}>
          {section.pages.map((p) => (
            <NavLink key={p.to} to={p.to} end={p.to === '/'} className="tabs__tab">{p.label}</NavLink>
          ))}
        </nav>
      )}
      <button className="topbar__search" onClick={onSearch}>
        <Icon name="search" size={15} />
        <span>Найти</span>
        <kbd>Ctrl K</kbd>
      </button>
    </header>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  useWatchNotifier()

  // трей и уведомления просят открыть страницу
  useEffect(() => window.wf?.onNavigate((hash) => navigate(hash)), [navigate])

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    const onOpen = () => setSearchOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('wfh:search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wfh:search', onOpen)
    }
  }, [])

  return (
    <div className="shell">
      <div className="titlebar" />
      <Rail onSearch={() => setSearchOpen(true)} />
      <main className="main" ref={mainRef}>
        <Topbar onSearch={() => setSearchOpen(true)} />
        <Outlet />
      </main>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
