export interface ApiResult<T> {
  ok: boolean
  data?: T
  fetchedAt?: number
  stale?: boolean
  error?: string
}

export interface Drop {
  location: string
  type?: string
  chance: number
  rarity?: string
}

export interface Component {
  uniqueName?: string
  name: string
  itemCount?: number
  imageName?: string
  tradable?: boolean
  drops?: Drop[]
}

export interface Ability {
  name: string
  description: string
}

export interface Item {
  uniqueName: string
  name: string
  description?: string
  imageName?: string
  category: string
  type?: string
  masteryReq?: number
  maxLevelCap?: number
  masterable?: boolean
  isPrime?: boolean
  vaulted?: boolean
  wikiaUrl?: string
  components?: Component[]
  abilities?: Ability[]
  passiveDescription?: string
  health?: number
  shield?: number
  armor?: number
  power?: number
  sprintSpeed?: number
  aura?: string
  polarities?: string[]
  releaseDate?: string
  buildPrice?: number
  bpCost?: number
  marketCost?: number
  buildTime?: number
  totalDamage?: number
  criticalChance?: number
  criticalMultiplier?: number
  procChance?: number
  fireRate?: number
  magazineSize?: number
  reloadTime?: number
  disposition?: number
  multishot?: number
  damage?: Record<string, number>
  trigger?: string
}

export interface DropSearchHit {
  place: string
  item: string
  rarity: string
  chance: number
}

export interface Cycle {
  id: string
  expiry: string
  activation?: string
  state: string
}

export interface Fissure {
  id: string
  node: string
  missionType: string
  enemy: string
  tier: string
  tierNum: number
  expiry: string
  isStorm: boolean
  isHard: boolean
}

export interface SortieVariant {
  missionType: string
  modifier: string
  modifierDescription?: string
  node: string
}

export interface ArchonMission {
  node: string
  type: string
}

export interface VoidTraderItem {
  item: string
  ducats: number
  credits: number
}

export interface Reward {
  items: string[]
  countedItems: { type: string; count: number }[]
  credits: number
  thumbnail?: string
}

export interface Invasion {
  id: string
  node: string
  desc: string
  completion: number
  completed: boolean
  vsInfestation: boolean
  attacker: { reward: Reward; faction: string }
  defender: { reward: Reward; faction: string }
}

export interface NightwaveChallenge {
  id: string
  title: string
  desc: string
  reputation: number
  isDaily: boolean
  isElite: boolean
  expiry: string
}

export interface DuviriCycle extends Cycle {
  choices?: { category: string; choices: string[] }[]
}

export interface WorldState {
  timestamp: string
  buildLabel?: string
  cetusCycle?: Cycle
  vallisCycle?: Cycle
  cambionCycle?: Cycle
  zarimanCycle?: Cycle
  earthCycle?: Cycle
  duviriCycle?: DuviriCycle
  fissures?: Fissure[]
  voidTrader?: { activation: string; expiry: string; location: string; inventory: VoidTraderItem[] }
  sortie?: { expiry: string; boss?: string; faction?: string; variants: SortieVariant[] }
  archonHunt?: { expiry: string; boss?: string; missions: ArchonMission[] }
  steelPath?: { activation?: string; expiry: string; currentReward?: { name: string; cost: number }; rotation?: { name: string; cost: number }[] }
  invasions?: Invasion[]
  nightwave?: { season: number; tag?: string; expiry: string; activeChallenges: NightwaveChallenge[] }
  arbitration?: { node: string; type: string; enemy: string; expiry: string; expired?: boolean }
  events?: { id: string; description: string; expiry: string; node?: string; tooltip?: string }[]
}

export interface SyndicateStanding {
  tag: string
  // общая за все ранги, в минусе ниже 0
  standing: number
  rank: number
}

export interface Profile {
  displayName: string | null
  masteryRank: number | null
  items: { uniqueName: string; xp: number }[]
  // в старом кэше профиля нет
  syndicates?: SyndicateStanding[]
  // сколько ещё можно сегодня
  dailyStanding?: Record<string, number>
}

export interface DetectResult {
  ok: boolean
  accountId?: string
  displayName?: string | null
  error?: string
}

export interface ShortDrop {
  location: string
  chance: number
  rarity?: string
}

export interface ModItem {
  uniqueName: string
  name: string
  type: string
  rarity?: string
  polarity?: string
  baseDrain?: number
  fusionLimit?: number
  compatName?: string
  isPrime: boolean
  tradable: boolean
  imageName?: string
  wikiaUrl?: string
  stats: string[]
  drops: ShortDrop[]
}

export interface ArcaneItem {
  uniqueName: string
  name: string
  type?: string
  rarity?: string
  imageName?: string
  wikiaUrl?: string
  tradable: boolean
  stats: string[]
  drops: ShortDrop[]
}

export interface RelicReward {
  name: string
  uniqueName?: string
  slug: string | null
  rarity?: string
  intact: number | null
  radiant: number | null
}

export interface RelicItem {
  id: string
  name: string
  tier: string
  code: string
  vaulted: boolean
  imageName?: string
  rewards: RelicReward[]
}

export interface CatalogMap {
  mods: ModItem[]
  arcanes: ArcaneItem[]
  relics: RelicItem[]
  companions: Item[]
}

