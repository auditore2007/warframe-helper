import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppStateProvider } from './state/AppState'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { World } from './pages/World'
import { Rotations } from './pages/Rotations'
import { Frames } from './pages/Frames'
import { FrameDetail } from './pages/FrameDetail'
import { Weapons } from './pages/Weapons'
import { WeaponDetail } from './pages/WeaponDetail'
import { Companions, CompanionDetail } from './pages/Companions'
import { Mods } from './pages/Mods'
import { Arcanes } from './pages/Arcanes'
import { Relics } from './pages/Relics'
import { Shards } from './pages/Shards'
import { Farm } from './pages/Farm'
import { StarChart } from './pages/StarChart'
import { Guides, GuideView } from './pages/Guides'
import { Market } from './pages/Market'
import { RelicValue } from './pages/RelicValue'
import { Sell } from './pages/Sell'
import { Tracker } from './pages/Tracker'
import { Planner } from './pages/Planner'
import { Foundry } from './pages/Foundry'
import { Syndicates } from './pages/Syndicates'
import { Collections } from './pages/Collections'
import { Overlay } from './pages/Overlay'
import { Calculator } from './pages/Calculator'
import { Settings } from './pages/Settings'
import { Lookup } from './pages/Lookup'
import { Mastery } from './pages/Mastery'
import { Baro } from './pages/Baro'
import { Rivens } from './pages/Rivens'
import { EmptyState } from './components/ui'

export function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Routes>
          <Route path="overlay" element={<Overlay />} />
          <Route path="lookup" element={<Lookup />} />
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="world" element={<World />} />
            <Route path="rotations" element={<Rotations />} />
            <Route path="frames" element={<Frames />} />
            <Route path="frames/:id" element={<FrameDetail />} />
            <Route path="weapons" element={<Weapons />} />
            <Route path="weapons/:id" element={<WeaponDetail />} />
            <Route path="companions" element={<Companions />} />
            <Route path="companions/:id" element={<CompanionDetail />} />
            <Route path="mods" element={<Mods />} />
            <Route path="arcanes" element={<Arcanes />} />
            <Route path="relics" element={<Relics />} />
            <Route path="shards" element={<Shards />} />
            <Route path="calculator" element={<Calculator />} />
            <Route path="farm" element={<Farm />} />
            <Route path="starchart" element={<StarChart />} />
            <Route path="guides" element={<Guides />} />
            <Route path="guides/:id" element={<GuideView />} />
            <Route path="market" element={<Market />} />
            <Route path="relic-value" element={<RelicValue />} />
            <Route path="sell" element={<Sell />} />
            <Route path="baro" element={<Baro />} />
            <Route path="rivens" element={<Rivens />} />
            <Route path="mastery" element={<Mastery />} />
            <Route path="settings" element={<Settings />} />
            <Route path="tracker" element={<Tracker />} />
            <Route path="planner" element={<Planner />} />
            <Route path="foundry" element={<Foundry />} />
            <Route path="syndicates" element={<Syndicates />} />
            <Route path="collections" element={<Collections />} />
            <Route path="*" element={<div className="page"><EmptyState title="Страница не найдена" /></div>} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}
