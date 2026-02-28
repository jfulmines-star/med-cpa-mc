import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, CalendarClock, Brain, AlertTriangle,
  CheckCircle2, TrendingUp, ChevronDown,
  ChevronRight, ArrowRight, Timer, DollarSign,
  Clock, Users, BarChart3, MessageSquare, Receipt, PhoneCall,
  TrendingDown, Zap
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts'
import { getAllClientHours, seedIfEmpty, UPDATE_EVENT } from '../timekeeper'

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  const day  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
  return <span className="text-slate-400 text-sm">{day} · <span className="tabular-nums text-slate-300 font-medium">{time}</span></span>
}

// ── Count-Up Number ───────────────────────────────────────────────────────────
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0); const started = useRef(false)
  useEffect(() => {
    if (started.current) return; started.current = true
    const steps = 28; const duration = 900; let step = 0
    const id = setInterval(() => { step++; setVal(Math.round((step / steps) * target)); if (step >= steps) clearInterval(id) }, duration / steps)
    return () => clearInterval(id)
  }, [target])
  return <>{val}{suffix}</>
}

// ── Deadline Countdown ────────────────────────────────────────────────────────
function DaysLeft({ dateStr }: { dateStr: string }) {
  const target = new Date(`${dateStr} 2026`)
  const diff = Math.ceil((target.getTime() - Date.now()) / 86400000)
  if (diff < 0) return <span className="text-xs font-bold text-slate-500">Past</span>
  if (diff === 0) return <span className="text-xs font-bold text-red-400 animate-pulse">TODAY</span>
  if (diff <= 3)  return <span className="text-xs font-bold text-red-400">{diff}d left</span>
  if (diff <= 7)  return <span className="text-xs font-bold text-amber-400">{diff}d left</span>
  return <span className="text-xs font-bold text-slate-400">{diff}d left</span>
}

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const round500 = (n: number) => Math.ceil(n / 500) * 500

// ── Monthly WIP Data ─────────────────────────────────────────────────────────
type MonthData = { month: string; revenue: number; billings: number; collected: number }
const MONTHLY_DATA: MonthData[] = [
  { month: "Feb 25", revenue: 42000,  billings: 38000,  collected: 35000  },
  { month: "Mar 25", revenue: 78000,  billings: 55000,  collected: 72000  },
  { month: "Apr 25", revenue: 95000,  billings: 88000,  collected: 68000  },
  { month: "May 25", revenue: 52000,  billings: 46000,  collected: 85000  },
  { month: "Jun 25", revenue: 38000,  billings: 41000,  collected: 44000  },
  { month: "Jul 25", revenue: 29000,  billings: 33000,  collected: 38000  },
  { month: "Aug 25", revenue: 34000,  billings: 28000,  collected: 31000  },
  { month: "Sep 25", revenue: 61000,  billings: 58000,  collected: 27000  },
  { month: "Oct 25", revenue: 74000,  billings: 62000,  collected: 55000  },
  { month: "Nov 25", revenue: 88000,  billings: 79000,  collected: 71000  },
  { month: "Dec 25", revenue: 56000,  billings: 92000,  collected: 48000  },
  { month: "Jan 26", revenue: 82000,  billings: 67000,  collected: 88000  },
  { month: "Feb 26", revenue: 94000,  billings: 94000,  collected: 41000  },
]

