import { FileText, ExternalLink } from 'lucide-react'

const ENTRIES = [
  {
    date: 'Feb 26, 2026', matter: 'BlueStone Family Office — PTET Refund',
    question: 'Federal taxability of NY PTET overpayment refund to individual partners',
    finding: 'IRS has issued no Notice, Revenue Ruling, or CCA directly addressing the federal taxability of PTET refunds to individual partners. The AICPA has published an FAQ flagging the guidance gap. Applying the tax benefit rule under §111 by analogy: refund is taxable to the extent the original PTET payment generated a federal deduction at the entity level (confirmed by Notice 2020-75). Disclosure position recommended pending IRS guidance.',
    sources: ['IRC §111', 'IRS Notice 2020-75', 'AICPA FAQ on PTET Refund Taxability'],
  },
  {
    date: 'Feb 25, 2026', matter: 'Pinnacle Manufacturing — NY Residency Audit',
    question: '§§ 605(b) and 612 — statutory residency threshold and domicile factors for NY audit',
    finding: 'Statutory resident if individual maintains permanent place of abode AND is present in NY >183 days. Co-op ownership qualifies as permanent place of abode (Matter of Barker, Tax Appeals Tribunal). Day count must exclude days of presence for less than 24 hours. Remote work days from FL do not count as NY days. DTF audit typically requires calendar and travel documentation; credit card and cell phone records increasingly used.',
    sources: ['NY Tax Law §605(b)', 'NY Tax Law §612', 'Matter of Barker (TAT)', 'TSB-M-06(5)I'],
  },
  {
    date: 'Feb 22, 2026', matter: 'Meridian Capital — §338(h)(10) Election',
    question: '§338(h)(10) election mechanics and consequences in stock acquisition of S-corp target',
    finding: '§338(h)(10) treats stock purchase as deemed asset sale for federal tax purposes. Seller recognizes gain at asset level (not capital gain on stock). Buyer receives stepped-up basis equal to AGUB. Election requires joint filing of Form 8023. Allocation of AGUB follows §1060/Reg. 1.338-6 residual method. Must be S-corp or 80% subsidiary of consolidated group. Confirm NY follows §338(h)(10) treatment (NY does conform).',
    sources: ['IRC §338(h)(10)', 'Treas. Reg. §1.338-6', 'IRC §1060', 'Form 8023 Instructions'],
  },
  {
    date: 'Feb 20, 2026', matter: 'Northbrook Equity — §754 Election',
    question: '§743(b) basis adjustment mechanics on secondary transfer of LP interests',
    finding: 'Upon transfer of partnership interest, §743(b) adjustment equals difference between transferee\'s outside basis and proportionate share of inside basis. Positive adjustment allocated to appreciated assets under §755. Election is irrevocable; applies to all transfers and distributions once made. Basis adjustments tracked per-partner and reduce/increase gain/loss recognized on subsequent disposition.',
    sources: ['IRC §743', 'IRC §754', 'IRC §755', 'Treas. Reg. §1.743-1'],
  },
  {
    date: 'Feb 18, 2026', matter: 'Trident Software — R&D Credit',
    question: 'Contractor payment qualification under §41 — "funded research" exclusion',
    finding: 'Payments to third-party contractors for qualified research activities are eligible QREs unless research is "funded" by the contractor relationship (i.e., contractor bears financial risk and retains rights). If Trident owns IP and bears financial risk, contractor wages qualify. Reg. 1.41-2(e) controls. Key issue: language in contractor agreements — "work for hire" vs. retained rights. Recommend reviewing all contractor MSAs before finalizing credit study.',
    sources: ['IRC §41', 'Treas. Reg. §1.41-2(e)', 'Fairchild Industries v. US (Fed. Cir.)'],
  },
  {
    date: 'Feb 15, 2026', matter: 'Keystone Logistics — §108 COD Income',
    question: '§108 insolvency exclusion calculation and attribute reduction ordering under §1017',
    finding: 'COD income excluded to extent taxpayer is insolvent immediately before discharge. Insolvency = excess of liabilities over FMV of assets. Excluded COD reduces tax attributes in order: NOLs, general business credits, minimum tax credits, capital loss carryovers, basis in property, passive loss carryovers, foreign tax credits. Basis reduction limited to aggregate adjusted basis of depreciable property unless taxpayer elects to apply to other property first.',
    sources: ['IRC §108', 'IRC §1017', 'Treas. Reg. §1.1017-1', 'Form 982'],
  },
]

export default function Research() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-400" />
        <h1 className="text-xl font-bold text-white">Research Log</h1>
        <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{ENTRIES.length} entries</span>
      </div>

      <div className="space-y-4">
        {ENTRIES.map((e, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">{e.date} · {e.matter}</p>
                <p className="text-sm font-semibold text-white">{e.question}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">{e.finding}</p>
            <div className="flex flex-wrap gap-2">
              {e.sources.map((s, j) => (
                <span key={j} className="text-xs bg-blue-950/40 text-blue-300 border border-blue-900/30 px-2 py-1 rounded font-mono">{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
