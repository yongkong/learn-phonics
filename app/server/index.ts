import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const distDir = path.join(__dirname, '..', 'dist')
mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(path.join(dataDir, 'phonics.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS phonemes (
    letter  TEXT PRIMARY KEY,
    ord     INTEGER NOT NULL,
    sound   TEXT NOT NULL,
    say     TEXT NOT NULL,
    words   TEXT NOT NULL,
    phase   INTEGER NOT NULL,
    set_no  INTEGER
  );
  CREATE TABLE IF NOT EXISTS progress (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname   TEXT NOT NULL,
    mode       TEXT NOT NULL,
    score      INTEGER NOT NULL,
    total      INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// Letters and Sounds (DfE 2007) Phase 2 Set 1-5 + Phase 3 字母集；ord = 教学顺序（SATPIN 优先）
type Seed = [letter: string, sound: string, say: string, words: string[], phase: number, setNo: number | null]
const SEED: Seed[] = [
  ['s', '/s/', 'sss', ['sun', 'sit', 'bus'], 2, 1],
  ['a', '/æ/', 'ah', ['ant', 'cat', 'map'], 2, 1],
  ['t', '/t/', 'tuh', ['tap', 'ten', 'sit'], 2, 1],
  ['p', '/p/', 'puh', ['pen', 'pig', 'cap'], 2, 1],
  ['i', '/ɪ/', 'ih', ['pig', 'sit', 'fin'], 2, 2],
  ['n', '/n/', 'nnn', ['net', 'sun', 'man'], 2, 2],
  ['m', '/m/', 'mmm', ['man', 'map', 'ham'], 2, 2],
  ['d', '/d/', 'duh', ['dog', 'red', 'dad'], 2, 2],
  ['g', '/g/', 'guh', ['gap', 'big', 'leg'], 2, 3],
  ['o', '/ɒ/', 'oh', ['hot', 'dog', 'box'], 2, 3],
  ['c', '/k/', 'kuh', ['cat', 'cup', 'cot'], 2, 3],
  ['k', '/k/', 'kuh', ['kit', 'kid', 'sock'], 2, 3],
  ['e', '/e/', 'eh', ['bed', 'red', 'hen'], 2, 4],
  ['u', '/ʌ/', 'uh', ['bus', 'cup', 'sun'], 2, 4],
  ['r', '/r/', 'ruh', ['rat', 'red', 'run'], 2, 4],
  ['h', '/h/', 'huh', ['hat', 'hen', 'hop'], 2, 5],
  ['b', '/b/', 'buh', ['bed', 'big', 'bus'], 2, 5],
  ['f', '/f/', 'fff', ['fan', 'fish', 'frog'], 2, 5],
  ['l', '/l/', 'lll', ['leg', 'log', 'doll'], 2, 5],
  ['j', '/dʒ/', 'juh', ['jam', 'jog', 'jet'], 3, null],
  ['v', '/v/', 'vvv', ['van', 'vet', 'five'], 3, null],
  ['w', '/w/', 'wuh', ['wet', 'win', 'web'], 3, null],
  ['x', '/ks/', 'ks', ['box', 'fox', 'six'], 3, null],
  ['y', '/j/', 'yuh', ['yes', 'yak', 'yell'], 3, null],
  ['z', '/z/', 'zzz', ['zip', 'zoo', 'buzz'], 3, null],
  ['q', '/kw/', 'kwuh', ['quiz', 'quit', 'queen'], 3, null],
]

const { c: phonemeCount } = db.prepare('SELECT COUNT(*) AS c FROM phonemes').get() as { c: number }
if (phonemeCount === 0) {
  const ins = db.prepare('INSERT INTO phonemes (letter, ord, sound, say, words, phase, set_no) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const [i, seed] of SEED.entries()) {
    const [letter, sound, say, words, phase, setNo] = seed
    ins.run(letter, i, sound, say, JSON.stringify(words), phase, setNo)
  }
  console.log(`Seeded ${SEED.length} phonemes.`)
}

const app = new Hono()

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/phonemes', (c) => {
  const rows = db.prepare('SELECT * FROM phonemes ORDER BY ord').all() as Array<{
    letter: string; ord: number; sound: string; say: string; words: string; phase: number; set_no: number | null
  }>
  return c.json(rows.map((r) => ({ ...r, words: JSON.parse(r.words) as string[] })))
})

app.post('/api/progress', async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const nickname = String(body.nickname ?? '').trim().slice(0, 20)
  const mode = String(body.mode ?? 'listen-letter').slice(0, 30)
  const score = Math.max(0, Math.min(100, Number(body.score) | 0))
  const total = Math.max(1, Math.min(100, Number(body.total) | 0))
  if (!nickname) return c.json({ error: 'nickname required' }, 400)
  db.prepare('INSERT INTO progress (nickname, mode, score, total) VALUES (?, ?, ?, ?)').run(nickname, mode, score, total)
  return c.json({ ok: true })
})

app.get('/api/leaderboard', (c) => {
  const rows = db.prepare(`
    SELECT nickname,
           COUNT(*)              AS sessions,
           SUM(score)            AS correct,
           SUM(total)            AS questions,
           ROUND(100.0 * SUM(score) / SUM(total), 1) AS accuracy,
           MAX(created_at)       AS last_played
    FROM progress
    GROUP BY nickname
    ORDER BY correct DESC, accuracy DESC
    LIMIT 20
  `).all()
  return c.json(rows)
})

// 生产模式：伺服前端构建产物 + SPA 回退
app.use('*', serveStatic({ root: path.relative(process.cwd(), distDir) || '.' }))
app.get('*', serveStatic({ path: path.join(distDir, 'index.html') }))

const PORT = Number(process.env.PORT) || 3210

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`learn-phonics 运行中 → http://localhost:${info.port}`)
})
