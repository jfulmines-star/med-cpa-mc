import { useState } from 'react'
import { Building2, FileText, Brain, ChevronDown, Hash, Calendar, MapPin, DollarSign, Send, User, Download, ExternalLink, AlertTriangle } from 'lucide-react'

// ─── DATA ────────────────────────────────────────────────────────────────────

const CLIENTS = [
  {
    id: 'meridian',
    name: 'Meridian Capital Partners LLC',
    short: 'Meridian Capital',
    type: 'Delaware LLC — Investment Holding Company',
    color: 'blue' as const,
    partner: 'Tax Partner',
    since: 'Mar 2023',
    entity: {
      ein: '82-4103956',
      fileNumber: 'DE-7442198',
      formed: 'February 28, 2023',
      state: 'Delaware (Foreign — NY registered)',
      address: '1221 Avenue of the Americas, Suite 4400, New York, NY 10020',
      agent: 'CT Corporation System',
      nextFiling: 'DE Annual Report — June 1, 2026',
      engagement: 'M&A Tax Advisory, ASC 740, Multistate Compliance',
    },
    documents: [
      { name: 'FY2024 Federal Tax Return (Form 1065)', type: 'Tax', date: 'Oct 15, 2025', ref: 'EIN 82-4103956', file: '/docs/meridian/2024-form-1065.pdf' },
      { name: 'FY2024 NY IT-204 Partnership Return', type: 'Tax', date: 'Oct 15, 2025', ref: 'MCP-NY-2024', file: '/docs/meridian/2024-ny-it204.pdf' },
      { name: '§338(h)(10) Election Analysis — Lakeview Acquisition', type: 'Advisory', date: 'Feb 15, 2026', ref: 'MCP-ADV-2026-01', file: '/docs/meridian/338h10-analysis.pdf' },
      { name: 'M&A Tax Due Diligence — Lakeview Industrial Holdings', type: 'Advisory', date: 'Draft — Mar 3, 2026', ref: 'MCP-DD-2026-01', file: '/docs/meridian/due-diligence-draft.pdf' },
      { name: '§1060 Purchase Price Allocation Schedule', type: 'Workpaper', date: 'Draft', ref: 'MCP-WP-2026-01', file: '/docs/meridian/ppa-schedule.pdf' },
      { name: 'Engagement Letter — FY2025 Tax Services', type: 'Engagement', date: 'Jan 6, 2026', ref: 'TBG-MCP-2026', file: '/docs/meridian/engagement-letter-2026.pdf' },
    ],
    complianceFlag: {
      title: 'M&A Memo Due March 3',
      detail: '§338(h)(10) election recommendation and §1060 purchase price allocation schedule due to buyer counsel. RJ to deliver final memo. Ask Aria to walk through the election mechanics.',
    },
    seeds: [
      { role: 'user', text: 'Walk me through the §338(h)(10) election for the Lakeview acquisition. What are the key considerations?' },
      { role: 'assistant', text: `The §338(h)(10) election is the critical structuring decision here. Here is the full picture for the Meridian/Lakeview transaction:

**What the Election Does**
A §338(h)(10) election allows Meridian (as buyer) and the target shareholders to jointly elect to treat the stock purchase as an asset acquisition for federal tax purposes. The selling shareholders are deemed to sell target's assets — not their stock — generating a stepped-up basis in the target's assets for Meridian.

**The Business Case**
- Meridian gets a full fair-market-value basis in Lakeview's assets immediately at closing
- Basis step-up drives future depreciation and amortization deductions (§197 intangibles over 15 years)
- On a $48M acquisition, the NPV of the basis step-up can exceed $8-10M depending on asset composition

**Requirements**
1. Target must be an S-Corp, consolidated subsidiary, or subsidiary member of an affiliated group — confirm Lakeview's entity structure
2. Both buyer and seller must consent — the election is joint
3. Form 8023 must be filed by the 15th day of the 9th month after the acquisition date
4. The deemed asset sale triggers corporate-level gain at the target — sellers must factor this into price negotiations

**Key Risk: Seller Tax Cost**
The §338(h)(10) election converts what would be capital gain (stock sale) into ordinary income on the deemed asset sale for certain assets (inventory, receivables, §1245 recapture). Sellers typically demand a gross-up in the purchase price. Model the seller's after-tax cost before finalizing the election.

**§1060 Purchase Price Allocation**
Once the election is made, §1060 governs how the AGUB (Adjusted Grossed-Up Basis) is allocated across Lakeview's assets in the following priority order: cash → securities → receivables → inventory → other assets → IRC §197 intangibles → goodwill. The allocation drives Meridian's future deductions.

Want me to build out the AGUB calculation and allocation schedule?` },
      { role: 'user', text: 'Yes — draft the AGUB calculation framework.' },
      { role: 'assistant', text: `**AGUB Calculation Framework — Meridian / Lakeview Industrial Holdings**

The Adjusted Grossed-Up Basis (AGUB) is computed as follows under Treas. Reg. §1.338-5:

---

**Step 1: Grossed-Up Basis of Acquired Stock**

Formula: (Purchase Price of Acquired Stock ÷ % of Target Stock Acquired) × 100%

Example (placeholder — insert actual figures):
- Meridian pays $48,000,000 for 100% of Lakeview stock
- Grossed-Up Basis = $48,000,000 ÷ 1.00 = **$48,000,000**

---

**Step 2: Add Target Liabilities Assumed**
- Long-term debt assumed: $_______
- Accrued liabilities: $_______
- Other assumed obligations: $_______
- **Total liabilities added: $_______**

---

**Step 3: Less Target's Tax Attributes That Reduce Basis**
- Deferred income items: ($_______)

---

**Total AGUB = $48,000,000 + liabilities − adjustments**

---

**§1060 Asset Class Allocation (Residual Method)**
| Class | Asset Type | Allocated Value |
|-------|------------|----------------|
| I | Cash & cash equivalents | $_______ |
| II | Securities (FMV) | $_______ |
| III | Accounts receivable | $_______ |
| IV | Inventory | $_______ |
| V | All other tangible assets (PP&E) | $_______ |
| VI | IRC §197 intangibles (noncompetes, customer lists, patents) | $_______ |
| VII | Goodwill & going concern value (residual) | $_______ |
| **Total** | | **$48,000,000 + liabilities** |

---

**Depreciation/Amortization Benefit**
- Class V (PP&E): depreciable per §168, likely §179 or bonus depreciation eligible
- Class VI/VII (§197 intangibles + goodwill): amortized straight-line over **15 years**

On a $48M deal with significant goodwill, Class VII allocation alone could drive $3M+ in annual amortization deductions. That is the economic core of the election.

I recommend running a sensitivity analysis: what happens to Meridian's after-tax returns if goodwill is 40% of purchase price vs. 60%?` },
    ],
  },
  {
    id: 'cascade',
    name: 'Cascade Hospitality Group Inc.',
    short: 'Cascade Hospitality',
    type: 'Delaware C-Corporation — Hospitality Holding Company',
    color: 'indigo' as const,
    partner: 'Tax Partner',
    since: 'Jan 2021',
    entity: {
      ein: '76-2894103',
      fileNumber: 'DE-6109872',
      formed: 'January 15, 2019',
      state: 'Delaware (Multistate — 12 state nexus)',
      address: '535 Madison Avenue, 28th Floor, New York, NY 10022',
      agent: 'Corporation Service Company',
      nextFiling: 'Federal Consolidated Return — Apr 15, 2026 (extended)',
      engagement: 'Federal Consolidated Return, Multistate Compliance (12 states)',
    },
    documents: [
      { name: 'FY2024 Federal Consolidated Return (Form 1120)', type: 'Tax', date: 'Oct 15, 2025', ref: 'EIN 76-2894103', file: '/docs/cascade/2024-form-1120.pdf' },
      { name: 'FY2024 Multistate Apportionment Schedules (12 states)', type: 'Workpaper', date: 'Oct 15, 2025', ref: 'CHG-MS-2024', file: '/docs/cascade/2024-apportionment-schedules.pdf' },
      { name: 'FY2025 Apportionment Workpapers — In Progress', type: 'Workpaper', date: 'Draft — Mar 15, 2026', ref: 'CHG-MS-2025', file: '/docs/cascade/2025-apportionment-draft.pdf' },
      { name: 'Hotel Management Contract Revenue — Nexus Analysis', type: 'Advisory', date: 'Jan 20, 2026', ref: 'CHG-ADV-2026-01', file: '/docs/cascade/nexus-analysis-2026.pdf' },
      { name: 'ASC 740 Tax Provision — FY2024', type: 'Financial', date: 'Feb 28, 2025', ref: 'CHG-ASC740-2024', file: '/docs/cascade/asc740-provision-2024.pdf' },
      { name: 'Engagement Letter — FY2025 Tax Services', type: 'Engagement', date: 'Jan 8, 2026', ref: 'TBG-CHG-2026', file: '/docs/cascade/engagement-letter-2026.pdf' },
    ],
    complianceFlag: {
      title: 'FY2025 Workpapers Due March 15',
      detail: 'Final apportionment workpapers for all 12 states required before returns go to filing team. Market-based sourcing applies to management contract revenue — CA, NY, and TX positions need partner sign-off.',
    },
    seeds: [
      { role: 'user', text: 'For Cascade Hospitality with hotel management contract revenue across 12 states, walk me through the key apportionment issues for the FY2025 workpapers.' },
      { role: 'assistant', text: `Hotel management companies are among the most complex multistate taxpayers. Here is the apportionment framework for the FY2025 Cascade Hospitality workpapers:

**The Core Issue: Service Revenue Sourcing**
Cascade earns management fee revenue (typically 2-4% of gross hotel revenue) under management contracts. How that revenue is sourced in the sales factor is the crux of every state's apportionment analysis.

**Two Competing Sourcing Standards**

1. **Cost of Performance (COP)** — Traditional rule. Service revenue is sourced to the state where the income-producing activity is principally performed. For hotel management, that's where Cascade's employees are providing management services (usually at the managed property).

2. **Market-Based Sourcing (MBS)** — Modern majority rule. Revenue is sourced to where the customer receives or benefits from the service. For hotel management, that's typically the state where the hotel is located (where the customer hotel operator is located or where guests are served).

**State-by-State Analysis for Cascade**

| State | Rule | Key Position |
|-------|------|-------------|
| CA | Market-based | Source to CA hotel locations — where hotel guests benefit |
| NY | Market-based | Source to NY — customer benefit location |
| TX | No corporate income tax (franchise tax) | Apply franchise tax margin rules separately |
| FL | COP | Source to where Cascade employees perform services |
| IL | Market-based | Customer's commercial domicile or benefit location |
| NJ | Market-based | Benefit received in NJ |
| OH | Market-based (CAT) | Ohio CAT — commercial activity in Ohio |
| PA | COP | Where services are performed |
| NC | Market-based | Customer benefit location |
| GA | COP | Where services performed |
| CO | Market-based | Customer location |
| AZ | COP transitioning to MBS | Confirm current year rule |

**High-Risk Positions to Flag for Partner Sign-Off**
- **CA**: CA's Franchise Tax Board aggressively asserts MBS. Confirm Cascade has properly calculated the CA sales factor numerator — understating CA revenue is a common audit trigger.
- **NY**: If Cascade has substantial NY hotel management revenue, confirm NYC corporate tax filing is current (NYC imposes its own separate apportionment).
- **TX**: No corporate income tax but TX franchise (margin) tax applies — different apportionment methodology, different base.

**Apportionment Factor Issues Beyond Sales**
- Property factor: Are management company offices included? What about managed hotel properties — does Cascade have property factor in states where it manages but does not own hotels?
- Payroll factor: Multi-state employee allocation — where do traveling management staff's wages apportion?

Want me to build the state-by-state apportionment schedule template?` },
    ],
  },
]

