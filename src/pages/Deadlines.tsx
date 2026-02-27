import { CalendarClock, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

const DEADLINES = [
  { date: 'Mar 3, 2026',  matter: 'Meridian Capital — M&A Tax Due Diligence',       client: 'Meridian Capital Partners LLC',  priority: 'High',   status: 'Pending',   desc: 'Deliver final tax due diligence memo; §338(h)(10) election recommendation and §1060 allocation schedule.' },
  { date: 'Mar 10, 2026', matter: 'Pinnacle Manufacturing — DTF IDR Response',       client: 'Pinnacle Manufacturing LLC',       priority: 'High',   status: 'Pending',   desc: 'Respond to NYS DTF Information Document Request in residency audit. Day-count analysis and domicile factor memo.' },
  { date: 'Mar 15, 2026', matter: 'Cascade Hospitality — FY2025 Consolidated Return', client: 'Cascade Hospitality Group Inc.',  priority: 'High',   status: 'In Progress', desc: '12-state combined/unitary returns + federal consolidated. Final apportionment workpapers due to filing team.' },
  { date: 'Mar 17, 2026', matter: 'Northbrook Equity — §754 Statement',              client: 'Northbrook Equity Partners LP',   priority: 'Medium', status: 'Pending',   desc: 'Draft §754 election statement and §743(b) basis adjustment schedule for incoming LPs. Coordinate with fund counsel.' },
  { date: 'Mar 28, 2026', matter: 'Trident Software — R&D Credit Study',             client: 'Trident Software Holdings Inc.',   priority: 'Medium', status: 'Pending',   desc: 'Deliver final §41 credit study. QRE documentation, wage qualification, and §280C(c) reduced credit recommendation.' },
  { date: 'Apr 4, 2026',  matter: 'Keystone Logistics — COD Income Memo',            client: 'Keystone Logistics Partners Inc.', priority: 'Low',    status: 'Pending',   desc: 'COD income memo under §108 and attribute reduction schedule under §1017 for $3.2M debt forgiveness.' },
  { date: 'Apr 15, 2026', matter: 'Federal Extended Returns — FY2025',               client: 'Multiple Clients',                 priority: 'High',   status: 'Pending',   desc: 'Extended federal return deadline for calendar-year entities. Confirm extensions filed for all affected clients.' },
]

const PRIORITY_COLORS: Record<string, string> = {
  High: 'border-l-red-500',
  Medium: 'border-l-amber-500',
  Low: 'border-l-slate-600',
}
const STATUS_BADGE: Record<string, string> = {
  'Pending': 'bg-slate-700/50 text-slate-400',
  'In Progress': 'bg-blue-900/30 text-blue-300',
  'Complete': 'bg-green-900/30 text-green-300',
}

export default function Deadlines() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <CalendarClock className="w-6 h-6 text-blue-400" />
        <h1 className="text-xl font-bold text-white">Deadlines</h1>
        <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{DEADLINES.length} upcoming</span>
      </div>

      <div className="space-y-3">
        {DEADLINES.map((d, i) => (
          <div key={i} className={`bg-slate-900 border border-slate-800 border-l-4 ${PRIORITY_COLORS[d.priority]} rounded-xl px-5 py-4`}>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-sm font-semibold text-white">{d.matter}</p>
                <p className="text-xs text-slate-500">{d.client}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[d.status]}`}>{d.status}</span>
                <span className="text-xs font-mono text-blue-300 bg-blue-950/40 px-2 py-1 rounded">{d.date}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{d.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
