export type IconName =
  | 'home' | 'world' | 'frame' | 'weapon' | 'farm' | 'map' | 'book' | 'user'
  | 'search' | 'refresh' | 'external' | 'back' | 'check' | 'star' | 'sigil'
  | 'clock' | 'cycle' | 'coin' | 'target' | 'banner' | 'gem' | 'trophy' | 'overlay'
  | 'mod' | 'relic' | 'market' | 'pet' | 'arcane' | 'close' | 'plus' | 'trash'

const PATHS: Record<IconName, string> = {
  home: 'M4 11 12 4l8 7M6 9.5V20h12V9.5',
  world: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
  frame: 'M12 3 6 6v5c0 4 2.6 7.6 6 9 3.4-1.4 6-5 6-9V6l-6-3Zm-3 7h6M12 10v6',
  weapon: 'M4 20 14 10m2-6 4 4-6 6-4-4 6-6ZM6 14l4 4',
  farm: 'M12 3 4 9l8 12 8-12-8-6Zm-8 6h16M9 9l3 12 3-12',
  map: 'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.2 2.2m8.4 8.4 2.2 2.2m0-12.8-2.2 2.2m-8.4 8.4-2.2 2.2',
  book: 'M4 5c3-1.3 5.7-1.3 8 0v14c-2.3-1.3-5-1.3-8 0V5Zm8 0c2.3-1.3 5-1.3 8 0v14c-3-1.3-5.7-1.3-8 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9c.8-3.6 3.6-6 7-6s6.2 2.4 7 6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4',
  refresh: 'M20 11a8 8 0 0 0-14.3-4.9L4 8m0-4v4h4m-4 5a8 8 0 0 0 14.3 4.9L20 16m0 4v-4h-4',
  external: 'M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  back: 'M15 5l-7 7 7 7',
  check: 'M5 12.5 10 17 19 7',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z',
  sigil: 'M12 2 3 12l9 10 9-10-9-10Zm0 4.5L16.5 12 12 17.5 7.5 12 12 6.5ZM12 2v4.5m0 11V22M3 12h4.5m9 0H21',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3.5 2',
  cycle: 'M4 12a8 8 0 0 1 13.7-5.6L20 9m0-5v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15m0 5v-5h5',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4 3.5 5L12 17l-3.5-5L12 7Z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  banner: 'M6 3v18M6 4h11l-2.5 4L17 12H6',
  gem: 'M7 4h10l4 5-9 11L3 9l4-5Zm-4 5h18M12 20 9 9l3-5 3 5-3 11',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H4c0 3 1.5 5 4 5m8-5h4c0 3-1.5 5-4 5m-4 2v4m-4 3h8',
  overlay: 'M3 5h13v10H3V5Zm5 10v4h13V9h-5',
  mod: 'M6 3h12l2 3v15H4V6l2-3Zm2 6h8m-8 4h8m-8 4h5',
  relic: 'M12 3 5 8v8l7 5 7-5V8l-7-5Zm0 5-3 2v4l3 2 3-2v-4l-3-2Z',
  market: 'M4 7h16l-1.5 11H5.5L4 7Zm4 0V5a4 4 0 0 1 8 0v2',
  pet: 'M5 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3 4c-3 0-6 4.5-6 7.5 0 2 1.5 3 3 3 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.5 0 3-1 3-3 0-3-3-7.5-6-7.5Z',
  arcane: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
  close: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
}

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
