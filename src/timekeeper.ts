// ── Timekeeper — Med CPA MC ───────────────────────────────────────────────────
export type TimeEntry = {
  id: string; clientId: string; date: string; hours: number
  description: string; status: 'unbilled' | 'billed'; createdAt: number
}
export type ParsedTimeCommand = {
  clientId: string; clientName: string; hours: number; description: string
}
const STORAGE_KEY = 'bonadio_timekeeper'
export const UPDATE_EVENT = 'timekeeper-updated'

export const CLIENT_SHORT: Record<string, string> = {
  meridian:   'Meridian Capital', cascade:    'Cascade Hospitality',
  northbrook: 'Northbrook Equity', pinnacle:   'Pinnacle Mfg',
  trident:    'Trident Software',  harborview: 'Harborview RE',
  bluestone:  'BlueStone Family',  keystone:   'Keystone Logistics',
}
export const CLIENT_FULL: Record<string, string> = {
  meridian:   'Meridian Capital Partners LLC',
  cascade:    'Cascade Hospitality Group Inc.',
  northbrook: 'Northbrook Equity Partners LP',
  pinnacle:   'Pinnacle Manufacturing LLC',
  trident:    'Trident Software Holdings Inc.',
  harborview: 'Harborview Real Estate Group LLC',
  bluestone:  'BlueStone Family Office LLC',
  keystone:   'Keystone Logistics Partners Inc.',
}
export const CLIENT_IDS = Object.keys(CLIENT_SHORT)

const ALIASES: Record<string, string> = {
  'meridian': 'meridian', 'meridian capital': 'meridian', 'meridian capital partners': 'meridian',
  'cascade': 'cascade', 'cascade hospitality': 'cascade', 'cascade hospitality group': 'cascade',
  'northbrook': 'northbrook', 'northbrook equity': 'northbrook', 'northbrook equity partners': 'northbrook',
  'pinnacle': 'pinnacle', 'pinnacle manufacturing': 'pinnacle', 'pinnacle mfg': 'pinnacle',
  'trident': 'trident', 'trident software': 'trident', 'trident software holdings': 'trident',
  'harborview': 'harborview', 'harborview real estate': 'harborview', 'harborview re': 'harborview',
  'bluestone': 'bluestone', 'bluestone family': 'bluestone', 'bluestone family office': 'bluestone',
  'keystone': 'keystone', 'keystone logistics': 'keystone', 'keystone logistics partners': 'keystone',
}

