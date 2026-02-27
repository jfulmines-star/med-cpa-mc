import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, CheckCircle2, Filter, Scale, AlertCircle, Timer } from 'lucide-react'
import {
  getEntries, addEntry, updateEntry, deleteEntry,
  parseTimeCommand, CLIENT_IDS, CLIENT_SHORT, CLIENT_FULL,
  TimeEntry, UPDATE_EVENT,
} from '../timekeeper'

function today() { return new Date().toISOString().slice(0, 10) }

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Timekeeper() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [filterClient, setFilterClient] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'billed' | 'unbilled'>('all')

  // Manual form
  const [form, setForm] = useState({ clientId: '', date: today(), hours: '', description: '', status: 'unbilled' as 'unbilled' | 'billed' })
  const [formError, setFormError] = useState('')

  // Lex quick command
  const [lexInput, setLexInput] = useState('')
  const [lexFeedback, setLexFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const reload = () => setEntries(getEntries())
  useEffect(() => {
    reload()
    window.addEventListener(UPDATE_EVENT, reload)
    return () => window.removeEventListener(UPDATE_EVENT, reload)
  }, [])

  // Filter + sort
  const filtered = entries
    .filter(e => filterClient === 'all' || e.clientId === filterClient)
    .filter(e => filterStatus === 'all' || e.status === filterStatus)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

  // Group by date
  const grouped: Record<string, TimeEntry[]> = {}
  for (const e of filtered) { (grouped[e.date] = grouped[e.date] || []).push(e) }

  // Summary
  const monthTotal   = entries.filter(e => e.date.startsWith('2026-02')).reduce((s, e) => s + e.hours, 0)
  const billedTotal  = entries.filter(e => e.status === 'billed').reduce((s, e) => s + e.hours, 0)
  const unbilledTotal = entries.filter(e => e.status === 'unbilled').reduce((s, e) => s + e.hours, 0)
  const activeClients = new Set(entries.map(e => e.clientId)).size

  function handleManualAdd() {
    if (!form.clientId) return setFormError('Select a client')
    const h = parseFloat(form.hours)
    if (isNaN(h) || h <= 0) return setFormError('Enter valid hours (e.g. 1.5)')
    if (!form.description.trim()) return setFormError('Add a description')
    setFormError('')
    addEntry({ clientId: form.clientId, date: form.date, hours: h, description: form.description.trim(), status: form.status })
    setForm(f => ({ ...f, hours: '', description: '' }))
  }

  function handleLexCommand() {
    if (!lexInput.trim()) return
    const parsed = parseTimeCommand(lexInput)
    if (!parsed) {
      setLexFeedback({ ok: false, msg: 'Could not parse. Try: "Bill 2 hours to Northgate for answer draft"' })
      setTimeout(() => setLexFeedback(null), 5000)
      return
    }
    addEntry({ clientId: parsed.clientId, date: today(), hours: parsed.hours, description: parsed.description || 'Time entry via Lex command', status: 'unbilled' })
    setLexFeedback({ ok: true, msg: `Logged ${parsed.hours}h to ${parsed.clientName}${parsed.description ? ` — "${parsed.description}"` : ''}` })
    setLexInput('')
    setTimeout(() => setLexFeedback(null), 4000)
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Timer className="w-6 h-6 text-amber-400" /> Timekeeper
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Log and review billable time by client · changes sync to the dashboard</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Feb 2026 Total', val: `${monthTotal}h`,    color: 'text-white'      },
          { label: 'Billed',         val: `${billedTotal}h`,   color: 'text-sky-400'    },
          { label: 'Unbilled',       val: `${unbilledTotal}h`, color: 'text-slate-300'  },
          { label: 'Active Clients', val: String(activeClients), color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column: entry forms + client summary ── */}
        <div className="space-y-4">

          {/* Lex quick command */}
          <div className="bg-slate-900/60 border border-amber-700/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-bold text-white">Log via Lex Command</p>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">Try: "Bill 3 hours to Northgate for answer draft"</p>
            <div className="flex gap-2">
              <input
                value={lexInput}
                onChange={e => setLexInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLexCommand()}
                placeholder="Bill 2 hours to Summit..."
                className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-600/50"
              />
              <button onClick={handleLexCommand} className="shrink-0 px-3 py-2 rounded-lg bg-amber-600/20 border border-amber-700/30 text-amber-400 hover:bg-amber-600/30 transition-colors text-xs font-bold">
                Log
              </button>
            </div>
            {lexFeedback && (
              <div className={`mt-2 flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${lexFeedback.ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {lexFeedback.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <span>{lexFeedback.msg}</span>
              </div>
            )}
            <p className="text-[9px] text-slate-600 mt-3">
              You can also log time from the Lex chat on any page — just type "Bill X hours to [client]" and Lex handles the rest.
            </p>
          </div>

          {/* Manual entry */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-bold text-white">Manual Entry</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Client</label>
                <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600/50">
                  <option value="">Select client...</option>
                  {CLIENT_IDS.map(id => <option key={id} value={id}>{CLIENT_SHORT[id]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600/50" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Hours</label>
                  <input type="number" step="0.25" min="0.25" max="24" value={form.hours}
                    onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                    placeholder="0.0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600/50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                  placeholder="Work performed..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-600/50" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                <div className="flex gap-2">
                  {(['unbilled', 'billed'] as const).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.status === s ? (s === 'billed' ? 'bg-sky-500/20 border-sky-500/40 text-sky-400' : 'bg-slate-700 border-slate-600 text-white') : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <button onClick={handleManualAdd}
                className="w-full py-2.5 rounded-xl bg-amber-600/20 border border-amber-700/30 text-amber-400 hover:bg-amber-600/30 transition-colors text-sm font-bold flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Log Time Entry
              </button>
            </div>
          </div>

          {/* Hours by client */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Hours by Client</p>
            <div className="space-y-2">
              {CLIENT_IDS.map(id => {
                const ce = entries.filter(e => e.clientId === id)
                const b = ce.filter(e => e.status === 'billed').reduce((s, e) => s + e.hours, 0)
                const u = ce.filter(e => e.status === 'unbilled').reduce((s, e) => s + e.hours, 0)
                if (b + u === 0) return null
                return (
                  <div key={id} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 truncate">{CLIENT_SHORT[id]}</span>
                    <div className="flex items-center gap-2 shrink-0 text-[10px]">
                      <span className="text-sky-400">{b}h billed</span>
                      {u > 0 && <span className="text-slate-400">{u}h unbilled</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Right column: entry log ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
              <option value="all">All clients</option>
              {CLIENT_IDS.map(id => <option key={id} value={id}>{CLIENT_SHORT[id]}</option>)}
            </select>
            <div className="flex gap-1">
              {(['all', 'unbilled', 'billed'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-600 ml-auto">{filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}</span>
          </div>

          {/* Entry list */}
          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 text-slate-600 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No entries match your filters.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, dayEntries]) => (
              <div key={date} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                  <p className="text-xs font-bold text-white">{fmtDate(date)}</p>
                  <p className="text-xs text-slate-500 tabular-nums">{dayEntries.reduce((s, e) => s + e.hours, 0)}h</p>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {dayEntries.map(entry => (
                    <div key={entry.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-800/20 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-bold text-white">{CLIENT_SHORT[entry.clientId] || entry.clientId}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${entry.status === 'billed' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{entry.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-black text-white tabular-nums">{entry.hours}h</span>
                        <div className="hidden group-hover:flex items-center gap-1">
                          {entry.status === 'unbilled' && (
                            <button onClick={() => updateEntry(entry.id, { status: 'billed' })} title="Mark billed"
                              className="p-1 rounded hover:bg-sky-500/20 text-slate-500 hover:text-sky-400 transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => deleteEntry(entry.id)} title="Delete"
                            className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