function detectDisparities(data: MonthData[]) {
  const flags: { month: string; type: string; detail: string; severity: 'warn' | 'info' }[] = []
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1]; const curr = data[i]
    const momRevDelta = (curr.revenue - prev.revenue) / prev.revenue
    const spreadPct   = Math.abs(curr.billings - curr.revenue) / curr.revenue
    if (Math.abs(momRevDelta) > 0.25) {
      flags.push({ month: curr.month, type: momRevDelta > 0 ? 'WIP spike' : 'WIP drop',
        detail: `WIP ${momRevDelta > 0 ? 'up' : 'down'} ${Math.abs(Math.round(momRevDelta * 100))}% vs ${prev.month} (${fmt$(prev.revenue)} → ${fmt$(curr.revenue)})`,
        severity: momRevDelta > 0 ? 'info' : 'warn' })
    }
    if (spreadPct > 0.40) {
      const higher = curr.billings > curr.revenue ? 'Billings' : 'WIP'
      flags.push({ month: curr.month, type: `${higher} / ${higher === 'Billings' ? 'WIP' : 'Billings'} spread`,
        detail: `${higher} exceeded ${higher === 'Billings' ? 'WIP' : 'billings'} by ${Math.round(spreadPct * 100)}% — ${fmt$(curr.billings)} billed vs ${fmt$(curr.revenue)} incurred`,
        severity: 'warn' })
    }
  }
  const feb25 = data[0]; const feb26 = data[data.length - 1]
  flags.push({ month: 'Year-over-Year', type: "WIP growth (Feb 25 → Feb 26)",
    detail: `+${Math.round(((feb26.revenue - feb25.revenue) / feb25.revenue) * 100)}% — ${fmt$(feb25.revenue)} → ${fmt$(feb26.revenue)}`, severity: 'info' })
  flags.push({ month: 'Year-over-Year', type: "Billings growth (Feb 25 → Feb 26)",
    detail: `+${Math.round(((feb26.billings - feb25.billings) / feb25.billings) * 100)}% — ${fmt$(feb25.billings)} → ${fmt$(feb26.billings)}`, severity: 'info' })
  return flags
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-xl text-xs space-y-1">
      <p className="font-bold text-white mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-white">{fmt$(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Engagement Management Data ────────────────────────────────────────────────
type EngagementClient = {
  id: string; name: string; short: string; specialty: string; rate: number
  hrsBilled: number; hrsUnbilled: number; budget: number
}

const ENGAGEMENT_CLIENTS: EngagementClient[] = [
  { id: 'meridian',   name: 'Meridian Capital Partners LLC',    short: 'Meridian Capital',  specialty: 'M&A Tax Structuring',       rate: 450, hrsBilled: 28, hrsUnbilled: 6,  budget: 24000 },
  { id: 'cascade',    name: 'Cascade Hospitality Group Inc.',   short: 'Cascade Hospitality', specialty: 'Multistate Compliance',   rate: 350, hrsBilled: 42, hrsUnbilled: 12, budget: 22000 },
  { id: 'northbrook', name: 'Northbrook Equity Partners LP',    short: 'Northbrook Equity', specialty: 'Partnership Tax',            rate: 400, hrsBilled: 22, hrsUnbilled: 8,  budget: 18000 },
  { id: 'pinnacle',   name: 'Pinnacle Manufacturing LLC',       short: 'Pinnacle Mfg',      specialty: 'Tax Controversy',            rate: 375, hrsBilled: 18, hrsUnbilled: 4,  budget: 16000 },
  { id: 'trident',    name: 'Trident Software Holdings Inc.',   short: 'Trident Software',  specialty: 'R&D Tax Credits',            rate: 350, hrsBilled: 24, hrsUnbilled: 6,  budget: 14000 },
  { id: 'harborview', name: 'Harborview Real Estate Group LLC', short: 'Harborview RE',     specialty: 'Opportunity Zone Planning',  rate: 350, hrsBilled: 10, hrsUnbilled: 3,  budget: 8000  },
  { id: 'bluestone',  name: 'BlueStone Family Office LLC',      short: 'BlueStone Family',  specialty: 'PTET / Family Office',       rate: 425, hrsBilled: 14, hrsUnbilled: 4,  budget: 12000 },
  { id: 'keystone',   name: 'Keystone Logistics Partners Inc.', short: 'Keystone Logistics', specialty: 'COD Income / Restructuring', rate: 325, hrsBilled: 8,  hrsUnbilled: 2,  budget: 6000  },
]

function computeClient(c: EngagementClient) {
  const revBilled   = c.rate * c.hrsBilled
  const revUnbilled = c.rate * c.hrsUnbilled
  const revTotal    = revBilled + revUnbilled
  const pct         = revTotal / c.budget
  const atRisk      = pct >= 0.70; const critical = pct >= 0.85
  const projected   = round500((revTotal / pct) * 1.15)
  const suggestedBudget = Math.max(projected, c.budget)
  const suggestedIncrease = suggestedBudget - c.budget
  return { revBilled, revUnbilled, revTotal, pct, atRisk, critical, suggestedBudget, suggestedIncrease }
}

// ── Invoices ─────────────────────────────────────────────────────────────────
const LATE_PENALTY_DAYS = 60; const LATE_PENALTY_PCT = 0.05

type Invoice = {
  id: string; clientId: string; clientName: string; clientShort: string
  invoiceNum: string; amount: number; daysOutstanding: number; invoiceDate: string; description: string
}

const INVOICES: Invoice[] = [
  { id: 'inv-1', clientId: 'meridian',   clientShort: 'Meridian Capital',   clientName: 'Meridian Capital Partners LLC',    invoiceNum: 'INV-2026-024', amount: 14400, daysOutstanding: 12, invoiceDate: 'Feb 15, 2026', description: 'M&A tax structuring — §338(h)(10) election analysis and initial due diligence' },
  { id: 'inv-2', clientId: 'cascade',    clientShort: 'Cascade Hospitality', clientName: 'Cascade Hospitality Group Inc.',   invoiceNum: 'INV-2026-021', amount: 11200, daysOutstanding: 18, invoiceDate: 'Feb 9, 2026',  description: 'FY2024 multistate consolidated returns — final prep and filing (12 states)' },
  { id: 'inv-3', clientId: 'northbrook', clientShort: 'Northbrook Equity',   clientName: 'Northbrook Equity Partners LP',    invoiceNum: 'INV-2026-018', amount: 8400,  daysOutstanding: 28, invoiceDate: 'Jan 30, 2026', description: 'Partnership restructuring — §754 election analysis and LP admission structuring' },
  { id: 'inv-4', clientId: 'trident',    clientShort: 'Trident Software',    clientName: 'Trident Software Holdings Inc.',   invoiceNum: 'INV-2026-014', amount: 7200,  daysOutstanding: 38, invoiceDate: 'Jan 20, 2026', description: 'R&D tax credit study — interim deliverable, QRE documentation and wage qualification' },
  { id: 'inv-5', clientId: 'bluestone',  clientShort: 'BlueStone Family',    clientName: 'BlueStone Family Office LLC',      invoiceNum: 'INV-2026-009', amount: 5100,  daysOutstanding: 52, invoiceDate: 'Jan 6, 2026',  description: 'NY PTET election and overpayment analysis — 2023 and 2024 tax years' },
  { id: 'inv-6', clientId: 'pinnacle',   clientShort: 'Pinnacle Mfg',        clientName: 'Pinnacle Manufacturing LLC',       invoiceNum: 'INV-2025-092', amount: 6750,  daysOutstanding: 65, invoiceDate: 'Dec 23, 2025', description: 'NYS DTF residency audit — initial response strategy, day-count analysis, domicile memo' },
  { id: 'inv-7', clientId: 'keystone',   clientShort: 'Keystone Logistics',  clientName: 'Keystone Logistics Partners Inc.', invoiceNum: 'INV-2025-084', amount: 2600,  daysOutstanding: 74, invoiceDate: 'Dec 15, 2025', description: 'COD income analysis — §108 insolvency exclusion and attribute reduction memo (Phase 1)' },
]

// ── Key Actions & Quick Actions ───────────────────────────────────────────────
const MATTERS = [
  { id: 'B-001', matter: 'Meridian Capital Partners LLC', task: 'M&A Tax Due Diligence Memo due',
    date: 'Mar 3', type: 'Deliverable', urgent: true,
    detail: 'Final tax due diligence memo for $48M stock acquisition of Lakeview Industrial Holdings. §338(h)(10) election recommendation, §1060 purchase price allocation schedule, and NY/OH apportionment analysis for surviving entity. Buyer counsel deadline is firm.',
    ariaQ: "What is the §338(h)(10) election procedure for the Meridian Capital acquisition? Walk me through the timing, filing requirements on Form 8023, and the AGUB calculation under §1060." },
  { id: 'B-002', matter: 'Pinnacle Manufacturing LLC', task: 'DTF IDR Response due',
    date: 'Mar 10', type: 'Controversy', urgent: true,
    detail: 'NYS DTF Information Document Request — statutory residency audit of owner. Co-op in Manhattan used ~130 days/year; domicile maintained in FL. $2.1M in dispute. Response requires day-count documentation, domicile factor analysis, and coordination with litigation counsel.',
    ariaQ: "Walk me through NYS statutory residency — what are the day-count rules, how is domicile determined, and what documentation does DTF typically require in a residency audit?" },
  { id: 'B-003', matter: 'Cascade Hospitality Group Inc.', task: 'FY2025 Multistate Returns — final workpapers due',
    date: 'Mar 15', type: 'Compliance', urgent: true,
    detail: '12-state combined/unitary filings (CA, NY, TX, FL, IL, NJ, OH, PA, NC, GA, CO, AZ). Hotel management contract revenue creates nexus complexity — apportionment factor review across all states required before returns go to filing team.',
    ariaQ: "For a hotel management company with revenue from management contracts in 12 states, what are the main apportionment factor issues I should address in the workpapers? How do cost of performance vs. market-based sourcing rules apply?" },
  { id: 'B-004', matter: 'Northbrook Equity Partners LP', task: '§754 Election statement — draft needed',
    date: 'Mar 17', type: 'Filing', urgent: false,
    detail: '$120M LP restructuring with incoming institutional LPs and secondary transfers of existing interests. §754 election statement and §743(b) basis adjustment schedule required before LP admission documents are finalized.',
    ariaQ: "Walk me through §754 election mechanics. How is the §743(b) adjustment calculated for a transferee LP, and how does §755 govern the allocation of that adjustment across partnership assets?" },
  { id: 'B-005', matter: 'BlueStone Family Office LLC', task: 'PTET refund federal taxability memo — in progress',
    date: 'Mar 22', type: 'Advisory', urgent: false,
    detail: 'NY PTET overpayment 2023/2024: $185K refund. Individual partners questioning federal taxability. Applying §111 tax benefit rule by analogy — refund is taxable to the extent PTET payment produced federal deduction at entity level (confirmed by Notice 2020-75). IRS guidance gap exists.',
    ariaQ: "Is a NY PTET overpayment refund federally taxable to individual partners? Walk me through the §111 tax benefit rule analysis and the current state of IRS guidance on this." },
]

const QUICK_ACTIONS = [
  { label: 'Review all upcoming deadlines and priorities',     q: 'Walk me through all my upcoming deadlines this month. What needs immediate attention?' },
  { label: 'Meridian Capital §338(h)(10) election analysis',  q: 'For the Meridian Capital acquisition of Lakeview Industrial Holdings for $48M, analyze the §338(h)(10) election — pros, cons, timing, and Form 8023 filing mechanics.' },
  { label: 'Cascade Hospitality multistate apportionment',    q: 'For Cascade Hospitality Group with hotel management contract revenue in 12 states, walk me through the market-based sourcing rules vs. cost of performance and the key apportionment risks I should address in the FY2025 workpapers.' },
  { label: 'BlueStone PTET refund — draft client memo',       q: 'Draft a client memo for BlueStone Family Office advising on the federal taxability of their $185K NY PTET refund. Apply the §111 tax benefit rule by analogy and note the open IRS guidance gap.' },
]

const STATS = [
  { label: 'Active Engagements', value: 8,  suffix: '',      icon: Briefcase,    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  { label: 'Deadlines (30d)',    value: 5,  suffix: '',      icon: CalendarClock, color: 'text-amber-400',  bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  { label: 'Aria Research Queries', value: 47, suffix: '',   icon: Brain,        color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20'  },
  { label: 'Est. Hours Saved',   value: 14, suffix: ' hrs',  icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
]

// ── Team Workload ─────────────────────────────────────────────────────────────
const TEAM = [
  { name: 'Tax Partner',   role: 'Tax Partner',          matters: 8, hoursThis: 22, hoursLast: 19, utilization: 91 },
  { name: 'Diane Caruso',    role: 'Tax Manager',           matters: 6, hoursThis: 38, hoursLast: 34, utilization: 84 },
  { name: 'Marcus Webb',     role: 'Senior Tax Associate',  matters: 5, hoursThis: 41, hoursLast: 37, utilization: 88 },
  { name: 'Priya Nolan',     role: 'Tax Associate',         matters: 4, hoursThis: 36, hoursLast: 30, utilization: 75 },
  { name: 'Tyler Ostrowski', role: 'Tax Associate',         matters: 3, hoursThis: 28, hoursLast: 32, utilization: 62 },
]

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const [dismissedFollowUps, setDismissedFollowUps] = useState<string[]>([])

  function askAria(q: string) {
    sessionStorage.setItem('aria_prefill', q)
    navigate('/aria')
  }

  const [tkHours, setTkHours] = useState<Record<string, { billed: number; unbilled: number }>>({})
  useEffect(() => {
    seedIfEmpty()
    const read = () => setTkHours(getAllClientHours())
    read()
    window.addEventListener(UPDATE_EVENT, read)
    return () => window.removeEventListener(UPDATE_EVENT, read)
  }, [])

  const computed = ENGAGEMENT_CLIENTS.map(c => {
    const live = tkHours[c.id]
    return { ...c, hrsBilled: live?.billed ?? c.hrsBilled, hrsUnbilled: live?.unbilled ?? c.hrsUnbilled, ...computeClient({ ...c, hrsBilled: live?.billed ?? c.hrsBilled, hrsUnbilled: live?.unbilled ?? c.hrsUnbilled }) }
  })

  const draftInvoicesPrompt = computed.filter(c => c.hrsUnbilled > 0).sort((a, b) => b.revUnbilled - a.revUnbilled)
    .map(c => `- ${c.name}: ${c.hrsUnbilled} hours at ${fmt$(c.rate)}/hr = ${fmt$(c.revUnbilled)}`).join('\n')
  const ariaDraftInvoices = `Draft engagement fee memos for the following unbilled client work:\n${draftInvoicesPrompt}\n\nFor each client, draft a concise, professional billing memo suitable for emailing with the invoice. Include the engagement description, hours, rate, amount due, and payment instructions.`
  const atRiskClients = computed.filter(c => c.atRisk && !dismissedAlerts.includes(c.id))
  const totalHrsBilled   = computed.reduce((s, c) => s + c.hrsBilled, 0)
  const totalHrsUnbilled = computed.reduce((s, c) => s + c.hrsUnbilled, 0)
  const totalRevBilled   = computed.reduce((s, c) => s + c.revBilled, 0)
  const totalRevUnbilled = computed.reduce((s, c) => s + c.revUnbilled, 0)
  const totalBudget      = computed.reduce((s, c) => s + c.budget, 0)
  const totalRevIncurred = totalRevBilled + totalRevUnbilled
  const overallPct       = totalRevIncurred / totalBudget

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-6 md:space-y-8">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl font-black text-white">{(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })()}.</h1>
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <LiveClock />
          <span className="text-slate-600">·</span>
          <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
            <Timer className="w-3 h-3" /> {MATTERS.filter(m => m.urgent).length} items need attention
          </span>
          {atRiskClients.length > 0 && (
            <><span className="text-slate-600">·</span>
            <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> {atRiskClients.length} engagement{atRiskClients.length > 1 ? 's' : ''} near budget limit
            </span></>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className={`flex items-center gap-4 p-4 rounded-xl border ${s.border} ${s.bg} transition-transform hover:scale-[1.02] cursor-default`}>
            <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
            <div>
              <p className={`text-2xl font-black tabular-nums ${s.color}`}><CountUp target={s.value} suffix={s.suffix} /></p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── KEY ACTIONS + QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Key Actions</h2>
          </div>
          <div className="space-y-2">
            {MATTERS.map((item) => (
              <div key={item.id} className={`rounded-xl border transition-colors ${item.urgent ? 'bg-blue-950/20 border-blue-800/30' : 'bg-slate-800/40 border-slate-700/40'}`}>
                <button className="w-full flex items-center justify-between px-4 py-3 text-left" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    {expanded === item.id ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.matter}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.task}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-0.5">
                    <DaysLeft dateStr={item.date} />
                    <p className="text-xs text-slate-600">{item.type}</p>
                  </div>
                </button>
                {expanded === item.id && (
                  <div className="px-4 pb-4 border-t border-slate-700/30 pt-3 space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
                    <button onClick={() => askAria(item.ariaQ)} className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      <Brain className="w-3.5 h-3.5" /> Ask Aria about this engagement <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((qa) => (
              <button key={qa.label} onClick={() => askAria(qa.q)} className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 hover:border-blue-700/40 hover:bg-blue-950/20 transition-all group">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-300 group-hover:text-white transition-colors leading-relaxed">{qa.label}</p>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 shrink-0 transition-colors" />
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800">
            <button onClick={() => navigate('/aria')} className="w-full py-2 rounded-xl bg-blue-600/20 border border-blue-700/30 text-xs text-blue-400 hover:bg-blue-600/30 transition-colors font-medium">
              🧠 Open Aria Chat
            </button>
          </div>
        </div>
      </div>

      {/* ── ENGAGEMENT SNAPSHOT ── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Engagement Snapshot — February 2026</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Engagements opened', value: 2,  suffix: '',      sub: 'this month'         },
            { label: 'Engagements closed',  value: 1,  suffix: '',      sub: 'this month'         },
            { label: 'Avg. engagement age', value: 62, suffix: ' days', sub: 'active engagements' },
            { label: 'Aria hours saved',    value: 14, suffix: ' hrs',  sub: 'est. research time' },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors cursor-default">
              <p className="text-xl font-black text-white tabular-nums"><CountUp target={s.value} suffix={s.suffix} /></p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              <p className="text-xs text-slate-600">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ENGAGEMENT MANAGEMENT ── */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-black text-white tracking-tight">Engagement Management</h2>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Clients',     display: String(ENGAGEMENT_CLIENTS.length),         icon: Users,      color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
            { label: 'Total Hours',        display: `${totalHrsBilled + totalHrsUnbilled} hrs`, icon: Clock,      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
            { label: 'WIP Incurred',       display: fmt$(totalRevIncurred),                     icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Total Budgeted',     display: fmt$(totalBudget),                          icon: TrendingUp, color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20'  },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-4 p-4 rounded-xl border ${s.border} ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
              <div>
                <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.display}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Required Billing + Billing Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Required Billing</p>
                <p className="text-[10px] text-slate-600">Unbilled WIP — ready to invoice</p>
              </div>
              <button onClick={() => askAria(ariaDraftInvoices)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-700/30 text-blue-400 hover:bg-blue-600/30 transition-colors font-medium whitespace-nowrap shrink-0">
                <Brain className="w-3 h-3" /> Ask Aria — draft billing memos
              </button>
            </div>
            <div className="space-y-2">
              {computed.filter(c => c.hrsUnbilled > 0).sort((a, b) => b.revUnbilled - a.revUnbilled).map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{c.short}</p>
                    <p className="text-[10px] text-slate-500">{c.hrsUnbilled} hrs × {fmt$(c.rate)}/hr</p>
                  </div>
                  <span className="text-xs font-bold text-blue-400 tabular-nums shrink-0">{fmt$(c.revUnbilled)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">{computed.filter(c => c.hrsUnbilled > 0).length} invoices to send</span>
              <span className="text-xs font-bold text-blue-300">{fmt$(totalRevUnbilled)} total</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Billing Summary</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Billed',     val: fmt$(totalRevBilled),   sub: `${totalHrsBilled} hrs`,   color: 'text-sky-400'     },
                { label: 'Unbilled',   val: fmt$(totalRevUnbilled), sub: `${totalHrsUnbilled} hrs`, color: 'text-slate-300'   },
                { label: '% Incurred', val: `${Math.round(overallPct * 100)}%`, sub: `of ${fmt$(totalBudget)} budgeted`,
                  color: overallPct >= 0.85 ? 'text-red-400' : overallPct >= 0.70 ? 'text-orange-400' : 'text-emerald-400' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-slate-800/30 rounded-xl">
                  <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  <p className="text-xs text-slate-600">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="flex-1 flex flex-col justify-center bg-slate-800/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Overall Budget Utilization</span>
                <span className={`text-2xl font-black tabular-nums ${overallPct >= 0.85 ? 'text-red-400' : overallPct >= 0.70 ? 'text-orange-400' : 'text-emerald-400'}`}>{Math.round(overallPct * 100)}%</span>
              </div>
              <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-sky-500 rounded-l-full transition-all" style={{ width: `${Math.min((totalRevBilled / totalBudget) * 100, 100)}%` }} />
                <div className="absolute top-0 h-full bg-slate-400/60 transition-all" style={{ left: `${Math.min((totalRevBilled / totalBudget) * 100, 100)}%`, width: `${Math.min((totalRevUnbilled / totalBudget) * 100, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />Billed {fmt$(totalRevBilled)}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400/60 inline-block" />Unbilled {fmt$(totalRevUnbilled)}</span>
                </div>
                <span className="text-slate-500">{fmt$(totalBudget - totalRevIncurred)} remaining</span>
              </div>
              <div className="pt-1 space-y-1.5">
                {computed.sort((a, b) => b.pct - a.pct).map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-24 truncate shrink-0">{c.short}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.critical ? 'bg-red-500' : c.atRisk ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(c.pct * 100, 100)}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums w-8 text-right shrink-0 ${c.critical ? 'text-red-400' : c.atRisk ? 'text-amber-400' : 'text-slate-500'}`}>{Math.round(c.pct * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Client Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <p className="text-xs font-bold text-white uppercase tracking-widest">Client-Level Detail</p>
          </div>
          <div className="hidden md:grid grid-cols-12 px-5 py-2 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="col-span-3">Client</div><div className="col-span-1 text-right">Rate</div>
            <div className="col-span-1 text-right">Billed Hrs</div><div className="col-span-1 text-right">Unbilled Hrs</div>
            <div className="col-span-1 text-right">WIP Billed</div><div className="col-span-1 text-right">WIP Unbilled</div>
            <div className="col-span-1 text-right">Incurred</div><div className="col-span-1 text-right">Budget</div>
            <div className="col-span-2 text-right">% Incurred</div>
          </div>
          <div className="divide-y divide-slate-800/50">
            {computed.map((c) => (
              <div key={c.id} className={`hover:bg-slate-800/30 transition-colors ${c.critical ? 'border-l-2 border-l-red-500' : c.atRisk ? 'border-l-2 border-l-amber-500' : ''}`}>
                <div className="hidden md:grid grid-cols-12 px-5 py-3 items-center">
                  <div className="col-span-3"><p className="text-sm font-semibold text-white">{c.short}</p><p className="text-[10px] text-slate-500">{c.specialty}</p></div>
                  <div className="col-span-1 text-right text-xs text-slate-300">{fmt$(c.rate)}/hr</div>
                  <div className="col-span-1 text-right text-xs text-sky-400 font-semibold">{c.hrsBilled}</div>
                  <div className="col-span-1 text-right text-xs text-slate-300 font-semibold">{c.hrsUnbilled}</div>
                  <div className="col-span-1 text-right text-xs text-sky-400">{fmt$(c.revBilled)}</div>
                  <div className="col-span-1 text-right text-xs text-slate-300">{fmt$(c.revUnbilled)}</div>
                  <div className="col-span-1 text-right text-xs font-bold text-white">{fmt$(c.revTotal)}</div>
                  <div className="col-span-1 text-right text-xs text-slate-400">{fmt$(c.budget)}</div>
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.critical ? 'bg-red-500' : c.atRisk ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(c.pct * 100, 100)}%` }} />
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${c.critical ? 'text-red-400' : c.atRisk ? 'text-amber-400' : 'text-slate-300'}`}>{Math.round(c.pct * 100)}%</span>
                    </div>
                  </div>
                </div>
                <div className="md:hidden px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-white">{c.short}</p>
                    <span className={`text-xs font-bold ${c.critical ? 'text-red-400' : c.atRisk ? 'text-amber-400' : 'text-slate-400'}`}>{Math.round(c.pct * 100)}% incurred</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${c.critical ? 'bg-red-500' : c.atRisk ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(c.pct * 100, 100)}%` }} />
                  </div>
                  <div className="flex gap-4 text-[10px] text-slate-500">
                    <span>Billed {fmt$(c.revBilled)}</span><span>Unbilled {fmt$(c.revUnbilled)}</span><span>Budget {fmt$(c.budget)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Alerts */}
        {atRiskClients.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm font-bold text-white">Budget Alerts</p>
              <span className="text-xs text-slate-500">— {atRiskClients.length} engagement{atRiskClients.length > 1 ? 's' : ''} approaching budget threshold</span>
            </div>
            {atRiskClients.map((c) => (
              <div key={c.id} className={`rounded-2xl border p-5 ${c.critical ? 'bg-red-950/20 border-red-800/30' : 'bg-amber-950/10 border-amber-800/20'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-white">{c.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${c.critical ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{Math.round(c.pct * 100)}% of budget incurred {c.critical ? '— CRITICAL' : '— AT RISK'}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{fmt$(c.revTotal)} incurred of {fmt$(c.budget)} budget · {c.hrsBilled + c.hrsUnbilled} total hours · {fmt$(c.rate)}/hr</p>
                    <div className="mb-3"><div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${c.critical ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(c.pct * 100, 100)}%` }} /></div></div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5"><MessageSquare className="w-2.5 h-2.5 text-amber-400" /></div>
                        <p className="text-xs text-amber-200/90"><strong>Schedule budget conversation with {c.short}.</strong> At current pace, the engagement will exceed the {fmt$(c.budget)} budget. Recommend discussing scope and agreeing a revised fee before additional work proceeds.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded border border-blue-500/40 bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5"><DollarSign className="w-2.5 h-2.5 text-blue-400" /></div>
                        <p className="text-xs text-blue-200/90"><strong>Suggested budget increase: {fmt$(c.suggestedIncrease)}</strong> — bringing total to {fmt$(c.suggestedBudget)}. Based on {Math.round(c.pct * 100)}% completion at {fmt$(c.revTotal)} incurred, with 15% contingency.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => askAria(`Draft a budget conversation memo for my client ${c.name}. We are at ${Math.round(c.pct * 100)}% of our ${fmt$(c.budget)} fee budget after ${c.hrsBilled + c.hrsUnbilled} hours at ${fmt$(c.rate)}/hr. I want to suggest a revised budget of ${fmt$(c.suggestedBudget)} — an increase of ${fmt$(c.suggestedIncrease)}. Give me talking points and a suggested client email.`)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-700/30 text-blue-400 hover:bg-blue-600/30 transition-colors font-medium whitespace-nowrap flex items-center gap-1.5">
                      <Brain className="w-3 h-3" /> Ask Aria — draft budget email
                    </button>
                    <button onClick={() => setDismissedAlerts(d => [...d, c.id])} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-300 transition-colors">Dismiss alert</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BILLING ── */}
      {(() => {
        const lateInvoices    = INVOICES.filter(i => i.daysOutstanding > LATE_PENALTY_DAYS)
        const totalOutstanding = INVOICES.reduce((s, i) => s + i.amount, 0)
        const totalLate        = lateInvoices.reduce((s, i) => s + i.amount, 0)
        const totalPenaltyEligible = lateInvoices.reduce((s, i) => s + i.amount * LATE_PENALTY_PCT, 0)
        const pendingFollowUps = lateInvoices.filter(i => !dismissedFollowUps.includes(i.id))
        const ageBadge = (days: number) => {
          if (days > LATE_PENALTY_DAYS) return 'bg-red-500/10 text-red-400 border border-red-500/20'
          if (days > 45) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          return 'bg-slate-700 text-slate-400 border border-slate-600'
        }
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-2"><Receipt className="w-5 h-5 text-blue-400" /><h2 className="text-lg font-black text-white tracking-tight">Billing</h2></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Outstanding',    display: fmt$(totalOutstanding),      icon: DollarSign,    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
                { label: 'Invoices Outstanding', display: String(INVOICES.length),     icon: Receipt,       color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
                { label: '>60 Days Outstanding', display: fmt$(totalLate),             icon: Clock,         color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
                { label: 'Penalty Eligible (5%)',display: fmt$(totalPenaltyEligible),  icon: AlertTriangle, color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20'  },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-4 p-4 rounded-xl border ${s.border} ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
                  <div><p className={`text-xl font-black tabular-nums ${s.color}`}>{s.display}</p><p className="text-xs text-slate-400">{s.label}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <p className="text-xs font-bold text-white uppercase tracking-widest">Outstanding Invoices</p>
                <span className="text-[10px] text-red-400 font-semibold">Invoices &gt;60 days eligible for {(LATE_PENALTY_PCT * 100).toFixed(0)}% late fee</span>
              </div>
              <div className="hidden md:grid grid-cols-12 px-5 py-2 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="col-span-3">Client</div><div className="col-span-2">Invoice</div><div className="col-span-2">Date</div>
                <div className="col-span-2 text-right">Amount</div><div className="col-span-1 text-right">Days Out</div><div className="col-span-2 text-right">Penalty (5%)</div>
              </div>
              <div className="divide-y divide-slate-800/50">
                {[...INVOICES].sort((a, b) => b.daysOutstanding - a.daysOutstanding).map(inv => {
                  const isLate = inv.daysOutstanding > LATE_PENALTY_DAYS
                  const penalty = inv.amount * LATE_PENALTY_PCT
                  return (
                    <div key={inv.id} className={`hover:bg-slate-800/30 transition-colors ${isLate ? 'border-l-2 border-l-red-500' : ''}`}>
                      <div className="hidden md:grid grid-cols-12 px-5 py-3 items-center">
                        <div className="col-span-3"><p className="text-sm font-semibold text-white">{inv.clientShort}</p><p className="text-[10px] text-slate-500 truncate">{inv.description.slice(0, 40)}…</p></div>
                        <div className="col-span-2 text-xs font-mono text-slate-400">{inv.invoiceNum}</div>
                        <div className="col-span-2 text-xs text-slate-400">{inv.invoiceDate}</div>
                        <div className="col-span-2 text-right text-sm font-bold text-white">{fmt$(inv.amount)}</div>
                        <div className="col-span-1 text-right"><span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ageBadge(inv.daysOutstanding)}`}>{inv.daysOutstanding}d</span></div>
                        <div className="col-span-2 text-right">{isLate ? <span className="text-sm font-bold text-red-400">{fmt$(penalty)}</span> : <span className="text-xs text-slate-600">—</span>}</div>
                      </div>
                      <div className="md:hidden px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0"><p className="text-sm font-semibold text-white">{inv.clientShort}</p><p className="text-xs text-slate-500">{inv.invoiceNum} · {inv.invoiceDate}</p></div>
                        <div className="text-right shrink-0"><p className="text-sm font-bold text-white">{fmt$(inv.amount)}</p><span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ageBadge(inv.daysOutstanding)}`}>{inv.daysOutstanding}d</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="px-5 py-3 border-t border-slate-700 bg-red-950/10 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-red-400">{lateInvoices.length} invoice{lateInvoices.length > 1 ? 's' : ''} past 60 days — {fmt$(totalLate)} outstanding</span>
                <span className="text-xs font-bold text-red-300">Total penalty eligible: {fmt$(totalPenaltyEligible)}</span>
              </div>
            </div>
            {pendingFollowUps.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2"><PhoneCall className="w-4 h-4 text-red-400" /><p className="text-sm font-bold text-white">Collection Follow-Ups</p><span className="text-xs text-slate-500">— {pendingFollowUps.length} overdue invoice{pendingFollowUps.length > 1 ? 's' : ''} requiring client contact</span></div>
                {pendingFollowUps.sort((a, b) => b.daysOutstanding - a.daysOutstanding).map(inv => {
                  const penalty = inv.amount * LATE_PENALTY_PCT
                  return (
                    <div key={inv.id} className="bg-red-950/20 border border-red-800/30 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-bold text-white">{inv.clientName}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20">{inv.daysOutstanding} days outstanding</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{inv.invoiceNum} · {fmt$(inv.amount)} · issued {inv.invoiceDate}</p>
                          <p className="text-xs text-slate-500 mb-3 italic">{inv.description}</p>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded border border-red-500/40 bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5"><PhoneCall className="w-2.5 h-2.5 text-red-400" /></div>
                              <p className="text-xs text-red-200/90"><strong>Contact {inv.clientShort} immediately.</strong> Invoice {inv.invoiceNum} for {fmt$(inv.amount)} is {inv.daysOutstanding} days outstanding — {inv.daysOutstanding - LATE_PENALTY_DAYS} days past the 60-day threshold.</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5"><DollarSign className="w-2.5 h-2.5 text-amber-400" /></div>
                              <p className="text-xs text-amber-200/90"><strong>5% late fee applies: {fmt$(penalty)}.</strong> Total if assessed: {fmt$(inv.amount + penalty)}.</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button onClick={() => askAria(`Draft a professional past-due invoice follow-up for my client ${inv.clientName}. Invoice ${inv.invoiceNum} for ${fmt$(inv.amount)} has been outstanding for ${inv.daysOutstanding} days. A 5% late fee of ${fmt$(penalty)} now applies, bringing the total to ${fmt$(inv.amount + penalty)}. Give me two versions: (1) firm notice with the fee applied, (2) goodwill version waiving the fee for immediate payment.`)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-700/30 text-blue-400 hover:bg-blue-600/30 transition-colors font-medium whitespace-nowrap flex items-center gap-1.5">
                            <Brain className="w-3 h-3" /> Ask Aria — draft follow-up
                          </button>
                          <button onClick={() => setDismissedFollowUps(d => [...d, inv.id])} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-300 transition-colors">Mark contacted</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── MONTHLY TRENDS ── */}
      {(() => {
        const disparities = detectDisparities(MONTHLY_DATA)
        const warns = disparities.filter(d => d.severity === 'warn')
        const infos = disparities.filter(d => d.severity === 'info')
        const axisStyle = { fill: '#64748b', fontSize: 10 }
        const gridStyle = { stroke: '#1e293b' }
        const tickFormatter = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
        const avgRevenue  = Math.round(MONTHLY_DATA.reduce((s, d) => s + d.revenue, 0) / MONTHLY_DATA.length)
        const avgBillings = Math.round(MONTHLY_DATA.reduce((s, d) => s + d.billings, 0) / MONTHLY_DATA.length)
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /><h2 className="text-lg font-black text-white tracking-tight">Monthly Trends — Feb 2025 to Feb 2026</h2></div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">WIP Incurred vs. Billings Issued</p>
              <p className="text-[10px] text-slate-600 mb-4">Both metrics — 13-month view. WIP = work incurred (hrs × rate). Billings = invoices issued.</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MONTHLY_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
                    <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={tickFormatter} tick={axisStyle} axisLine={false} tickLine={false} width={44} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
                    <Line type="monotone" dataKey="revenue" name="WIP Incurred" stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399', r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="billings" name="Billings" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">WIP Incurred</p>
                <p className="text-[10px] text-slate-600 mb-4">Monthly work incurred Feb 2025 – Feb 2026</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
                      <XAxis dataKey="month" tick={{ ...axisStyle, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={tickFormatter} tick={{ ...axisStyle, fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={avgRevenue} stroke="#34d399" strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: `Avg ${fmt$(avgRevenue)}`, fill: '#34d399', fontSize: 9, position: 'insideTopRight' }} />
                      <Area type="monotone" dataKey="revenue" name="WIP Incurred" stroke="#34d399" strokeWidth={2} fill="url(#revGrad2)" dot={{ fill: '#34d399', r: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Feb '25 → Feb '26</span>
                  <span className="text-emerald-400 font-bold">+{Math.round(((MONTHLY_DATA[12].revenue - MONTHLY_DATA[0].revenue) / MONTHLY_DATA[0].revenue) * 100)}% YoY</span>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Billings Issued</p>
                <p className="text-[10px] text-slate-600 mb-4">Monthly invoices issued Feb 2025 – Feb 2026</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="billGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
                      <XAxis dataKey="month" tick={{ ...axisStyle, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={tickFormatter} tick={{ ...axisStyle, fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={avgBillings} stroke="#818cf8" strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: `Avg ${fmt$(avgBillings)}`, fill: '#818cf8', fontSize: 9, position: 'insideTopRight' }} />
                      <Area type="monotone" dataKey="billings" name="Billings" stroke="#818cf8" strokeWidth={2} fill="url(#billGrad2)" dot={{ fill: '#818cf8', r: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Feb '25 → Feb '26</span>
                  <span className="text-indigo-400 font-bold">+{Math.round(((MONTHLY_DATA[12].billings - MONTHLY_DATA[0].billings) / MONTHLY_DATA[0].billings) * 100)}% YoY</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4"><Zap className="w-4 h-4 text-blue-400" /><p className="text-xs font-bold text-white uppercase tracking-widest">Notable Trends & Disparities</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {warns.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-950/20 border border-amber-800/20">
                    <TrendingDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div><p className="text-xs font-bold text-amber-300">{d.month} — {d.type}</p><p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{d.detail}</p></div>
                  </div>
                ))}
                {infos.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/20">
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div><p className="text-xs font-bold text-emerald-300">{d.month} — {d.type}</p><p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{d.detail}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── DEPARTMENTAL OPERATIONS — TEAM WORKLOAD ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-black text-white tracking-tight">Departmental Operations — Team Workload</h2>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Team Member</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Role</th>
                <th className="text-center px-4 py-3 font-semibold">Engagements</th>
                <th className="text-center px-4 py-3 font-semibold hidden sm:table-cell">Hrs (This Wk)</th>
                <th className="text-center px-4 py-3 font-semibold hidden md:table-cell">Hrs (Last Wk)</th>
                <th className="text-center px-4 py-3 font-semibold">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {TEAM.map((t, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 md:hidden">{t.role}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{t.role}</td>
                  <td className="px-4 py-3 text-center"><span className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded-full text-xs font-bold">{t.matters}</span></td>
                  <td className="px-4 py-3 text-center text-slate-300 hidden sm:table-cell">{t.hoursThis}h</td>
                  <td className="px-4 py-3 text-center text-slate-500 hidden md:table-cell">{t.hoursLast}h</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${t.utilization >= 85 ? 'bg-red-500' : t.utilization >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${t.utilization}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{t.utilization}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