export type CatalogName = keyof CatalogMap

export interface MarketItem {
  id?: string | null
  slug: string
  gameRef: string | null
  en: string
  ru: string | null
  ducats: number | null
  tags: string[]
}

export interface MarketSeller {
  name: string
  platinum: number
  quantity: number
  status: string
  rank: number | null
}

export interface MarketPrice {
  sell: number | null
  buy: number | null
  sellers: MarketSeller[]
}

export type PriceMap = Record<string, { median: number; average: number; volume: number }>

export interface PricePoint {
  t: number
  median: number
  min: number | null
  max: number | null
  volume: number
}

export interface PriceHistory {
  days: PricePoint[]
  hours: PricePoint[]
}

export interface BuildSummary {
  id: number
  title: string
  score: number
  formas: number
  author: string | null
  updated: string | null
  url: string
}

export interface BuildDetail {
  id: number
  description: string
  platinum: number
  endo: number
  masteryRank: number
  stats: Partial<Record<'strength' | 'duration' | 'range' | 'efficiency' | 'health' | 'shield' | 'armor' | 'energy', number>>
  totalDamage: number | null
  url: string
}

export interface ScannedReward {
  text: string
  slug: string | null
  name: string
  platinum: number | null
  ducats: number
}

export interface RewardScan {
  ok: boolean
  error?: string
  items: ScannedReward[]
  columns: string[]
  at: number
}

export type RewardEvent = { type: 'result'; data: RewardScan } | { type: 'status'; data: { busy: boolean } }

export interface AppSettings {
  closeToTray: boolean
  autostart: boolean
  hotkeys: { overlay: string; rewards: string }
  rewardArea: { x: number; y: number; w: number; h: number }
  lookup: { enabled: boolean; mode: 'hover' | 'click'; delayMs: number }
  notify: { foundry: boolean; watchlist: boolean }
}

export interface SettingsState {
  settings: AppSettings
  failedHotkeys: string[]
}

export interface LookupLine {
  text: string
  /** смещение центра строки от курсора, в точках экрана */
  dx: number
  dy: number
}

export interface RivenWeapon {
  slug: string
  en: string
  ru: string | null
  type: string | null
  disposition: number | null
}

export interface RivenAttribute {
  slug: string
  en: string
  ru: string | null
  unit: string | null
  positiveOnly: boolean
  negativeOnly: boolean
  exclusiveTo: string[] | null
}

export interface RivenAuction {
  id: string
  price: number
  seller: string
  status: string
  name: string
  rerolls: number
  mastery: number
  attributes: { slug: string; value: number; positive: boolean }[]
}

export interface RivenQuery {
  weapon: string
  positive: string[]
  negative: string | null
}

export interface Bridge {
  apiGet: (path: string, ttlSeconds?: number, force?: boolean) => Promise<ApiResult<unknown>>
  catalog: <K extends CatalogName>(name: K, force?: boolean) => Promise<ApiResult<CatalogMap[K]>>
  marketItems: (force?: boolean) => Promise<ApiResult<MarketItem[]>>
  marketPrice: (slug: string) => Promise<ApiResult<MarketPrice>>
  marketPrices: (force?: boolean) => Promise<ApiResult<PriceMap>>
  marketHistory: (slug: string) => Promise<ApiResult<PriceHistory>>
  buildsList: (itemName: string) => Promise<ApiResult<BuildSummary[]>>
  buildDetail: (id: number) => Promise<ApiResult<BuildDetail>>
  scanRewards: () => Promise<RewardScan>
  rivenWeapons: () => Promise<ApiResult<RivenWeapon[]>>
  rivenAttributes: () => Promise<ApiResult<RivenAttribute[]>>
  rivenAuctions: (query: RivenQuery) => Promise<ApiResult<RivenAuction[]>>
  getSettings: () => Promise<SettingsState>
  setSettings: (patch: Partial<AppSettings>) => Promise<SettingsState>
  onSettings: (cb: (s: AppSettings) => void) => () => void
  notify: (payload: { title: string; body: string; hash?: string; kind?: 'foundry' | 'watchlist' }) => Promise<void>
  onNavigate: (cb: (hash: string) => void) => () => void
  onLookupLines: (cb: (data: { lines: LookupLine[] }) => void) => () => void
  showLookup: (size: { width: number; height: number }) => Promise<void>
  hideLookup: () => Promise<void>
  openLastLookup: () => Promise<string>
  openLastScan: () => Promise<string>
  onRewards: (cb: (e: RewardEvent) => void) => () => void
  loginWarframe: () => Promise<{ ok: boolean; accountId?: string; error?: string }>
  parseAccountId: (text: string) => Promise<string | null>
  openUserDataPage: () => Promise<void>
  focusWindow: () => Promise<void>
  toggleOverlay: () => Promise<void>
  hideOverlay: () => Promise<void>
  setOverlayOpacity: (value: number) => Promise<void>
  detectAccount: () => Promise<DetectResult>
  fetchProfile: (accountId: string, platform: string) => Promise<ApiResult<Profile>>
  openExternal: (url: string) => Promise<void>
}

declare global {
  interface Window {
    wf?: Bridge
  }
}
