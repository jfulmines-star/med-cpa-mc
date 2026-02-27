import { useState, useRef, useEffect } from 'react'
import { parseTimeCommand, addEntry } from '../timekeeper'
import { Brain, Send, User, Loader2 } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'bonadio_mc_v1'

const WELCOME: Message = {
  role: 'assistant',
  content: `I'm Aria. I know your active matters, your clients, and what's coming up on the calendar.

Ask me anything: walk through a matter, research a tax question, draft a client memo, or check a deadline. What do you need?`,
}

function loadHistory(): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Message[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return [WELCOME]
}

function saveHistory(messages: Message[]) {
  try {
    // Don't save mid-stream empty assistant messages; cap at 50 messages to prevent localStorage bloat
    const toSave = messages
      .filter(m => m.content.trim() !== '' || m.role === 'user')
      .slice(-50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* ignore */ }
}

function renderContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const boldLine = line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`)
    if (line === '---') return <hr key={i} className="border-slate-700/60 my-3" />
    if (line.startsWith('# '))  return <p key={i} className="text-base font-black text-white mt-3 mb-1 first:mt-0" dangerouslySetInnerHTML={{ __html: boldLine.slice(2) }} />
    if (line.startsWith('## ')) return <p key={i} className="text-sm font-bold text-amber-300 mt-3 mb-1 first:mt-0" dangerouslySetInnerHTML={{ __html: boldLine.slice(3) }} />
    if (line.startsWith('### ')) return <p key={i} className="text-sm font-semibold text-slate-200 mt-2 mb-0.5 first:mt-0" dangerouslySetInnerHTML={{ __html: boldLine.slice(4) }} />
    if (/^\d+\.\s/.test(line)) return <p key={i} className="ml-4 mt-1" dangerouslySetInnerHTML={{ __html: boldLine }} />
    if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="ml-3 mt-1 before:content-['·'] before:mr-2 before:text-amber-500 before:font-bold" dangerouslySetInnerHTML={{ __html: boldLine.slice(2) }} />
    if (line.trim() === '') return <br key={i} />
    return <p key={i} className="mt-1.5 first:mt-0" dangerouslySetInnerHTML={{ __html: boldLine }} />
  })
}

async function streamLex(
  messages: Message[],
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch('/api/lex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) throw new Error('API error')
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try { onChunk((JSON.parse(data) as { text: string }).text) } catch { /* skip */ }
    }
  }
}

export default function LexChat() {
  const [messages, setMessages] = useState<Message[]>(() => loadHistory())
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Scroll refs
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const streamingMsgRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastResponseLengthRef = useRef(0)

  // Persist conversation to localStorage whenever a response finishes
  useEffect(() => {
    if (!loading) saveHistory(messages)
  }, [loading, messages])

  // When loading starts → scroll to top of new message so user reads from the beginning
  useEffect(() => {
    if (loading && streamingMsgRef.current) {
      streamingMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading])

  function appendMessage(userMsg: Message, historyForApi: Message[]) {
    lastResponseLengthRef.current = 0
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    streamLex(historyForApi, (text) => {
      lastResponseLengthRef.current += text.length
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        updated[updated.length - 1] = { ...last, content: last.content + text }
        return updated
      })
    })
      .catch(() => {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: 'Something went wrong. Please try again.' }
          return updated
        })
      })
      .finally(() => {
        setLoading(false)
        inputRef.current?.focus()
        if (lastResponseLengthRef.current > 1000) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `That one was built to last — and for work like this, a messaging setup would serve you better long-term. Talk to ASG. They can move me to Slack or Teams without losing a single thread. Same me, smoother home.`
            }])
          }, 800)
        }
      })
  }

  // Pick up prefilled question from dashboard quick-actions
  useEffect(() => {
    const prefill = sessionStorage.getItem('aria_prefill')
    if (!prefill) return
    sessionStorage.removeItem('aria_prefill')
    setTimeout(() => {
      const userMsg: Message = { role: 'user', content: prefill }
      appendMessage(userMsg, [userMsg])
    }, 150)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function send() {
    const text = input.trim()
    if (!text || loading) return

    // ── Timekeeper intercept ──────────────────────────────────────────────────
    const timeParsed = parseTimeCommand(text)
    if (timeParsed) {
      const entry = addEntry({
        clientId: timeParsed.clientId,
        date: new Date().toISOString().slice(0, 10),
        hours: timeParsed.hours,
        description: timeParsed.description || 'Time entry via Lex',
        status: 'unbilled',
      })
      const confirm = `Got it — logged **${entry.hours}h** to **${timeParsed.clientName}** as unbilled.${timeParsed.description ? ` Description: "${timeParsed.description}".` : ''} You can review and mark it billed in the Timekeeper page.`
      setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: confirm }])
      setInput('')
      return
    }
    // ─────────────────────────────────────────────────────────────────────────

    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg].slice(-20)
    appendMessage(userMsg, history)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const lastIsStreaming = loading && messages[messages.length - 1]?.role === 'assistant'

  return (
    <div className="flex flex-col h-[calc(100dvh-52px)] md:h-screen">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-800 flex items-center gap-3 shrink-0">
        <Brain className="w-5 h-5 text-blue-400" />
        <div>
          <p className="text-sm font-bold text-white">Ask Aria</p>
          <p className="text-xs text-slate-500">AI Tax Advisor · All matters loaded</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" /><span className="text-xs text-blue-400">Thinking...</span></>
          ) : (
            <><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs text-slate-500">Active</span></>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-8 py-6 space-y-5">
        {messages.map((m, i) => {
          const isStreamingMsg = lastIsStreaming && i === messages.length - 1
          return (
            <div
              key={i}
              ref={isStreamingMsg ? streamingMsgRef : undefined}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                m.role === 'user' ? 'bg-slate-700' : 'bg-amber-900/40 border border-amber-700/40'
              }`}>
                {m.role === 'user'
                  ? <User className="w-3.5 h-3.5 text-slate-300" />
                  : <Brain className="w-3.5 h-3.5 text-blue-400" />}
              </div>
              <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-slate-800 text-slate-200 rounded-tr-sm'
                  : 'bg-amber-950/20 border border-amber-800/20 text-slate-200 rounded-tl-sm'
              }`}>
                {m.content
                  ? renderContent(m.content)
                  : <span className="animate-pulse text-slate-500">▍</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="px-8 py-5 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-amber-700/50 transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
            placeholder="Ask Aria about a client, deadline, or tax question anything — matter research, document drafting, deadline analysis..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Send className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-600">Lex is an AI assistant — not licensed legal counsel. Always apply your professional judgment.</p>
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); setMessages([WELCOME]) }}
            className="text-xs text-slate-700 hover:text-slate-500 transition-colors shrink-0 ml-4"
          >
            Clear conversation
          </button>
        </div>
      </div>
    </div>
  )
}
