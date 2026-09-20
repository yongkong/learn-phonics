import { Hono } from 'hono'
import { db, ready } from './db'

// 纯 API 应用（本地由 server/main.ts 伺服静态；Vercel 由 api/[...route].ts 承载）
export function createApp() {
  const app = new Hono()

  app.get('/api/health', (c) => c.json({ ok: true }))

  app.get('/api/phonemes', async (c) => {
    await ready
    const rs = await db.execute('SELECT * FROM phonemes ORDER BY ord')
    return c.json(rs.rows.map((r) => ({
      letter: String(r.letter),
      ord: Number(r.ord),
      sound: String(r.sound),
      say: String(r.say),
      words: JSON.parse(String(r.words)) as string[],
      phase: Number(r.phase),
      set_no: r.set_no == null ? null : Number(r.set_no),
    })))
  })

  app.get('/api/words', async (c) => {
    await ready
    const rs = await db.execute('SELECT * FROM words ORDER BY level, word')
    return c.json(rs.rows.map((r) => ({
      word: String(r.word),
      letters: JSON.parse(String(r.letters)) as string[],
      says: JSON.parse(String(r.says)) as string[],
      meaning: String(r.meaning),
      level: Number(r.level),
    })))
  })

  app.post('/api/progress', async (c) => {
    await ready
    const body = await c.req.json<Record<string, unknown>>()
    const nickname = String(body.nickname ?? '').trim().slice(0, 20)
    const mode = String(body.mode ?? 'listen-letter').slice(0, 30)
    const score = Math.max(0, Math.min(100, Number(body.score) | 0))
    const total = Math.max(1, Math.min(100, Number(body.total) | 0))
    if (!nickname) return c.json({ error: 'nickname required' }, 400)
    await db.execute({
      sql: 'INSERT INTO progress (nickname, mode, score, total) VALUES (?, ?, ?, ?)',
      args: [nickname, mode, score, total],
    })
    return c.json({ ok: true })
  })

  app.get('/api/leaderboard', async (c) => {
    await ready
    const rs = await db.execute(`
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
    `)
    return c.json(rs.rows.map((r) => ({
      nickname: String(r.nickname),
      sessions: Number(r.sessions),
      correct: Number(r.correct),
      questions: Number(r.questions),
      accuracy: Number(r.accuracy),
      last_played: String(r.last_played),
    })))
  })

  return app
}
