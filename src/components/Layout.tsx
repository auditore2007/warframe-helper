import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Icon, type IconName } from './Icon'
import { usePlayer, useProgress } from '../state/AppState'
import { useWorld } from '../hooks/useCatalog'
import { gameBuildDate } from '../lib/time'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const NAV: { group: string | null; items: NavItem[] }[] = [
  {
    group: null,
    items: [
      { to: '/', label: 'Обзор', icon: 'home' },
      { to: '/world', label: 'Мир сейчас', icon: 'world' },
      { to: '/rotations', label: 'Ротации', icon: 'cycle' },
    ],
  },
  {
    group: 'Справочник',
    items: [
      { to: '/frames', label: 'Варфреймы', icon: 'frame' },
      { to: '/weapons', label: 'Оружие', icon: 'weapon' },
      { to: '/companions', label: 'Компаньоны', icon: 'pet' },
      { to: '/mods', label: 'Моды', icon: 'mod' },
      { to: '/arcanes', label: 'Мистификаторы', icon: 'arcane' },
      { to: '/relics', label: 'Реликвии', icon: 'relic' },
      { to: '/shards', label: 'Осколки Архонта', icon: 'gem' },
      { to: '/farm', label: 'Фарм и дроп', icon: 'farm' },
      { to: '/starchart', label: 'Звёздная карта', icon: 'map' },
      { to: '/guides', label: 'Гайды', icon: 'book' },
    ],
  },
  {
    group: 'Торговля',
    items: [
      { to: '/market', label: 'Рынок', icon: 'market' },
      { to: '/relic-value', label: 'Ценность реликвий', icon: 'coin' },
      { to: '/sell', label: 'Что продать', icon: 'coin' },
    ],
  },
  {
    group: 'Ты',
    items: [
      { to: '/tracker', label: 'Трекер', icon: 'user' },
      { to: '/planner', label: 'Планировщик фарма', icon: 'target' },
      { to: '/foundry', label: 'Литейная', icon: 'clock' },
      { to: '/syndicates', label: 'Синдикаты', icon: 'banner' },
      { to: '/collections', label: 'Коллекции', icon: 'trophy' },
    ],
  },
]

function Versions() {
  const { data } = useWorld()
  const build = gameBuildDate(data?.buildLabel)
  return (
    <div className="small faint" style={{ padding: '6px 12px 0' }}>
      v{__APP_VERSION__}{build && <> · игра от {build}</>}
    </div>
  )
}

function PlayerChip() {
  const { progress } = useProgress()
  const { profile, status } = usePlayer()
  if (!progress.account) {
    return (
      <Link to="/tracker" className="nav__link">
        <Icon name="user" />
        <span className="small">Привязать аккаунт</span>
      </Link>
    )
  }
  return (
    <Link to="/tracker" className="nav__link" style={{ alignItems: 'center' }}>
      <span className="mr-badge" style={{ width: 40, height: 40, fontSize: 18 }}>
        <span>{profile?.masteryRank ?? '–'}</span>
      </span>
      <span style={{ lineHeight: 1.3 }}>
        <span style={{ display: 'block', color: 'var(--bone)' }}>{profile?.displayName ?? progress.account.displayName ?? 'Тэнно'}</span>
        <span className="small faint">{status === 'loading' ? 'Синхронизация…' : 'Ранг мастерства'}</span>
      </span>
    </Link>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="shell">
      <div className="titlebar" />
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="Warframe Helper - на главную">
          <Icon name="sigil" size={30} />
          <span>
            <span className="brand__name" style={{ display: 'block' }}>Codex Tenno</span>
            <span className="brand__sub">помощник по Warframe</span>
          </span>
        </NavLink>
        <nav className="nav" aria-label="Разделы">
          {NAV.map((block) => (
            <div key={block.group ?? 'top'} className="nav">
              {block.group && <div className="nav__group">{block.group}</div>}
              {block.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav__link">
                  <Icon name={item.icon} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar__foot">
          {window.wf && (
            <button className="nav__link" style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer' }} onClick={() => void window.wf?.toggleOverlay()} title="Окно поверх игры. Горячая клавиша Ctrl+Shift+O">
              <Icon name="overlay" />
              <span>Оверлей <span className="small faint">Ctrl+Shift+O</span></span>
            </button>
          )}
          <PlayerChip />
          <Versions />
        </div>
      </aside>
      <main className="main" ref={mainRef}>
        <Outlet />
      </main>
    </div>
  )
}
