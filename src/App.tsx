import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Briefcase, CalendarClock, Scale, FileText, MessageSquare, FolderOpen, Menu, X, Timer } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Matters from './pages/Matters'
import Deadlines from './pages/Deadlines'
import Research from './pages/Research'
import LexChat from './pages/LexChat'
import ClientVault from './pages/ClientVault'
import Timekeeper from './pages/Timekeeper'
import { DEMO_CONFIG } from './config'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/matters',   icon: Briefcase,       label: 'Active Matters' },
  { to: '/deadlines', icon: CalendarClock,   label: 'Deadlines' },
  { to: '/research',  icon: FileText,        label: 'Research Log' },
  { to: '/clients',   icon: FolderOpen,      label: 'Client Vault' },
  { to: '/timekeeper', icon: Timer, label: 'Timekeeper' },
  { to: DEMO_CONFIG.chatPath, icon: MessageSquare, label: `${DEMO_CONFIG.agentIcon} Ask ${DEMO_CONFIG.agentName}` },
]

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 min-h-screen bg-slate-900 border-r border-slate-800 flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-0.5">
          <Scale className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-black text-white tracking-tight">{DEMO_CONFIG.agentName} Mission Control</span>
        </div>
        <p className="text-xs text-slate-500 pl-7">{DEMO_CONFIG.prospectName}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-amber-600/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600">Powered by ASG · {DEMO_CONFIG.agentName} {DEMO_CONFIG.version}</p>
      </div>
    </aside>
  )
}

// ── Mobile Top Bar + Drawer ───────────────────────────────────────────────────
function MobileNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const current = NAV.find(n => location.pathname.startsWith(n.to))

  return (
    <>
      {/* Sticky top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-[52px] bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Scale className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm font-black text-white truncate">{DEMO_CONFIG.agentName} MC</span>
          {current && (
            <>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-slate-400 truncate">{current.label}</span>
            </>
          )}
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors shrink-0">
          <Menu className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Slide-out drawer */}
      <div className={`md:hidden fixed top-0 right-0 z-50 h-full w-72 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Scale className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black text-white">{DEMO_CONFIG.agentName} Mission Control</span>
            </div>
            <p className="text-xs text-slate-500 pl-6">{DEMO_CONFIG.prospectName}</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  isActive ? 'bg-amber-600/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-600">Powered by ASG · {DEMO_CONFIG.agentName} {DEMO_CONFIG.version}</p>
        </div>
      </div>
    </>
  )
}

// ── Mobile default: go to /lex; desktop: go to /dashboard ────────────────────
function MobileDefaultRoute() {
  const navigate = useNavigate()
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    navigate(isMobile ? DEMO_CONFIG.chatPath : '/dashboard', { replace: true })
  }, [navigate])
  return null
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileNav />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<MobileDefaultRoute />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/matters"   element={<Matters />} />
              <Route path="/deadlines" element={<Deadlines />} />
              <Route path="/research"  element={<Research />} />
              <Route path="/clients"   element={<ClientVault />} />
              <Route path="/timekeeper" element={<Timekeeper />} />
              <Route path={DEMO_CONFIG.chatPath} element={<LexChat />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