export function getEntries(): TimeEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function save(entries: TimeEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}
export function addEntry(e: Omit<TimeEntry, 'id' | 'createdAt'>): TimeEntry {
  const entry: TimeEntry = { ...e, id: `te-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, createdAt: Date.now() }
  const all = getEntries(); all.push(entry); save(all); return entry
}
export function updateEntry(id: string, patch: Partial<TimeEntry>) {
  const all = getEntries(); const i = all.findIndex(e => e.id === id)
  if (i !== -1) { all[i] = { ...all[i], ...patch }; save(all) }
}
export function deleteEntry(id: string) { save(getEntries().filter(e => e.id !== id)) }
export function getAllClientHours(): Record<string, { billed: number; unbilled: number }> {
  const out: Record<string, { billed: number; unbilled: number }> = {}
  for (const e of getEntries()) {
    if (!out[e.clientId]) out[e.clientId] = { billed: 0, unbilled: 0 }
    out[e.clientId][e.status] += e.hours
  }
  return out
}
export function parseTimeCommand(input: string): ParsedTimeCommand | null {
  const lower = input.toLowerCase().trim()
  const m = lower.match(/(?:bill|log|record|add|track|enter|charge)\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)?\s+(?:to|for|on)\s+([a-z][a-z\s]*)(?:\s+(?:for|on|re[:\s]|[-])\s*(.+))?$/)
  if (!m) return null
  const hours = parseFloat(m[1])
  if (isNaN(hours) || hours <= 0 || hours > 24) return null
  const raw = m[2].trim().replace(/\s+/g, ' ')
  const desc = m[3]?.trim() || ''
  let clientId = ALIASES[raw]
  if (!clientId) {
    for (const [alias, id] of Object.entries(ALIASES)) {
      if (raw.startsWith(alias) || alias.startsWith(raw)) { clientId = id; break }
    }
  }
  if (!clientId) return null
  return { clientId, clientName: CLIENT_FULL[clientId], hours, description: desc }
}
export function seedIfEmpty() {
  if (getEntries().length > 0) return
  const seed: Omit<TimeEntry, 'id' | 'createdAt'>[] = [
    // Meridian Capital — 28 billed, 6 unbilled
    { clientId: 'meridian',   date: '2026-02-03', hours: 8,  description: 'M&A tax due diligence — target federal return review and NOL analysis',         status: 'billed'   },
    { clientId: 'meridian',   date: '2026-02-10', hours: 8,  description: '§338(h)(10) election analysis and §1060 purchase price allocation schedule',    status: 'billed'   },
    { clientId: 'meridian',   date: '2026-02-18', hours: 8,  description: 'NY/OH apportionment analysis for surviving entity post-acquisition',             status: 'billed'   },
    { clientId: 'meridian',   date: '2026-02-25', hours: 4,  description: 'Due diligence memo draft — partner review preparation',                          status: 'billed'   },
    { clientId: 'meridian',   date: '2026-02-26', hours: 6,  description: 'Final memo revisions and buyer counsel coordination',                             status: 'unbilled' },
    // Cascade Hospitality — 42 billed, 12 unbilled
    { clientId: 'cascade',    date: '2026-02-02', hours: 10, description: 'FY2025 multistate returns — CA, NY, TX, FL, IL apportionment workpapers',        status: 'billed'   },
    { clientId: 'cascade',    date: '2026-02-09', hours: 12, description: 'NJ, OH, PA, NC, GA, CO, AZ nexus and apportionment factor review',               status: 'billed'   },
    { clientId: 'cascade',    date: '2026-02-17', hours: 12, description: 'Hotel management contract revenue sourcing — cost of performance analysis',       status: 'billed'   },
    { clientId: 'cascade',    date: '2026-02-24', hours: 8,  description: 'Consolidated return workpaper review — all 12 states final check',               status: 'billed'   },
    { clientId: 'cascade',    date: '2026-02-26', hours: 12, description: 'State returns final prep and filing team handoff package',                        status: 'unbilled' },
    // Northbrook Equity — 22 billed, 8 unbilled
    { clientId: 'northbrook', date: '2026-02-04', hours: 7,  description: 'LP restructuring analysis — §751 hot asset review, incoming LP admission',       status: 'billed'   },
    { clientId: 'northbrook', date: '2026-02-12', hours: 8,  description: '§743(b) basis adjustment schedule — secondary LP interest transfers',             status: 'billed'   },
    { clientId: 'northbrook', date: '2026-02-19', hours: 7,  description: '§755 asset allocation of §743(b) adjustment — partnership asset classes',        status: 'billed'   },
    { clientId: 'northbrook', date: '2026-02-25', hours: 8,  description: '§754 election statement draft and LP admission document coordination',            status: 'unbilled' },
    // Pinnacle Manufacturing — 18 billed, 4 unbilled
    { clientId: 'pinnacle',   date: '2026-02-05', hours: 6,  description: 'NYS DTF residency audit — day-count analysis, domicile factor review',           status: 'billed'   },
    { clientId: 'pinnacle',   date: '2026-02-13', hours: 7,  description: 'Manhattan co-op usage documentation — travel records and expense analysis',      status: 'billed'   },
    { clientId: 'pinnacle',   date: '2026-02-20', hours: 5,  description: 'FL domicile memo — six domicile factor analysis and supporting evidence',        status: 'billed'   },
    { clientId: 'pinnacle',   date: '2026-02-25', hours: 4,  description: 'IDR response draft — coordination with litigation counsel',                       status: 'unbilled' },
    // Trident Software — 24 billed, 6 unbilled
    { clientId: 'trident',    date: '2026-02-04', hours: 8,  description: 'R&D credit QRE identification — software development activities review',          status: 'billed'   },
    { clientId: 'trident',    date: '2026-02-11', hours: 8,  description: 'IRC 41 wage and supply cost documentation — employee interviews and records',     status: 'billed'   },
    { clientId: 'trident',    date: '2026-02-19', hours: 8,  description: 'R&D credit computation and ASC 740 FIN 48 reserve analysis',                    status: 'billed'   },
    { clientId: 'trident',    date: '2026-02-26', hours: 6,  description: 'R&D credit study report draft — partner review preparation',                     status: 'unbilled' },
    // Harborview RE — 10 billed, 3 unbilled
    { clientId: 'harborview', date: '2026-02-06', hours: 5,  description: 'OZ fund investment compliance — IRC 1400Z-2 deferred gain calculation',          status: 'billed'   },
    { clientId: 'harborview', date: '2026-02-17', hours: 5,  description: '10-year exclusion planning and QOF investment basis step-up analysis',            status: 'billed'   },
    { clientId: 'harborview', date: '2026-02-24', hours: 3,  description: 'Annual OZ compliance report — Form 8996 and investor disclosure package',        status: 'unbilled' },
    // BlueStone Family — 14 billed, 4 unbilled
    { clientId: 'bluestone',  date: '2026-02-05', hours: 5,  description: 'NY PTET election analysis — 2023/2024 overpayment calculation',                  status: 'billed'   },
    { clientId: 'bluestone',  date: '2026-02-13', hours: 5,  description: '§111 tax benefit rule analysis — PTET refund federal taxability research',       status: 'billed'   },
    { clientId: 'bluestone',  date: '2026-02-20', hours: 4,  description: 'Notice 2020-75 application — entity-level deduction and partner credit review',  status: 'billed'   },
    { clientId: 'bluestone',  date: '2026-02-26', hours: 4,  description: 'Client memo draft — PTET refund taxability advisory',                            status: 'unbilled' },
    // Keystone Logistics — 8 billed, 2 unbilled
    { clientId: 'keystone',   date: '2026-02-09', hours: 4,  description: 'COD income analysis — §108 insolvency exclusion qualification',                  status: 'billed'   },
    { clientId: 'keystone',   date: '2026-02-18', hours: 4,  description: 'Tax attribute reduction schedule — NOLs, credits, basis under §1017',            status: 'billed'   },
    { clientId: 'keystone',   date: '2026-02-25', hours: 2,  description: 'Phase 1 memo — §108 exclusion and attribute reduction summary',                  status: 'unbilled' },
  ]
  let t = Date.now() - seed.length * 1000
  for (const e of seed) {
    const all = getEntries()
    all.push({ ...e, id: `seed-${t}`, createdAt: t++ })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  }
  window.dispatchEvent(new Event(UPDATE_EVENT))
}
