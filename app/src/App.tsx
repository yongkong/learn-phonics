import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Practice from './pages/Practice'
import Leaderboard from './pages/Leaderboard'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  }`

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-svh bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <NavLink to="/" className="text-lg font-bold tracking-tight">
              📖 自然拼读训练营
            </NavLink>
            <nav className="flex items-center gap-1">
              <NavLink to="/learn" className={linkClass}>字母音图表</NavLink>
              <NavLink to="/practice" className={linkClass}>听音练习</NavLink>
              <NavLink to="/leaderboard" className={linkClass}>排行榜</NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          learn-phonics · 边学边建，和伙伴一起掌握自然拼读
        </footer>
      </div>
    </BrowserRouter>
  )
}
