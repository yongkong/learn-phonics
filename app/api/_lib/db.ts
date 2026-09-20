import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 存储三模式（只负责成绩记录；音素/词库是静态内容，见 content.ts）：
//   1. 配置了 TURSO_DATABASE_URL → Turso 远程 SQLite（Vercel 生产推荐，数据持久）
//   2. 本地开发 → app/data/phonics.db 文件
//   3. Vercel 且未配置 Turso → 无存储（progress/leaderboard 返回 503/空，站点其余功能完整）
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tursoUrl = process.env.TURSO_DATABASE_URL
export const storage: 'turso' | 'local' | null =
  tursoUrl ? 'turso' : process.env.VERCEL ? null : 'local'

export type Db = import('@libsql/client').Client

let _db: Db | null = null

// 动态导入：无存储的部署（Vercel 未配 Turso）绝不加载原生模块
export function getDb(): Db | null {
  return _db
}

export const ready = (async () => {
  if (!storage) return

  const { createClient } = await import('@libsql/client')

  let client
  if (storage === 'turso') {
    client = createClient({ url: tursoUrl!, authToken: process.env.TURSO_AUTH_TOKEN })
  } else {
    const dataDir = path.join(__dirname, '..', 'data')
    mkdirSync(dataDir, { recursive: true })
    client = createClient({ url: 'file:' + path.join(dataDir, 'phonics.db').replace(/\\/g, '/') })
  }
  _db = client as Db

  await _db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS progress (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname   TEXT NOT NULL,
      mode       TEXT NOT NULL,
      score      INTEGER NOT NULL,
      total      INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
})().catch((e) => {
  console.error('DB init failed:', e)
  _db = null
})
