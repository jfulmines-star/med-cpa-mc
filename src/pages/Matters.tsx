import { useState } from 'react'
import { Briefcase, ChevronDown, ChevronUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

const MATTERS = [
  {
    id: 'M-001', client: 'Meridian Capital Partners LLC', matter: 'Acquisition of Lakeview Industrial Holdings',
    status: 'Active', priority: 'High',
    summary: 'Stock acquisition of Lakeview Industrial Holdings Inc. for $48M. RJ leading federal/state tax structuring, §338(h)(10) election analysis, and purchase price allocation under §1060. NY and OH apportionment implications for surviving entity.',
    next: 'Deliver final tax due diligence memo — due March 3, 2026',
  },
  {
    id: 'M-002', client: 'Cascade Hospitality Group Inc.', matter: 'Multistate Consolidated Return — FY2025',
    status: 'Active', priority: 'High',
    summary: 'Annual federal consolidated return + 12-state combined/unitary filings for Cascade Hospitality Group. Apportionment factor analysis across CA, NY, TX, FL, IL, NJ, OH, PA, NC, GA, CO, AZ. Revenue from hotel management contracts creates nexus complexity.',
    next: 'Final apportionment workpapers — due March 15, 2026',
  },
  {
    id: 'M-003', client: 'Northbrook Equity Partners LP', matter: 'Partnership Restructuring & §754 Election',
    status: 'Active', priority: 'Medium',
    summary: 'Restructuring of $120M LP to facilitate admission of new institutional LPs and secondary transfer of existing interests. §754 election and §743(b) basis adjustments for transferee partners. Coordination with fund counsel on subscription docs.',
    next: 'Draft §754 election statement and §743(b) adjustment schedule',
  },
  {
    id: 'M-004', client: 'Pinnacle Manufacturing LLC', matter: 'NYS Tax Controversy — Residency Audit',
    status: 'Active', priority: 'High',
    summary: "NYS DTF audit of owner's statutory residency status. Taxpayer maintains domicile in FL; owns co-op in Manhattan used ~130 days/year. RJ coordinating with litigation counsel on day-count documentation and domicile factors. $2.1M in dispute.",
    next: 'Response to DTF Information Document Request — due March 10, 2026',
  },
  {
    id: 'M-005', client: 'Trident Software Holdings Inc.', matter: 'R&D Tax Credit Study — FY2024',
    status: 'Active', priority: 'Medium',
    summary: 'Qualified research expenditure study under §41 for SaaS platform development. RJ leading contractor payment analysis, wage qualification documentation, and §280C(c) reduced credit election decision. Estimated credit: $340K.',
    next: 'Final credit study deliverable — due March 28, 2026',
  },
  {
    id: 'M-006', client: 'Harborview Real Estate Group LLC', matter: 'Opportunity Zone Investment Exit Planning',
    status: 'Active', priority: 'Medium',
    summary: 'Planning exit from Qualified Opportunity Zone Fund investment. Taxpayer invested $2.8M deferred gain in Dec 2020. 10-year exclusion threshold reached Dec 2030; pre-exit memo needed for sale planning. Coordination of §1231 gain treatment.',
    next: 'Draft pre-exit planning memo with projected tax scenarios',
  },
  {
    id: 'M-007', client: 'BlueStone Family Office LLC', matter: 'PTET Election & Refund Analysis — 2023/2024',
    status: 'Active', priority: 'Medium',
    summary: 'Analysis of NY PTET overpayment for tax years 2023 and 2024. Entity-level refund of $185K; individual partners questioning federal taxability of refund. RJ advising on §111 tax benefit rule application and disclosure position given open IRS guidance gap.',
    next: 'Client memo on PTET refund federal taxability — in progress',
  },
  {
    id: 'M-008', client: 'Keystone Logistics Partners Inc.', matter: 'Debt Restructuring — COD Income Analysis',
    status: 'Active', priority: 'Low',
    summary: 'Lender agreed to forgive $3.2M of unsecured debt. RJ analyzing §108 COD income exclusions (insolvency, qualified real property business indebtedness). Attribute reduction ordering under §1017. S-corp shareholder-level implications under §1366.',
    next: 'COD income memo and attribute reduction schedule — due April 4, 2026',
  },
]

const PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-red-900/30 text-red-300 border border-red-800/40',
  Medium: 'bg-amber-900/30 text-amber-300 border border-amber-800/40',
  Low: 'bg-slate-700/30 text-slate-400 border border-slate-700/40',
}

export default function Matters() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="w-6 h-6 text-blue-400" />
        <h1 className="text-xl font-bold text-white">Active Matters</h1>
        <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{MATTERS.length} active</span>
      </div>

      <div className="space-y-3">
        {MATTERS.map(m => (
          <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-800/60 transition-colors">
            <button className="w-full text-left px-5 py-4 flex items-center gap-4" onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 font-mono">{m.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[m.priority]}`}>{m.priority}</span>
                  <span className="text-xs bg-blue-900/30 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded-full">{m.status}</span>
                </div>
                <p className="text-sm font-semibold text-white truncate">{m.client}</p>
                <p className="text-xs text-slate-400 truncate">{m.matter}</p>
              </div>
              {expanded === m.id ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
            </button>

            {expanded === m.id && (
              <div className="px-5 pb-5 border-t border-slate-800 pt-4 space-y-3">
                <p className="text-sm text-slate-300 leading-relaxed">{m.summary}</p>
                <div className="flex items-start gap-2 bg-blue-950/30 border border-blue-900/30 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-300">{m.next}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
