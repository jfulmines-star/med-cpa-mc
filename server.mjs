import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = 5176

// ── Anthropic key ─────────────────────────────────────────────────────────────
let ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) {
  try {
    const auth = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw/agents/main/agent/auth.json'), 'utf8'))
    ANTHROPIC_API_KEY = auth.ANTHROPIC_API_KEY || auth.anthropicApiKey || auth.apiKey
  } catch { /* will fail at request time */ }
}

// ── MIME types ────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Lex, an AI legal advisor embedded in BMB Legal Advisory's Mission Control — a solo and small law firm practice management tool.

PRACTICE CONTEXT
BMB Legal Advisory is a solo/boutique practice handling:
- Business formation and transactional work (LLCs, corporations, operating agreements, M&A)
- Commercial litigation (breach of contract, mechanics liens, landlord-tenant disputes)
- Startup and venture law (SAFEs, equity issuance, founder agreements, Series A prep)
- General business counsel (employment, IP, NDA, non-compete)

PRIMARY JURISDICTIONS
- New Jersey (commercial litigation, NJ LLC Act, NJ mechanics lien law, NJ employment)
- New York (NY LLC Act, CPLR, NY employment)
- Delaware (incorporation, franchise tax, corporate governance, DGCL)

ACTIVE MATTERS CONTEXT
Northgate Holdings LLC (NJ LLC):
- EIN 83-2741956 | File NJ0420825 | Formed Oct 14, 2025 | Hudson County NJ
- Commercial lease dispute: Hearthstone Realty v. Northgate Holdings (HUD-L-0442-26)
- Plaintiff claiming $54,800 holdover damages. Answer due March 2, 2026.
- Key defenses: ROFR breach, waiver via acceptance of rent, holdover calculation dispute, failure to mitigate
- Client address: 412 Commerce Drive, Suite 200, Jersey City, NJ 07302

Summit Technology Partners Inc. (DE C-Corp):
- EIN 87-3920145 | DE File 7901244 | Formed Jan 8, 2026
- 12,000,000 authorized shares at $0.00001 par
- SAFE round in progress: $500K, $6M post-money cap, 20% discount. Lead investor execution deadline: March 6, 2026
- Two founders, RSPAs executed Jan 15, 2026. PIIAs executed.
- Delaware franchise tax: use APVC method (March 2027 due)
- Office: 88 Pine Street, Floor 14, New York, NY 10005

Wellington Contractors LLC (NJ):
- Mechanics lien matter. $41,200 owed on Bergen County residential renovation.
- Certificate of substantial completion: Feb 9, 2026. NJ 90-day lien window closes May 9, 2026.
- Lien filing deadline: March 9, 2026 (preferred — do not wait)

Eastbrook Distribution Inc. (NJ asset purchase):
- $325K asset sale. NJ UCC Article 9 bulk transfer requirements.
- Closing: March 14, 2026. Bill of sale, assignment of contracts, vendor agreements drafted.

Crestview Medical Group LLC (NJ professional LLC):
- Three-member medical practice. NJ professional LLC formation.
- Operating agreement executed. All three members must sign before patient intake.
- Deadline: March 21, 2026.

YOUR ROLE
- Answer legal questions directly and precisely — never vague or over-hedged
- Reference specific statutes, case law, and procedural rules when applicable
- Draft legal documents when asked (pleadings, demand letters, memos, agreements)
- Always flag deadlines and procedural risks proactively
- You are counsel's research partner and drafting engine — not a disclaimer machine
- Format responses with clear headers using markdown bold (**text**) for structure
- Be direct. Solo practitioners don't have time for hedged non-answers.`

// ── POST /api/lex — Anthropic streaming ──────────────────────────────────────
async function handleLex(req, res) {
  let body = ''
  req.on('data', d => (body += d))
  req.on('end', async () => {
    try {
      const { messages } = JSON.parse(body)
      if (!ANTHROPIC_API_KEY) { res.writeHead(500); return res.end('Missing API key'); }

      const payload = JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        stream: true,
        messages,
      })

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload),
        },
      }

      const https = await import('https')
      const apiReq = https.default.request(options, (apiRes) => {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        })
        apiRes.on('data', chunk => res.write(chunk))
        apiRes.on('end', () => res.end())
      })
      apiReq.on('error', e => { console.error(e); res.writeHead(500); res.end('API error') })
      apiReq.write(payload)
      apiReq.end()
    } catch (e) {
      console.error(e)
      res.writeHead(400)
      res.end('Bad request')
    }
  })
}

// ── Static file server ────────────────────────────────────────────────────────
function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0]
  let filePath = path.join(DIST, urlPath)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html')
  }
  const ext = path.extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' })
  fs.createReadStream(filePath).pipe(res)
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
  if (req.method === 'POST' && req.url === '/api/lex') return handleLex(req, res)
  serveStatic(req, res)
})

server.listen(PORT, () => console.log(`BMB MC running → http://localhost:${PORT}`))
