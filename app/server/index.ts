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
  CREATE TABLE IF NOT EXISTS words (
    word    TEXT PRIMARY KEY,
    letters TEXT NOT NULL,
    says    TEXT NOT NULL,
    meaning TEXT NOT NULL,
    level   INTEGER NOT NULL
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

// CVC 词库：level 1-6 按 Letters and Sounds Set 1-5 + Phase 3 字母分级
type WordSeed = [word: string, letters: string[], meaning: string, level: number]
const SAYS: Record<string, string> = {
  s: 'sss', a: 'ah', t: 'tuh', p: 'puh', i: 'ih', n: 'nnn', m: 'mmm', d: 'duh',
  g: 'guh', o: 'oh', c: 'kuh', k: 'kuh', e: 'eh', u: 'uh', r: 'ruh', h: 'huh',
  b: 'buh', f: 'fff', l: 'lll', j: 'juh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh',
  z: 'zzz', q: 'kwuh',
}
const WORDS: WordSeed[] = [
  ['sat', ['s', 'a', 't'], '坐（sit 的过去式）', 1],
  ['tap', ['t', 'a', 'p'], '轻敲', 1],
  ['pat', ['p', 'a', 't'], '轻拍', 1],
  ['sit', ['s', 'i', 't'], '坐', 2],
  ['sip', ['s', 'i', 'p'], '小口喝', 2],
  ['tip', ['t', 'i', 'p'], '尖端；小费', 2],
  ['dip', ['d', 'i', 'p'], '蘸', 2],
  ['pit', ['p', 'i', 't'], '坑', 2],
  ['nap', ['n', 'a', 'p'], '小睡', 2],
  ['nip', ['n', 'i', 'p'], '捏；掐', 2],
  ['pan', ['p', 'a', 'n'], '平底锅', 2],
  ['man', ['m', 'a', 'n'], '男人', 2],
  ['map', ['m', 'a', 'p'], '地图', 2],
  ['tin', ['t', 'i', 'n'], '锡罐', 2],
  ['pin', ['p', 'i', 'n'], '大头针', 2],
  ['pad', ['p', 'a', 'd'], '便签本', 2],
  ['dad', ['d', 'a', 'd'], '爸爸', 2],
  ['sad', ['s', 'a', 'd'], '悲伤的', 2],
  ['mad', ['m', 'a', 'd'], '疯狂的', 2],
  ['dim', ['d', 'i', 'm'], '昏暗的', 2],
  // Level 3：+ Set 3 (g, o, c, k)
  ['dog', ['d', 'o', 'g'], '狗', 3],
  ['cat', ['c', 'a', 't'], '猫', 3],
  ['got', ['g', 'o', 't'], '得到（get 的过去式）', 3],
  ['kid', ['k', 'i', 'd'], '小孩', 3],
  ['pot', ['p', 'o', 't'], '锅', 3],
  ['cot', ['c', 'o', 't'], '简易小床', 3],
  ['cap', ['c', 'a', 'p'], '帽子', 3],
  ['gap', ['g', 'a', 'p'], '缺口；差距', 3],
  ['top', ['t', 'o', 'p'], '顶部', 3],
  ['mop', ['m', 'o', 'p'], '拖把', 3],
  ['dig', ['d', 'i', 'g'], '挖', 3],
  ['pig', ['p', 'i', 'g'], '猪', 3],
  // Level 4：+ Set 4 (ck, e, u, r)
  ['red', ['r', 'e', 'd'], '红色', 4],
  ['ten', ['t', 'e', 'n'], '十', 4],
  ['net', ['n', 'e', 't'], '网', 4],
  ['pet', ['p', 'e', 't'], '宠物', 4],
  ['get', ['g', 'e', 't'], '得到', 4],
  ['mud', ['m', 'u', 'd'], '泥', 4],
  ['mug', ['m', 'u', 'g'], '马克杯', 4],
  ['rug', ['r', 'u', 'g'], '小地毯', 4],
  ['run', ['r', 'u', 'n'], '跑', 4],
  ['rat', ['r', 'a', 't'], '老鼠', 4],
  ['cup', ['c', 'u', 'p'], '杯子', 4],
  ['cut', ['c', 'u', 't'], '剪', 4],
  ['nut', ['n', 'u', 't'], '坚果', 4],
  ['sun', ['s', 'u', 'n'], '太阳', 4],
  // Level 5：+ Set 5 (h, b, f, l；ff/ll/ss 双写见课程)
  ['hat', ['h', 'a', 't'], '帽子', 5],
  ['hen', ['h', 'e', 'n'], '母鸡', 5],
  ['hit', ['h', 'i', 't'], '击打', 5],
  ['ham', ['h', 'a', 'm'], '火腿', 5],
  ['bag', ['b', 'a', 'g'], '包', 5],
  ['big', ['b', 'i', 'g'], '大的', 5],
  ['bug', ['b', 'u', 'g'], '小虫', 5],
  ['bat', ['b', 'a', 't'], '球棒；蝙蝠', 5],
  ['fan', ['f', 'a', 'n'], '风扇；迷', 5],
  ['fun', ['f', 'u', 'n'], '乐趣', 5],
  ['fig', ['f', 'i', 'g'], '无花果', 5],
  ['leg', ['l', 'e', 'g'], '腿', 5],
  ['log', ['l', 'o', 'g'], '原木', 5],
  ['lip', ['l', 'i', 'p'], '嘴唇', 5],
  ['hill', ['h', 'i', 'l', 'l'], '小山', 5],
  ['ball', ['b', 'a', 'l', 'l'], '球', 5],
  // Level 6：+ Phase 3 字母 (j, v, w, x, y, z, q)
  ['jam', ['j', 'a', 'm'], '果酱', 6],
  ['jet', ['j', 'e', 't'], '喷气式飞机', 6],
  ['van', ['v', 'a', 'n'], '厢式货车', 6],
  ['vet', ['v', 'e', 't'], '兽医', 6],
  ['wet', ['w', 'e', 't'], '湿的', 6],
  ['web', ['w', 'e', 'b'], '网', 6],
  ['win', ['w', 'i', 'n'], '赢', 6],
  ['box', ['b', 'o', 'x'], '盒子', 6],
  ['fox', ['f', 'o', 'x'], '狐狸', 6],
  ['six', ['s', 'i', 'x'], '六', 6],
  ['yes', ['y', 'e', 's'], '是', 6],
  ['yak', ['y', 'a', 'k'], '牦牛', 6],
  ['zip', ['z', 'i', 'p'], '拉链', 6],
  ['zoo', ['z', 'o', 'o'], '动物园', 6],
  ['quiz', ['q', 'u', 'i', 'z'], '小测验', 6],
]

// 幂等种子：新词自动补进已有数据库，不清空伙伴的历史成绩
const insWord = db.prepare('INSERT OR IGNORE INTO words (word, letters, says, meaning, level) VALUES (?, ?, ?, ?, ?)')
for (const [word, letters, meaning, level] of WORDS) {
  const says = letters.map((l) => SAYS[l] ?? l)
  insWord.run(word, JSON.stringify(letters), JSON.stringify(says), meaning, level)
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

app.get('/api/words', (c) => {
  const rows = db.prepare('SELECT * FROM words ORDER BY level, word').all() as Array<{
    word: string; letters: string; says: string; meaning: string; level: number
  }>
  return c.json(rows.map((r) => ({
    ...r,
    letters: JSON.parse(r.letters) as string[],
    says: JSON.parse(r.says) as string[],
  })))
})

// 生产模式：伺服前端构建产物 + SPA 回退
app.use('*', serveStatic({ root: path.relative(process.cwd(), distDir) || '.' }))
app.get('*', serveStatic({ path: path.join(distDir, 'index.html') }))

const PORT = Number(process.env.PORT) || 3210

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`learn-phonics 运行中 → http://localhost:${info.port}`)
})