const TYPE_COLOR: Record<string, string> = {
  Formation:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Tax:        'bg-amber-500/10 text-blue-400 border-amber-500/20',
  Financial:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Engagement: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Contract:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Litigation: 'bg-red-500/10 text-red-400 border-red-500/20',
  Corporate:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Investment: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function ClientVault() {
  const [selectedId, setSelectedId] = useState('meridian')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [seeded, setSeeded] = useState(false)
  const [input, setInput] = useState('')

  const client = CLIENTS.find(c => c.id === selectedId)!
  const isBlue = client.color === 'blue'

  const accent = isBlue
    ? { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/25', dot: 'bg-blue-400', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25' }
    : { text: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/25',  dot: 'bg-indigo-400',  badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25'  }

  const switchClient = (id: string) => {
    setSelectedId(id)
    setMobileView('chat')
    setDropdownOpen(false)
    setMessages([])
    setSeeded(false)
    setInput('')
  }

  const loadDemo = () => {
    setMessages(client.seeds.map(s => ({ role: s.role, text: s.text })))
    setSeeded(true)
  }

  const send = () => {
    if (!input.trim()) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Reviewing ${client.name} matter context and applicable law… Let me pull the relevant analysis for you.`
      }])
    }, 700)
  }

  const renderText = (text: string) =>
    text.split('\n').map((line, i) => {
      const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <p key={i}
          className={i > 0 && line === '' ? 'mt-2' : i > 0 ? 'mt-1' : ''}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    })

  return (
    <div className="flex h-[calc(100dvh-52px)] md:h-screen overflow-hidden bg-slate-950">

      {/* ── Left panel ── */}
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-[380px] border-r border-slate-800 flex-col overflow-hidden shrink-0`}>

        {/* Header + client picker */}
        <div className="px-5 py-4 border-b border-slate-800 shrink-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Client Vault</p>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${accent.bg} ${accent.border} ${accent.text}`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{client.short} — {client.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {CLIENTS.map(cl => {
                  const dotColor = cl.color === 'blue' ? 'bg-blue-400' : 'bg-indigo-400'
                  return (
                    <button key={cl.id} onClick={() => switchClient(cl.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${cl.id === selectedId ? 'bg-slate-800/60' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                      <div>
                        <p className="text-sm font-semibold text-white">{cl.name}</p>
                        <p className="text-xs text-slate-500">{cl.type}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Entity card */}
          <div className={`rounded-xl border p-4 ${accent.bg} ${accent.border}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{client.type}</p>
                <p className="text-sm font-black text-white">{client.name}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${accent.badge}`}>Active</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {'ein' in client.entity && (
                <div className="flex items-center gap-1.5 text-slate-400"><Hash className="w-3 h-3" /> EIN: <span className="text-white font-mono">{client.entity.ein}</span></div>
              )}
              {'deFile' in client.entity && (
                <div className="flex items-center gap-1.5 text-slate-400"><Hash className="w-3 h-3" /> DE File #: <span className="text-white font-mono">{(client.entity as any).deFile}</span></div>
              )}
              {'fileNumber' in client.entity && (
                <div className="flex items-center gap-1.5 text-slate-400"><Hash className="w-3 h-3" /> File #: <span className="text-white font-mono">{(client.entity as any).fileNumber}</span></div>
              )}
              <div className="flex items-center gap-1.5 text-slate-400"><Calendar className="w-3 h-3" /> Formed: <span className="text-white">{client.entity.formed}</span></div>
              <div className="flex items-center gap-1.5 text-slate-400"><MapPin className="w-3 h-3" /> <span className="text-white">{client.entity.address}</span></div>
              <div className="flex items-center gap-1.5 text-slate-400"><DollarSign className="w-3 h-3" /> Formation: <span className="text-white font-medium"></span></div>
              {'nextFiling' in client.entity && client.entity.nextFiling && (
                <div className="flex items-center gap-1.5 text-blue-400"><Calendar className="w-3 h-3" /> Next filing: <span className="font-medium">{client.entity.nextFiling}</span></div>
              )}
              {'shares' in client.entity && (
                <div className="flex items-center gap-1.5 text-slate-400"><Brain className="w-3 h-3" /> Shares: <span className="text-white">{(client.entity as any).shares}</span></div>
              )}
            </div>
          </div>

          {/* Attorney */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Attorney of Record</p>
            <p className="text-sm font-semibold text-white">{client.partner}</p>
            <p className="text-xs text-slate-600 mt-1">Engaged since {client.since}</p>
          </div>

          {/* Compliance flag */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Action Required</p>
            </div>
            <p className="text-xs font-semibold text-amber-300 mb-1">{client.complianceFlag.title}</p>
            <p className="text-xs text-amber-200/80 leading-relaxed">{client.complianceFlag.detail}</p>
          </div>

          {/* Document vault */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Document Vault</p>
            <div className="space-y-2">
              {client.documents.map(doc => (
                <div key={doc.name} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white">{doc.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{doc.date} · {doc.ref}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium shrink-0 ${TYPE_COLOR[doc.type] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>{doc.type}</span>
                  </div>
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800">
                    <a href={doc.file} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                    <a href={doc.file} download
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Mobile: tap to open Lex chat for this client */}
        <div className="md:hidden px-4 py-3 border-t border-slate-800 shrink-0">
          <button
            onClick={() => setMobileView('chat')}
            className="w-full py-3 rounded-xl bg-amber-600/20 border border-amber-700/30 text-sm text-blue-400 hover:bg-amber-600/30 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <Brain className="w-4 h-4" /> Ask Aria about {client.name}
          </button>
        </div>
      </div>

      {/* ── Right panel — Lex Chat ── */}
      <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden`}>
        <div className="px-5 py-3.5 border-b border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileView('list')} className="md:hidden mr-1 p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Ask Aria</span>
            <span className="text-xs text-slate-500 hidden sm:inline">· {client.name} context loaded</span>
          </div>
          {!seeded && (
            <button onClick={loadDemo}
              className="text-xs bg-amber-500/10 border border-amber-500/25 text-blue-400 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium">
              Load demo conversation
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Brain className="w-8 h-8 text-blue-400/30 mb-3" />
              <p className="text-sm font-semibold text-slate-400">Lex is ready</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">{client.name} matter context is loaded. Ask anything — defense strategy, filing requirements, deadlines, deal terms.</p>
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                {client.entity && 'fileNumber' in client.entity ? (
                  <>
                    <button onClick={() => setInput("What are our strongest affirmative defenses against Hearthstone's holdover claim?")}
                      className="text-xs bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors">Holdover defenses</button>
                    <button onClick={() => setInput("Draft a demand letter to Hearthstone disputing the holdover calculation.")}
                      className="text-xs bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors">Draft demand letter</button>
                    <button onClick={() => setInput("What discovery should we serve on Hearthstone?")}
                      className="text-xs bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors">Discovery strategy</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setInput("Walk me through the Summit SAFE terms — what do my founders need to know?")}
                      className="text-xs bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors">SAFE terms briefing</button>
                    <button onClick={() => setInput("What is Summit's Delaware franchise tax exposure and how do we minimize it?")}
                      className="text-xs bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors">DE franchise tax</button>
                    <button onClick={() => setInput("What else do Summit's founders need to have in place before the Series A?")}
                      className="text-xs bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors">Series A prep checklist</button>
                  </>
                )}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'lex' && (
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Brain className="w-3.5 h-3.5 text-blue-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
              }`}>
                {renderText(msg.text)}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus-within:border-slate-500 transition-colors">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={`Ask Aria about ${client.short} — strategy, filings, deal terms…`}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            />
            <button onClick={send} disabled={!input.trim()}
              className="text-blue-400 hover:text-amber-300 disabled:opacity-30 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 text-center">Lex has full context of {client.name} matter and applicable law</p>
        </div>
      </div>
    </div>
  )
}
