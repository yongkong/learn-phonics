import { Hono } from 'hono'
import { getDb, ready, storage } from './db'
import { PHONEMES, WORDS } from './content'

// API 应用：音素/词库来自静态内容（任何部署都可用）；
// 成绩记录依赖存储（本地文件 / Turso，Vercel 未配 Turso 时返回 503）。
export function createApp() {
  const app = new Hono()

  app.get('/api/health', (c) => c.json({ ok: true, storage }))

  app.get('/api/phonemes', (c) => c.json(PHONEMES))

  app.get('/api/words', (c) => c.json(WORDS))

  app.post('/api/progress', async (c) => {
    const db = getDb()
    if (!db) return c.json({ error: 'storage not configured' }, 503)
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
    const db = getDb()
    if (!db) return c.json([])
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
